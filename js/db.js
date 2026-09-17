/* ==================================================================
   Where the household's data lives.

   A SQLite database, held by the browser itself. The plan, the food
   list, your own dishes and the protein timetable are rows in it, and
   it survives reloads, tab closes, browser restarts and reboots. Only
   Reset — or clearing this site's data from Chrome's own settings —
   empties it.

   Worth being straight about one thing: moving off localStorage is
   not by itself what makes the data durable. Chrome keeps every
   storage API for an origin in one bucket and evicts the bucket whole,
   so localStorage was never the weak link. The durability comes from
   navigator.storage.persist(), which asks Chrome to exempt this origin
   from eviction, and from Backup, which is the only copy that outlives
   the browser at all. SQLite earns its place for what it makes
   possible either side of that: a single file you can hand to another
   phone, and room for real queries later.

   The database is a genuine SQLite file kept in IndexedDB, reloaded
   into the engine at startup and written back after each change. The
   obvious alternative is OPFS, where SQLite writes the file directly
   and incrementally — but its VFS needs createSyncAccessHandle, which
   the spec exposes to dedicated workers only, in every browser. Moving
   the whole database into a worker to avoid re-serialising something
   this small would buy complexity and nothing else. If the data ever
   grows past a few hundred kilobytes, that is the change to make.

   Private windows are a deliberate exception and no API changes it.
   Chrome throws away everything an incognito session stored the
   moment its last window closes. Inside the session the database is
   real — reload, navigate, open another tab, it is all still there —
   and that is as far as any web app can go. Backup is the way out.
   ================================================================== */

var Store = (function () {
  'use strict';

  /* Resolved against this file rather than the page. A dynamic import
     inside a classic script takes its base URL from the script, so a
     path written relative to index.html would look for the engine
     under js/ and 404. */
  var SQLITE_MODULE = new URL(
    '../vendor/sqlite/sqlite3.mjs',
    (document.currentScript && document.currentScript.src) || location.href
  ).href;

  var LEGACY_KEY = 'food-menu/v2';    /* the plain-JSON store this replaces */
  var LS_KEY     = 'food-menu/db';    /* base64 database, last resort       */
  var IDB_NAME   = 'food-menu';
  var IDB_STORE  = 'kv';
  var IDB_KEY    = 'database';
  var SCHEMA     = 1;

  var FLUSH_MS = 120;

  /* "SQLite format 3\0" — the first 16 bytes of every database file.
     Lets Restore accept either a .sqlite3 or the JSON fallback without
     asking which one you picked. */
  var MAGIC = [0x53, 0x51, 0x4c, 0x69, 0x74, 0x65, 0x20, 0x66,
               0x6f, 0x72, 0x6d, 0x61, 0x74, 0x20, 0x33, 0x00];

  var sqlite3 = null;
  var db = null;

  var engine = 'json';     /* sql | json  */
  var sink = 'none';       /* indexeddb | localstorage | none */
  var persistent = false;

  var snapshot = null;     /* last known state, the thing app.js reads */
  var flushTimer = null;
  var flushing = null;

  /* ---------------- small helpers ---------------- */

  function lsGet(key) {
    try { return localStorage.getItem(key); } catch (e) { return null; }
  }

  function lsSet(key, value) {
    try { localStorage.setItem(key, value); return true; } catch (e) { return false; }
  }

  function lsDel(key) {
    try { localStorage.removeItem(key); } catch (e) { /* nothing to clear */ }
  }

  function toBase64(bytes) {
    var out = '';
    for (var i = 0; i < bytes.length; i += 0x8000) {
      out += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
    }
    return btoa(out);
  }

  function fromBase64(text) {
    var raw = atob(text);
    var bytes = new Uint8Array(raw.length);
    for (var i = 0; i < raw.length; i++) { bytes[i] = raw.charCodeAt(i); }
    return bytes;
  }

  function looksLikeDatabase(bytes) {
    if (!bytes || bytes.length < MAGIC.length) { return false; }
    for (var i = 0; i < MAGIC.length; i++) {
      if (bytes[i] !== MAGIC[i]) { return false; }
    }
    return true;
  }

  /* ---------------- IndexedDB, just enough of it ---------------- */

  function idbOpen() {
    return new Promise(function (resolve, reject) {
      if (!window.indexedDB) { reject(new Error('no indexedDB')); return; }
      var req = indexedDB.open(IDB_NAME, 1);
      req.onupgradeneeded = function () {
        if (!req.result.objectStoreNames.contains(IDB_STORE)) {
          req.result.createObjectStore(IDB_STORE);
        }
      };
      req.onsuccess = function () { resolve(req.result); };
      req.onerror = function () { reject(req.error); };
      /* Firefox fires this instead of erroring when storage is blocked. */
      req.onblocked = function () { reject(new Error('indexedDB blocked')); };
    });
  }

  function idbRun(mode, fn) {
    return idbOpen().then(function (handle) {
      return new Promise(function (resolve, reject) {
        var tx = handle.transaction(IDB_STORE, mode);
        var req = fn(tx.objectStore(IDB_STORE));
        tx.oncomplete = function () { handle.close(); resolve(req ? req.result : undefined); };
        tx.onerror = function () { handle.close(); reject(tx.error); };
        tx.onabort = function () { handle.close(); reject(tx.error); };
      });
    });
  }

  function idbGet() { return idbRun('readonly', function (s) { return s.get(IDB_KEY); }); }
  function idbPut(v) { return idbRun('readwrite', function (s) { return s.put(v, IDB_KEY); }); }
  function idbClear() { return idbRun('readwrite', function (s) { return s.delete(IDB_KEY); }); }

  /* ---------------- schema ----------------

     off_item, custom_item and protein are real rows because they are
     real things — you can ask "what has this house switched off?" and
     get an answer in SQL.

     A plan slot is stored as JSON in one column, and that is on
     purpose rather than laziness. A slot is a decision the generator
     already made — a main with its sides and whatever protein sits
     beside it. Nothing queries inside one. Splitting it across three
     more tables would buy a join nobody runs. */

  var DDL = [
    'CREATE TABLE IF NOT EXISTS meta (key TEXT PRIMARY KEY, value TEXT NOT NULL)',
    'CREATE TABLE IF NOT EXISTS setting (key TEXT PRIMARY KEY, value TEXT NOT NULL)',
    'CREATE TABLE IF NOT EXISTS protein (day TEXT NOT NULL, meal TEXT NOT NULL,' +
      ' kind TEXT NOT NULL, PRIMARY KEY (day, meal))',
    'CREATE TABLE IF NOT EXISTS off_item (kind TEXT NOT NULL, item TEXT NOT NULL,' +
      ' PRIMARY KEY (kind, item))',
    'CREATE TABLE IF NOT EXISTS custom_item (kind TEXT NOT NULL, item TEXT NOT NULL,' +
      ' body TEXT NOT NULL, PRIMARY KEY (kind, item))',
    'CREATE TABLE IF NOT EXISTS plan (day INTEGER NOT NULL, name TEXT NOT NULL,' +
      ' meal TEXT NOT NULL, body TEXT, locked INTEGER NOT NULL DEFAULT 0,' +
      ' PRIMARY KEY (day, meal))'
  ];

  function migrate() {
    db.exec('BEGIN');
    try {
      DDL.forEach(function (sql) { db.exec(sql); });
      db.exec({
        sql: 'INSERT OR REPLACE INTO meta (key, value) VALUES (?, ?)',
        bind: ['schema', String(SCHEMA)]
      });
      db.exec('COMMIT');
    } catch (e) {
      db.exec('ROLLBACK');
      throw e;
    }
  }

  function rows(sql) {
    var out = [];
    db.exec({ sql: sql, rowMode: 'object', resultRows: out });
    return out;
  }

  /* ---------------- snapshot <-> tables ---------------- */

  var KINDS = [['main', 'Mains'], ['side', 'Sides'], ['addon', 'Addons']];

  /* The domain of plan.meal. A week row also carries its day name, and
     writing whatever keys happen to be on the object put that name in
     the table as though Monday were a meal. */
  var MEALS = ['breakfast', 'lunch', 'dinner'];

  function emptyLibrary() {
    return {
      offMains: {}, offSides: {}, offAddons: {},
      customMains: [], customSides: [], customAddons: []
    };
  }

  function readSql() {
    var settings = { protein: {} };

    rows('SELECT key, value FROM setting').forEach(function (r) {
      try { settings[r.key] = JSON.parse(r.value); } catch (e) { /* skip a bad row */ }
    });

    rows('SELECT day, meal, kind FROM protein').forEach(function (r) {
      if (!settings.protein[r.day]) { settings.protein[r.day] = {}; }
      settings.protein[r.day][r.meal] = r.kind;
    });

    var library = emptyLibrary();

    rows('SELECT kind, item FROM off_item').forEach(function (r) {
      var bucket = library['off' + labelFor(r.kind)];
      if (bucket) { bucket[r.item] = true; }
    });

    rows('SELECT kind, item, body FROM custom_item').forEach(function (r) {
      var bucket = library['custom' + labelFor(r.kind)];
      if (!bucket) { return; }
      try { bucket.push(JSON.parse(r.body)); } catch (e) { /* skip a bad row */ }
    });

    var week = null;
    var locked = {};
    var planRows = rows('SELECT day, name, meal, body, locked FROM plan');

    if (planRows.length) {
      week = [0, 1, 2, 3, 4, 5, 6].map(function () { return {}; });
      planRows.forEach(function (r) {
        if (r.day < 0 || r.day > 6) { return; }
        if (MEALS.indexOf(r.meal) === -1) { return; }

        week[r.day].day = r.name;

        var slot = null;
        if (r.body) { try { slot = JSON.parse(r.body); } catch (e) { slot = null; } }
        week[r.day][r.meal] = slot;
        if (r.locked) { locked[r.day + '-' + r.meal] = true; }
      });
    }

    return { settings: settings, library: library, week: week, locked: locked };
  }

  function labelFor(kind) {
    for (var i = 0; i < KINDS.length; i++) {
      if (KINDS[i][0] === kind) { return KINDS[i][1]; }
    }
    return '';
  }

  /* The whole state is a few hundred rows at most, so every save
     rewrites all of it inside one transaction. A diff would be faster
     in a way nobody could measure and wrong in ways that are hard to
     find. */
  function writeSql(next) {
    var settings = next.settings || {};
    var library = next.library || emptyLibrary();

    db.exec('BEGIN');
    try {
      db.exec('DELETE FROM setting');
      db.exec('DELETE FROM protein');
      db.exec('DELETE FROM off_item');
      db.exec('DELETE FROM custom_item');
      db.exec('DELETE FROM plan');

      Object.keys(settings).forEach(function (key) {
        if (key === 'protein') { return; }
        db.exec({
          sql: 'INSERT INTO setting (key, value) VALUES (?, ?)',
          bind: [key, JSON.stringify(settings[key])]
        });
      });

      Object.keys(settings.protein || {}).forEach(function (day) {
        Object.keys(settings.protein[day]).forEach(function (meal) {
          db.exec({
            sql: 'INSERT INTO protein (day, meal, kind) VALUES (?, ?, ?)',
            bind: [day, meal, settings.protein[day][meal]]
          });
        });
      });

      KINDS.forEach(function (pair) {
        var kind = pair[0];
        var off = library['off' + pair[1]] || {};
        Object.keys(off).forEach(function (item) {
          if (!off[item]) { return; }
          db.exec({
            sql: 'INSERT OR IGNORE INTO off_item (kind, item) VALUES (?, ?)',
            bind: [kind, item]
          });
        });

        (library['custom' + pair[1]] || []).forEach(function (dish) {
          if (!dish || !dish.id) { return; }
          db.exec({
            sql: 'INSERT OR REPLACE INTO custom_item (kind, item, body) VALUES (?, ?, ?)',
            bind: [kind, dish.id, JSON.stringify(dish)]
          });
        });
      });

      (next.week || []).forEach(function (row, index) {
        if (!row) { return; }
        MEALS.forEach(function (meal) {
          var slot = row[meal];
          db.exec({
            sql: 'INSERT OR REPLACE INTO plan (day, name, meal, body, locked)' +
                 ' VALUES (?, ?, ?, ?, ?)',
            bind: [index, row.day || '', meal, slot ? JSON.stringify(slot) : null,
                   (next.locked || {})[index + '-' + meal] ? 1 : 0]
          });
        });
      });

      db.exec('COMMIT');
    } catch (e) {
      db.exec('ROLLBACK');
      throw e;
    }
  }

  /* ---------------- getting a database open ---------------- */

  function loadSqlite() {
    if (sqlite3) { return Promise.resolve(sqlite3); }
    /* A dynamic import from a classic script — no build step, and it
       simply rejects over file://, which is one of the reasons the
       fallback chain below exists. */
    return import(SQLITE_MODULE)
      .then(function (mod) { return mod.default({ print: null, printErr: null }); })
      .then(function (mod) { sqlite3 = mod; return mod; });
  }

  function exportBytes() {
    if (engine !== 'sql' || !db) { return null; }
    return sqlite3.capi.sqlite3_js_db_export(db.pointer);
  }

  function importBytes(bytes) {
    var p = sqlite3.wasm.allocFromTypedArray(bytes);
    var rc = sqlite3.capi.sqlite3_deserialize(
      db.pointer, 'main', p, bytes.length, bytes.length,
      sqlite3.capi.SQLITE_DESERIALIZE_FREEONCLOSE |
      sqlite3.capi.SQLITE_DESERIALIZE_RESIZEABLE
    );
    db.checkRc(rc);
  }

  function trySqliteBytes(where) {
    return loadSqlite().then(function (mod) {
      return (where === 'indexeddb' ? idbGet() : Promise.resolve(lsGet(LS_KEY)))
        .then(function (stored) {
          db = new mod.oo1.DB(':memory:', 'c');
          var bytes = null;
          if (stored instanceof Uint8Array) { bytes = stored; }
          else if (stored instanceof ArrayBuffer) { bytes = new Uint8Array(stored); }
          else if (typeof stored === 'string' && stored) { bytes = fromBase64(stored); }

          if (bytes && looksLikeDatabase(bytes)) { importBytes(bytes); }

          engine = 'sql';
          sink = where;
          return true;
        });
    });
  }

  function tryJson(where) {
    if (where === 'indexeddb') {
      return idbGet().then(function () { engine = 'json'; sink = 'indexeddb'; return true; });
    }
    /* Probe rather than assume — Safari with cookies blocked throws on
       the first write, not on open. */
    if (!lsSet(LS_KEY + '/probe', '1')) { throw new Error('no localStorage'); }
    lsDel(LS_KEY + '/probe');
    engine = 'json';
    sink = 'localstorage';
    return Promise.resolve(true);
  }

  function attempt(list) {
    if (!list.length) {
      engine = 'json';
      sink = 'none';
      return Promise.resolve();
    }
    return Promise.resolve()
      .then(list[0])
      .then(function () { /* it took */ })
      .catch(function () {
        /* Half-opened is worse than not opened: a database the next
           attempt will not use still holds WASM memory. */
        if (db) { try { db.close(); } catch (e) { /* already gone */ } }
        db = null;
        return attempt(list.slice(1));
      });
  }

  /* ---------------- persistence ---------------- */

  function requestPersistence() {
    if (!navigator.storage || !navigator.storage.persist) { return Promise.resolve(false); }
    return navigator.storage.persisted()
      .then(function (already) { return already || navigator.storage.persist(); })
      .catch(function () { return false; });
  }

  /* ---------------- reading and writing ---------------- */

  function readJsonSink() {
    if (sink === 'indexeddb') {
      return idbGet().then(function (v) {
        if (v instanceof Uint8Array || v instanceof ArrayBuffer) { return null; }
        return v || null;
      }).catch(function () { return null; });
    }
    if (sink === 'localstorage') {
      try { return Promise.resolve(JSON.parse(lsGet(LS_KEY) || 'null')); }
      catch (e) { return Promise.resolve(null); }
    }
    return Promise.resolve(null);
  }

  function legacySnapshot() {
    try {
      var saved = JSON.parse(lsGet(LEGACY_KEY) || 'null');
      if (!saved) { return null; }
      return {
        settings: saved.settings || {},
        library: Object.assign(emptyLibrary(), saved.library || {}),
        week: saved.week || null,
        locked: saved.locked || {}
      };
    } catch (e) { return null; }
  }

  /* A freshly created database is not the same as a used one. Every
     read hands back the same shape, so emptiness has to be judged on
     the contents rather than on whether a snapshot came back at all —
     otherwise a brand new database looks like a returning household
     and the old localStorage state never gets carried across. */
  function hasContent(snap) {
    if (!snap) { return false; }
    if (snap.week) { return true; }

    var settings = snap.settings || {};
    var named = Object.keys(settings).filter(function (k) { return k !== 'protein'; });
    if (named.length) { return true; }
    if (Object.keys(settings.protein || {}).length) { return true; }

    var library = snap.library || {};
    return KINDS.some(function (pair) {
      return Object.keys(library['off' + pair[1]] || {}).length > 0 ||
             (library['custom' + pair[1]] || []).length > 0;
    });
  }

  function init() {
    return attempt([function () { return trySqliteBytes('indexeddb'); },
                    function () { return trySqliteBytes('localstorage'); },
                    function () { return tryJson('indexeddb'); },
                    function () { return tryJson('localstorage'); }])
      .then(function () {
        if (engine === 'sql') { migrate(); }
        return engine === 'sql' ? readSql() : readJsonSink();
      })
      .then(function (found) {
        snapshot = found;

        /* Anyone already using the app has their week in the old
           localStorage blob. Carry it across once, silently, then
           retire the key so there is only one source of truth. */
        if (!hasContent(snapshot)) {
          var legacy = legacySnapshot();
          if (legacy) {
            snapshot = legacy;
            return write(legacy).then(function () { lsDel(LEGACY_KEY); });
          }
        } else {
          lsDel(LEGACY_KEY);
        }
      })
      .then(requestPersistence)
      .then(function (granted) { persistent = !!granted; })
      .then(function () { return { loaded: hasContent(snapshot), snapshot: snapshot }; })
      .catch(function () {
        engine = 'json';
        sink = 'none';
        return { loaded: false, snapshot: null };
      });
  }

  function write(next) {
    if (engine === 'sql') {
      try { writeSql(next); } catch (e) { return Promise.resolve(); }
      var bytes = exportBytes();
      if (!bytes) { return Promise.resolve(); }
      if (sink === 'indexeddb') { return idbPut(bytes).catch(function () {}); }
      if (sink === 'localstorage') { lsSet(LS_KEY, toBase64(bytes)); }
      return Promise.resolve();
    }

    if (sink === 'indexeddb') { return idbPut(next).catch(function () {}); }
    if (sink === 'localstorage') { lsSet(LS_KEY, JSON.stringify(next)); }
    return Promise.resolve();
  }

  function save(next) {
    snapshot = next;
    if (flushTimer) { clearTimeout(flushTimer); }
    flushTimer = setTimeout(function () {
      flushTimer = null;
      flushing = write(next);
    }, FLUSH_MS);
  }

  function flush() {
    if (flushTimer) {
      clearTimeout(flushTimer);
      flushTimer = null;
      flushing = write(snapshot);
    }
    return flushing || Promise.resolve();
  }

  function reset() {
    return flush().then(function () {
      if (engine === 'sql' && db) {
        try {
          db.exec('DROP TABLE IF EXISTS meta; DROP TABLE IF EXISTS setting;' +
                  'DROP TABLE IF EXISTS protein; DROP TABLE IF EXISTS off_item;' +
                  'DROP TABLE IF EXISTS custom_item; DROP TABLE IF EXISTS plan;');
          db.exec('VACUUM');
          migrate();
        } catch (e) { /* the clears below still stand */ }
      }
      snapshot = null;
      lsDel(LEGACY_KEY);
      lsDel(LS_KEY);
      return idbClear().catch(function () {});
    });
  }

  /* ---------------- backup ---------------- */

  function backup() {
    return flush().then(function () {
      if (engine === 'sql') {
        var bytes = exportBytes();
        if (bytes) {
          return { name: 'food-menu.sqlite3', type: 'application/vnd.sqlite3', bytes: bytes };
        }
      }
      var text = JSON.stringify(snapshot || {}, null, 2);
      return {
        name: 'food-menu.json',
        type: 'application/json',
        bytes: new TextEncoder().encode(text)
      };
    });
  }

  function restore(buffer) {
    var bytes = new Uint8Array(buffer);

    if (looksLikeDatabase(bytes)) {
      if (engine !== 'sql') { return Promise.resolve(null); }
      try {
        db.close();
        db = new sqlite3.oo1.DB(':memory:', 'c');
        importBytes(bytes);
        migrate();
        snapshot = readSql();
      } catch (e) {
        return Promise.resolve(null);
      }
      return write(snapshot).then(function () { return snapshot; });
    }

    /* A .json backup, or a database restored onto a browser that could
       not load SQLite at all. */
    try {
      var parsed = JSON.parse(new TextDecoder().decode(bytes));
      if (!parsed || typeof parsed !== 'object') { return Promise.resolve(null); }
      snapshot = {
        settings: parsed.settings || {},
        library: Object.assign(emptyLibrary(), parsed.library || {}),
        week: parsed.week || null,
        locked: parsed.locked || {}
      };
    } catch (e) {
      return Promise.resolve(null);
    }
    return write(snapshot).then(function () { return snapshot; });
  }

  /* ---------------- what to tell the user ---------------- */

  var SINK_LABEL = {
    indexeddb: 'SQLite database in this browser',
    localstorage: 'This browser’s local storage',
    none: 'This tab only'
  };

  function status() {
    var label = SINK_LABEL[sink] || SINK_LABEL.none;
    if (engine === 'json' && sink !== 'none') { label = SINK_LABEL.localstorage; }
    return {
      engine: engine,
      sink: sink,
      label: label,
      persistent: persistent,
      durable: sink !== 'none'
    };
  }

  /* A tab being hidden is the last reliable moment on a phone — it may
     never come back. Flush whatever the debounce is still holding. */
  window.addEventListener('pagehide', flush);
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'hidden') { flush(); }
  });

  return {
    init: init,
    read: function () { return snapshot; },
    save: save,
    flush: flush,
    reset: reset,
    backup: backup,
    restore: restore,
    status: status
  };
})();
