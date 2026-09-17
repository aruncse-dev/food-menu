/* ==================================================================
   Storage, rendering and wiring.

   One source of truth: a week. Today is a view onto one row of it.
   ================================================================== */

(function () {
  'use strict';

  var SVG_NS = 'http://www.w3.org/2000/svg';

  var MEAL_LABEL = { breakfast: 'Breakfast', lunch: 'Lunch', dinner: 'Dinner' };
  var MEAL_SHORT = { breakfast: 'B', lunch: 'L', dinner: 'D' };

  var SCREENS = ['today', 'week', 'foods', 'settings'];

  var state = {
    settings: Planner.defaultSettings(),
    week: null,
    locked: {}
  };

  var selectedDay = Planner.todayIndex();
  var currentScreen = 'today';
  var foodsTab = 'breakfast';
  var foodsQuery = '';
  var toastTimer;

  function $(id) { return document.getElementById(id); }

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) { node.className = className; }
    if (text !== undefined) { node.textContent = text; }
    return node;
  }

  function icon(name, extra) {
    var svg = document.createElementNS(SVG_NS, 'svg');
    svg.setAttribute('class', 'icon' + (extra ? ' ' + extra : ''));
    svg.setAttribute('aria-hidden', 'true');
    var use = document.createElementNS(SVG_NS, 'use');
    use.setAttribute('href', '#' + name);
    use.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', '#' + name);
    svg.appendChild(use);
    return svg;
  }

  /* ---------------- dates ---------------- */

  function dateFor(dayIndex) {
    var d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - ((d.getDay() + 6) % 7) + dayIndex);
    return d;
  }

  function fmt(date, opts) { return date.toLocaleDateString('en-GB', opts); }

  function greeting() {
    var h = new Date().getHours();
    return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
  }

  /* ---------------- storage ----------------
     js/db.js owns the database and every fallback below it. This side
     only knows how to turn a snapshot into running state and back. */

  function load() {
    var saved = Store.read();
    if (!saved) { return false; }

    Library.hydrate(saved.library);
    state.settings = Object.assign(Planner.defaultSettings(), saved.settings || {});

    /* The grid always holds all 21 slots, so an empty one means damage
       rather than a household that eats no protein. Fall back to the
       defaults instead of leaving the planner without a grid to read. */
    if (!state.settings.protein || !Object.keys(state.settings.protein).length) {
      state.settings.protein = Planner.defaultSettings().protein;
    }

    state.locked = saved.locked || {};
    state.week = (saved.week && saved.week.length === 7) ? saved.week : null;
    return !!state.week;
  }

  function save() {
    Store.save({
      settings: state.settings,
      library: Library.serialise(),
      week: state.week,
      locked: state.locked
    });
  }

  /* ---------------- plan actions ---------------- */

  function isLocked(d, m) { return !!state.locked[d + '-' + m]; }

  function toggleLock(d, m) {
    var key = d + '-' + m;
    if (state.locked[key]) { delete state.locked[key]; } else { state.locked[key] = true; }
    save(); renderAll();
  }

  function reroll(d, m) {
    if (isLocked(d, m)) { toast('That meal is kept — unlock it first'); return; }
    state.week[d][m] = Planner.regenerateSlot(state.week, d, m, state.settings);
    save(); renderAll();
  }

  function rerollSides(d, m) {
    if (isLocked(d, m)) { toast('That meal is kept — unlock it first'); return; }
    state.week[d][m] = Planner.regenerateSides(state.week[d][m], state.settings);
    save(); renderAll();
  }

  function regenerate() {
    state.week = Planner.generateWeek(state.settings, state.locked, state.week);
    save(); renderAll();
  }

  /* ---------------- shared pieces ---------------- */

  function chips(slot) {
    var frag = document.createDocumentFragment();
    if (!slot || state.settings.health !== 'lean') { return frag; }
    (slot.health || []).forEach(function (h) {
      frag.appendChild(el('span', 'chip chip-health', HEALTH_LABEL[h] || h));
    });
    return frag;
  }

  function sidesText(slot) {
    return (slot.sides || []).map(function (s) { return s.name; }).join(' · ');
  }

  /* ---------------- today ---------------- */

  function renderDayStrip() {
    var strip = $('day-strip');
    var todayIdx = Planner.todayIndex();
    strip.textContent = '';

    DAY_NAMES.forEach(function (day, i) {
      var date = dateFor(i);
      var chip = el('button', 'day-chip' + (i === todayIdx ? ' is-today' : ''));
      chip.setAttribute('aria-pressed', String(i === selectedDay));
      chip.setAttribute('aria-label', fmt(date, { weekday: 'long', day: 'numeric', month: 'long' }));
      chip.appendChild(el('span', 'dow', day));
      chip.appendChild(el('span', 'dom', String(date.getDate())));
      chip.addEventListener('click', function () { selectedDay = i; renderToday(); });
      strip.appendChild(chip);
    });
  }

  function renderToday() {
    var todayIdx = Planner.todayIndex();
    var isToday = selectedDay === todayIdx;
    var date = dateFor(selectedDay);

    $('today-eyebrow').textContent = isToday ? greeting() : 'Planned';
    $('today-title').textContent = isToday ? 'Today'
      : selectedDay === todayIdx + 1 ? 'Tomorrow'
      : fmt(date, { weekday: 'long' });
    $('today-date').textContent = fmt(date, { day: 'numeric', month: 'long' });

    renderDayStrip();

    var body = $('today-body');
    body.textContent = '';

    /* Only the real today has a meal that is genuinely up next. */
    if (!isToday) {
      body.appendChild(sectionLabel('All three meals'));
      body.appendChild(stackOf(MEAL_ORDER, selectedDay));
      return;
    }

    var nowMeal = Planner.currentMeal();
    var at = MEAL_ORDER.indexOf(nowMeal);
    var after = MEAL_ORDER.slice(at + 1);
    var before = MEAL_ORDER.slice(0, at);

    body.appendChild(heroCard(state.week[selectedDay][nowMeal], selectedDay, nowMeal));
    if (after.length) { body.appendChild(sectionLabel('Later today')); body.appendChild(stackOf(after, selectedDay)); }
    if (before.length) { body.appendChild(sectionLabel('Earlier today')); body.appendChild(stackOf(before, selectedDay)); }
  }

  function sectionLabel(text) {
    var rule = el('div', 'rule');
    rule.appendChild(el('span', null, text));
    return rule;
  }

  function heroCard(slot, dayIndex, meal) {
    var card = el('article', 'hero');
    var locked = isLocked(dayIndex, meal);

    var top = el('div', 'hero-top');
    top.appendChild(el('span', 'hero-kicker', 'Up next · ' + MEAL_LABEL[meal]));

    if (slot) {
      var meta = el('span', 'hero-meta');
      meta.appendChild(icon('i-clock', 'icon-sm'));
      meta.appendChild(el('span', null, slot.mins + ' min'));
      top.appendChild(meta);
    }
    card.appendChild(top);

    if (!slot) {
      card.appendChild(el('h2', 'hero-dish', 'Nothing to cook'));
      card.appendChild(el('p', 'hero-sides', 'No ' + meal + ' dishes are ticked in Foods.'));
      return card;
    }

    card.appendChild(el('h2', 'hero-dish', slot.main));

    if (slot.addon) {
      var chip = el('span', 'hero-addon');
      chip.appendChild(icon('i-plus', 'icon-sm'));
      chip.appendChild(el('span', null, slot.addon.name));
      card.appendChild(chip);
    }

    if (slot.sides && slot.sides.length) {
      var ul = el('ul', 'hero-sides');
      slot.sides.forEach(function (s) { ul.appendChild(el('li', null, s.name)); });
      card.appendChild(ul);
    }

    var actions = el('div', 'hero-actions');

    var change = el('button', 'btn');
    change.appendChild(icon('i-shuffle'));
    change.appendChild(el('span', null, 'Change'));
    change.addEventListener('click', function () { reroll(dayIndex, meal); });
    actions.appendChild(change);

    var keep = el('button', 'btn');
    keep.appendChild(icon(locked ? 'i-lock' : 'i-unlock'));
    keep.appendChild(el('span', null, locked ? 'Kept' : 'Keep'));
    keep.addEventListener('click', function () { toggleLock(dayIndex, meal); });
    actions.appendChild(keep);

    card.appendChild(actions);
    return card;
  }

  function stackOf(meals, dayIndex) {
    var stack = el('div', 'stack');
    meals.forEach(function (meal) {
      stack.appendChild(mealRow(state.week[dayIndex][meal], dayIndex, meal));
    });
    return stack;
  }

  function mealRow(slot, dayIndex, meal) {
    var locked = isLocked(dayIndex, meal);
    var row = el('div', 'row' + (locked ? ' is-locked' : ''));

    var tag = el('span', 'row-tag', MEAL_SHORT[meal]);
    tag.setAttribute('data-meal', meal);
    tag.title = MEAL_LABEL[meal];
    row.appendChild(tag);

    var body = el('div', 'row-body');
    var dish = el('div', 'row-dish');
    dish.appendChild(el('span', null, slot ? slot.main : 'Nothing ticked'));

    /* The protein is the thing people scan a row for, so it always
       shows, ahead of any other chip. */
    if (slot && slot.addon) {
      dish.appendChild(el('span', 'chip chip-protein', '+ ' + slot.addon.name));
    } else if (slot) {
      dish.appendChild(chips(slot));
    }
    body.appendChild(dish);

    if (slot && slot.sides && slot.sides.length) {
      body.appendChild(el('div', 'row-sides', sidesText(slot)));
    }
    row.appendChild(body);

    if (slot) { row.appendChild(el('span', 'row-time', slot.mins + 'm')); }

    var shuffle = el('button', 'row-act');
    shuffle.appendChild(icon('i-shuffle', 'icon-sm'));
    shuffle.title = 'Change this meal';
    shuffle.setAttribute('aria-label', 'Change ' + MEAL_LABEL[meal]);
    shuffle.addEventListener('click', function () { reroll(dayIndex, meal); });
    row.appendChild(shuffle);

    var lock = el('button', 'row-act' + (locked ? ' is-on' : ''));
    lock.appendChild(icon(locked ? 'i-lock' : 'i-unlock', 'icon-sm'));
    lock.title = locked ? 'Kept' : 'Keep this meal';
    lock.setAttribute('aria-label', lock.title);
    lock.addEventListener('click', function () { toggleLock(dayIndex, meal); });
    row.appendChild(lock);

    return row;
  }

  /* ---------------- week ---------------- */

  function renderWeek() {
    var todayIdx = Planner.todayIndex();
    var body = $('week-body');
    body.textContent = '';

    $('week-range').textContent = fmt(dateFor(0), { day: 'numeric', month: 'short' }) +
      ' – ' + fmt(dateFor(6), { day: 'numeric', month: 'short' });

    state.week.forEach(function (row, dayIndex) {
      var weekend = row.day === 'Sat' || row.day === 'Sun';
      var today = dayIndex === todayIdx;

      var block = el('section', 'day-block' + (today ? ' is-today' : '') + (weekend ? ' is-weekend' : ''));
      var head = el('div', 'day-block-head');
      head.appendChild(el('span', 'name', DAY_FULL[row.day] || row.day));
      head.appendChild(el('span', 'when', today ? 'Today' : fmt(dateFor(dayIndex), { day: 'numeric', month: 'short' })));
      block.appendChild(head);
      block.appendChild(stackOf(MEAL_ORDER, dayIndex));
      body.appendChild(block);
    });
  }

  /* ---------------- foods ---------------- */

  function matches(name) {
    return !foodsQuery || name.toLowerCase().indexOf(foodsQuery) !== -1;
  }

  function visibleItems() {
    if (foodsTab === 'sides') {
      return Library.allSides().filter(function (s) { return matches(s.name); });
    }
    if (foodsTab === 'protein') {
      return Library.allAddons().filter(function (a) { return matches(a.name); });
    }
    return Library.allMains().filter(function (d) {
      return d.meals.indexOf(foodsTab) !== -1 && matches(d.name);
    });
  }

  function kindOfTab() {
    return foodsTab === 'sides' ? 'side' : foodsTab === 'protein' ? 'addon' : 'main';
  }

  function renderFoods() {
    var kind = kindOfTab();
    var items = visibleItems();
    var on = items.filter(function (i) { return Library.isOn(kind, i.id); }).length;

    $('foods-count').textContent = on + ' of ' + items.length + ' ticked';

    Array.prototype.forEach.call($('foods-seg').children, function (b) {
      b.setAttribute('aria-selected', String(b.getAttribute('data-tab') === foodsTab));
    });

    var body = $('foods-body');
    body.textContent = '';

    var counts = Library.counts();
    if (foodsTab !== 'sides' && foodsTab !== 'protein' && counts[foodsTab] === 0) {
      body.appendChild(el('div', 'warn', 'Nothing ticked for ' + foodsTab + ' — the plan will leave it empty.'));
    }

    if (!items.length) {
      body.appendChild(el('div', 'empty', foodsQuery ? 'Nothing matches "' + foodsQuery + '".' : 'Nothing here yet.'));
      return;
    }

    if (foodsTab === 'sides') { renderGrouped(body, items, 'side', CATEGORIES, 'cat'); }
    else if (foodsTab === 'protein') {
      renderGrouped(body, items, 'addon',
        ADDON_KINDS.filter(function (k) { return k.id !== 'veg'; }), 'kind');
    } else {
      var card = el('div', 'card');
      card.style.padding = '0';
      items.forEach(function (d) { card.appendChild(pickRow(d, 'main')); });
      body.appendChild(card);
    }
  }

  function renderGrouped(body, items, kind, groups, field) {
    groups.forEach(function (group) {
      var members = items.filter(function (i) { return i[field] === group.id; });
      if (!members.length) { return; }

      var onCount = members.filter(function (i) { return Library.isOn(kind, i.id); }).length;

      var head = el('div', 'cat-head');
      head.appendChild(el('h3', null, group.name));
      head.appendChild(el('span', 'n', onCount + '/' + members.length));

      var all = el('button', 'btn btn-sm btn-quiet', onCount === members.length ? 'None' : 'All');
      all.addEventListener('click', function () {
        Library.setMany(kind, members.map(function (i) { return i.id; }), onCount !== members.length);
        libraryChanged();
      });
      head.appendChild(all);
      body.appendChild(head);

      var card = el('div', 'card');
      card.style.padding = '0';
      members.forEach(function (i) { card.appendChild(pickRow(i, kind)); });
      body.appendChild(card);
    });
  }

  function pickRow(item, kind) {
    var on = Library.isOn(kind, item.id);
    var row = el('button', 'pick');
    row.setAttribute('aria-pressed', String(on));

    var box = el('span', 'box');
    box.appendChild(icon('i-check', 'icon-sm'));
    row.appendChild(box);

    var body = el('span', 'pick-body');
    var name = el('span', 'pick-name');
    name.appendChild(el('span', null, item.name));

    (item.health || []).slice(0, 2).forEach(function (h) {
      name.appendChild(el('span', 'chip chip-health', HEALTH_LABEL[h] || h));
    });
    body.appendChild(name);

    var meta = [];
    if (item.meals) { meta.push(item.meals.map(function (m) { return MEAL_LABEL[m]; }).join(', ')); }
    if (item.mins) { meta.push(item.mins + ' min'); }
    if (Library.isCustom(item.id)) { meta.push('yours'); }
    if (meta.length) { body.appendChild(el('span', 'pick-meta', meta.join(' · '))); }
    row.appendChild(body);

    row.addEventListener('click', function () {
      Library.toggle(kind, item.id, !Library.isOn(kind, item.id));
      libraryChanged();
    });

    if (Library.isCustom(item.id)) {
      var del = el('span', 'del');
      del.appendChild(icon('i-trash', 'icon-sm'));
      del.setAttribute('role', 'button');
      del.setAttribute('aria-label', 'Delete ' + item.name);
      del.addEventListener('click', function (e) {
        e.stopPropagation();
        Library.remove(kind, item.id);
        libraryChanged();
        toast('Removed ' + item.name);
      });
      row.appendChild(del);
    }

    return row;
  }

  /* Changing the food list changes what can be planned, so the week is
     rebuilt at once — otherwise a dish you just switched off keeps
     staring back at you from Today. */
  function libraryChanged() {
    regenerate();
    renderFoods();
  }

  /* ---------------- add-an-item sheet ---------------- */

  function openAddSheet() {
    var kind = kindOfTab();
    var draft = {
      name: '',
      meals: kind === 'main' ? [foodsTab] : ['lunch', 'dinner'],
      mins: kind === 'main' ? 25 : 30,
      cat: 'poriyal',
      addonKind: 'chicken'
    };

    var body = el('div');

    var nameField = el('div', 'sheet-field');
    nameField.appendChild(el('label', null, 'Name'));
    var input = el('input', 'text');
    input.type = 'text';
    input.placeholder = kind === 'side' ? 'e.g. Murungakkai poriyal' : 'e.g. Kothu parotta';
    input.addEventListener('input', function () { draft.name = input.value; });
    nameField.appendChild(input);
    body.appendChild(nameField);

    if (kind === 'side') {
      var catField = el('div', 'sheet-field');
      catField.appendChild(el('label', null, 'Goes with'));
      var sel = el('select', 'select');
      sel.style.maxWidth = '100%';
      CATEGORIES.forEach(function (c) {
        var o = el('option', null, c.name);
        o.value = c.id;
        sel.appendChild(o);
      });
      sel.value = draft.cat;
      sel.addEventListener('change', function () { draft.cat = sel.value; });
      catField.appendChild(sel);
      body.appendChild(catField);
    }

    if (kind === 'addon') {
      var kField = el('div', 'sheet-field');
      kField.appendChild(el('label', null, 'Type'));
      var krow = el('div', 'toggle-row');
      ADDON_KINDS.filter(function (k) { return k.id !== 'veg'; }).forEach(function (k) {
        var b = el('button', k.id === draft.addonKind ? 'is-on' : null, k.name);
        b.addEventListener('click', function () {
          draft.addonKind = k.id;
          Array.prototype.forEach.call(krow.children, function (c) { c.classList.remove('is-on'); });
          b.classList.add('is-on');
        });
        krow.appendChild(b);
      });
      kField.appendChild(krow);
      body.appendChild(kField);
    }

    if (kind !== 'side') {
      var mField = el('div', 'sheet-field');
      mField.appendChild(el('label', null, 'Served at'));
      var mrow = el('div', 'toggle-row');
      MEAL_ORDER.forEach(function (m) {
        var b = el('button', draft.meals.indexOf(m) !== -1 ? 'is-on' : null, MEAL_LABEL[m]);
        b.addEventListener('click', function () {
          var i = draft.meals.indexOf(m);
          if (i === -1) { draft.meals.push(m); b.classList.add('is-on'); }
          else { draft.meals.splice(i, 1); b.classList.remove('is-on'); }
        });
        mrow.appendChild(b);
      });
      mField.appendChild(mrow);
      body.appendChild(mField);

      var tField = el('div', 'sheet-field');
      tField.appendChild(el('label', null, 'Roughly how long'));
      var trow = el('div', 'toggle-row');
      [10, 15, 20, 25, 30, 40, 60].forEach(function (n) {
        var b = el('button', n === draft.mins ? 'is-on' : null, n + ' min');
        b.addEventListener('click', function () {
          draft.mins = n;
          Array.prototype.forEach.call(trow.children, function (c) { c.classList.remove('is-on'); });
          b.classList.add('is-on');
        });
        trow.appendChild(b);
      });
      tField.appendChild(trow);
      body.appendChild(tField);
    }

    var add = el('button', 'btn btn-primary btn-block');
    add.appendChild(icon('i-plus'));
    add.appendChild(el('span', null, 'Add to my list'));
    add.addEventListener('click', function () {
      if (!draft.name.trim()) { toast('Give it a name first'); input.focus(); return; }

      if (kind === 'side') { Library.addSide(draft.name, draft.cat); }
      else if (kind === 'addon') { Library.addAddon(draft.name, draft.addonKind, draft.meals, draft.mins); }
      else { Library.addMain(draft.name, draft.meals, draft.mins, []); }

      closeSheet();
      libraryChanged();
      toast(draft.name.trim() + ' added');
    });
    body.appendChild(add);

    openSheet(
      kind === 'side' ? 'Add a side' : kind === 'addon' ? 'Add a protein dish' : 'Add a dish',
      kind === 'addon'
        ? 'It will be offered on the days your protein timetable asks for this type.'
        : 'It joins the rotation straight away.',
      body
    );
    setTimeout(function () { input.focus(); }, 60);
  }

  /* ---------------- settings: protein grid ---------------- */

  function kindName(id) {
    for (var i = 0; i < ADDON_KINDS.length; i++) {
      if (ADDON_KINDS[i].id === id) { return ADDON_KINDS[i].short; }
    }
    return 'Veg';
  }

  function renderProteinGrid() {
    var grid = $('pgrid');
    grid.textContent = '';

    grid.appendChild(el('div', 'h', ''));
    MEAL_ORDER.forEach(function (m) { grid.appendChild(el('div', 'h', MEAL_SHORT[m])); });

    DAY_NAMES.forEach(function (day) {
      grid.appendChild(el('div', 'd', day));

      MEAL_ORDER.forEach(function (meal) {
        var kind = Planner.proteinAt(state.settings, day, meal);
        var cell = el('button', 'pcell' + (kind !== 'veg' ? ' on' : ''), kindName(kind));
        cell.setAttribute('aria-label', day + ' ' + MEAL_LABEL[meal] + ': ' + kindName(kind));
        cell.addEventListener('click', function () { openProteinSheet(day, meal); });
        grid.appendChild(cell);
      });
    });
  }

  function openProteinSheet(day, meal) {
    var current = Planner.proteinAt(state.settings, day, meal);
    var list = el('div', 'sheet-list');

    ADDON_KINDS.forEach(function (k) {
      var available = k.id === 'veg' || Library.addons(k.id, meal).length > 0;
      var b = el('button', 'sheet-opt');
      b.setAttribute('aria-pressed', String(k.id === current));
      b.appendChild(icon(k.id === 'veg' ? 'i-leaf' : 'i-plus'));
      b.appendChild(el('span', null, k.name));

      if (!available) {
        b.appendChild(el('span', 'chip chip-protein', 'none ticked'));
      }

      b.addEventListener('click', function () {
        state.settings.protein[day][meal] = k.id;
        closeSheet();
        settingsChanged();
      });

      list.appendChild(b);
    });

    openSheet(day + ' · ' + MEAL_LABEL[meal],
      'The vegetarian food is cooked either way. This only adds a dish beside it.', list);
  }

  function renderQuickfills() {
    var box = $('quickfills');
    box.textContent = '';

    var fills = [
      { label: 'All veg', apply: function (g) {
          DAY_NAMES.forEach(function (d) { MEAL_ORDER.forEach(function (m) { g[d][m] = 'veg'; }); }); } },
      { label: 'Egg every lunch', apply: function (g) {
          DAY_NAMES.forEach(function (d) { g[d].lunch = 'egg'; }); } },
      { label: 'Non-veg weekends', apply: function (g) {
          g.Sat.lunch = 'chicken'; g.Sun.lunch = 'mutton'; } }
    ];

    fills.forEach(function (f) {
      var b = el('button', 'btn btn-sm btn-quiet', f.label);
      b.addEventListener('click', function () {
        f.apply(state.settings.protein);
        renderProteinGrid();
        settingsChanged();
        toast(f.label);
      });
      box.appendChild(b);
    });
  }

  /* ---------------- sheet ---------------- */

  function openSheet(title, hint, bodyNode) {
    $('sheet-title').textContent = title;
    $('sheet-hint').textContent = hint || '';
    var body = $('sheet-body');
    body.textContent = '';
    body.appendChild(bodyNode);

    var sheet = $('sheet');
    sheet.hidden = false;
    requestAnimationFrame(function () { sheet.classList.add('is-open'); });
  }

  function closeSheet() {
    var sheet = $('sheet');
    sheet.classList.remove('is-open');
    setTimeout(function () { sheet.hidden = true; }, 200);
  }

  /* ---------------- settings ---------------- */

  function syncSettings() {
    $('opt-lean').checked = state.settings.health === 'lean';
    $('opt-light').checked = state.settings.lightDinners;
    $('opt-quick').checked = state.settings.quickBreakfast;
    renderProteinGrid();
  }

  function settingsChanged() {
    regenerate();
    renderProteinGrid();
  }

  /* ---------------- share ----------------
     Share used to be its own tab, which spent a nav slot on something
     people do occasionally. It is now a sheet opened from wherever
     the thing being shared already is. */

  var shareCanvas = null;
  var shareText = '';

  function openShareSheet(rows, title, subtitle, filename) {
    var body = el('div');

    var preview = el('div', 'preview');
    shareCanvas = document.createElement('canvas');
    shareCanvas.setAttribute('role', 'img');
    shareCanvas.setAttribute('aria-label', title);
    preview.appendChild(shareCanvas);
    body.appendChild(preview);

    Exporter.render(shareCanvas, rows, { monday: dateFor(0), title: title, subtitle: subtitle });
    shareText = Exporter.asText(rows, title);

    var actions = el('div', 'actions');

    var share = el('button', 'btn btn-primary btn-block');
    share.appendChild(icon('i-share'));
    share.appendChild(el('span', null, 'Share'));
    share.addEventListener('click', function () {
      Exporter.share(shareCanvas, shareText).then(function (r) {
        if (r === 'unsupported') { toast('Sharing needs a phone browser — save the image instead'); }
        else if (r === 'failed') { toast('Could not open the share sheet'); }
        else if (r === 'shared') { closeSheet(); }
      });
    });
    actions.appendChild(share);

    var pair = el('div', 'pair');

    var dl = el('button', 'btn');
    dl.appendChild(icon('i-download'));
    dl.appendChild(el('span', null, 'Save'));
    dl.addEventListener('click', function () {
      Exporter.download(shareCanvas, filename).then(function (ok) {
        toast(ok ? 'Image saved' : 'Could not save the image');
      });
    });
    pair.appendChild(dl);

    var pr = el('button', 'btn');
    pr.appendChild(icon('i-print'));
    pr.appendChild(el('span', null, 'Print'));
    pr.addEventListener('click', function () { window.print(); });
    pair.appendChild(pr);

    actions.appendChild(pair);

    var cp = el('button', 'btn btn-block');
    cp.appendChild(icon('i-copy'));
    cp.appendChild(el('span', null, 'Copy as text'));
    cp.addEventListener('click', function () { copyText(shareText); });
    actions.appendChild(cp);

    body.appendChild(actions);

    openSheet(title, subtitle, body);
  }

  function shareWeek() {
    openShareSheet(state.week, 'Menu for the week',
      fmt(dateFor(0), { day: 'numeric', month: 'short' }) + ' – ' +
      fmt(dateFor(6), { day: 'numeric', month: 'short' }),
      'menu-week.png');
  }

  /* One day renders through exactly the same code — the timetable
     simply has a single row. */
  function shareDay() {
    var date = dateFor(selectedDay);
    var isToday = selectedDay === Planner.todayIndex();
    openShareSheet([state.week[selectedDay]],
      (isToday ? "Today's" : fmt(date, { weekday: 'long' }) + "'s") + ' menu',
      fmt(date, { weekday: 'long', day: 'numeric', month: 'long' }),
      'menu-' + DAY_NAMES[selectedDay].toLowerCase() + '.png');
  }

  function copyText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () { toast('Menu copied'); },
        function () { legacyCopy(text); });
      return;
    }
    legacyCopy(text);
  }

  /* navigator.clipboard is blocked on file:// in some browsers. */
  function legacyCopy(text) {
    var ta = el('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    var ok = false;
    try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
    document.body.removeChild(ta);
    toast(ok ? 'Menu copied' : 'Could not copy automatically');
  }

  /* ---------------- chrome ---------------- */

  function toast(message) {
    var node = $('toast');
    node.textContent = message;
    node.classList.add('is-visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { node.classList.remove('is-visible'); }, 2200);
  }

  function showScreen(name) {
    currentScreen = name;
    SCREENS.forEach(function (s) {
      $('screen-' + s).hidden = s !== name;
      $('tab-' + s).setAttribute('aria-selected', String(s === name));
    });
    if (name === 'foods') { renderFoods(); }
    if (name === 'settings') { syncSettings(); }
    window.scrollTo(0, 0);
  }

  function renderAll() {
    renderToday();
    renderWeek();
  }

  /* ---------------- first run ----------------
     Two taps, once. Every answer here is also reachable in Settings
     afterwards, so nothing asked is a decision anyone can get wrong. */

  var FREQ = {
    veg: [],
    egg: [
      { name: 'Just a couple of days',  sub: 'Egg twice a week',
        apply: function (g) { g.Tue.lunch = 'egg'; g.Fri.lunch = 'egg'; } },
      { name: 'Most days',              sub: 'Egg at lunch on working days',
        apply: function (g) { ['Mon','Tue','Wed','Thu','Fri'].forEach(function (d) { g[d].lunch = 'egg'; }); } },
      { name: 'Only on Sundays',        sub: 'One egg dish a week',
        apply: function (g) { g.Sun.lunch = 'egg'; } }
    ],
    nonveg: [
      { name: 'Sundays only',           sub: 'The one big meal of the week',
        apply: function (g) { g.Sun.lunch = 'chicken'; } },
      { name: 'Twice a week',           sub: 'Sunday lunch and a midweek dinner',
        apply: function (g) { g.Sun.lunch = 'chicken'; g.Wed.dinner = 'fish'; } },
      { name: 'Most days',              sub: 'Something non-veg four or five times',
        apply: function (g) {
          g.Sun.lunch = 'mutton'; g.Wed.dinner = 'fish';
          g.Fri.dinner = 'chicken'; g.Sat.lunch = 'chicken'; g.Tue.lunch = 'egg'; } }
    ]
  };

  /* Where to go when the questions are done. null means first run,
     which lands on Today; otherwise back where it was opened from. */
  var setupReturn = null;

  /* Bound once, in init. Binding inside startSetup would stack a fresh
     handler on every visit now that Settings can reopen it. */
  function bindSetup() {
    Array.prototype.forEach.call($('screen-setup').querySelectorAll('[data-diet]'), function (b) {
      b.addEventListener('click', function () { chooseDiet(b.getAttribute('data-diet')); });
    });
    $('setup-skip').addEventListener('click', function () { finishSetup(false); });
  }

  function startSetup(from) {
    setupReturn = from || null;
    document.body.classList.add('is-setup');
    $('screen-setup').hidden = false;
    $('setup-step-1').hidden = false;
    $('setup-step-2').hidden = true;
    $('setup-egg').checked = false;
    $('setup-skip').textContent = from ? 'Cancel' : 'Skip, just show me a plan';
    window.scrollTo(0, 0);
  }

  function chooseDiet(diet) {
    /* Pure vegetarian has nothing left to ask. */
    if (diet === 'veg') {
      state.settings.protein = Planner.emptyProtein();
      finishSetup(true);
      return;
    }

    $('setup-step-1').hidden = true;
    $('setup-step-2').hidden = false;
    $('setup-q2').textContent = diet === 'egg' ? 'How often is egg on the table?'
                                               : 'How often is non-veg on the table?';
    $('setup-egg-wrap').hidden = diet === 'egg';

    var box = $('setup-freq');
    box.textContent = '';

    FREQ[diet].forEach(function (f) {
      var b = el('button', 'opt');
      b.appendChild(el('span', 'opt-name', f.name));
      b.appendChild(el('span', 'opt-sub', f.sub));
      b.addEventListener('click', function () {
        var grid = Planner.emptyProtein();
        f.apply(grid);
        if (diet === 'nonveg' && $('setup-egg').checked) {
          DAY_NAMES.forEach(function (d) { if (grid[d].lunch === 'veg') { grid[d].lunch = 'egg'; } });
        }
        state.settings.protein = grid;
        finishSetup(true);
      });
      box.appendChild(b);
    });
  }

  /* `applied` false means cancelled or skipped: the plan already
     generated at start-up stands, and nothing is overwritten. */
  function finishSetup(applied) {
    document.body.classList.remove('is-setup');
    $('screen-setup').hidden = true;

    if (applied) {
      state.week = Planner.generateWeek(state.settings, state.locked, state.week);
      save();
      syncSettings();
      renderAll();
    }

    if (setupReturn) {
      showScreen(setupReturn);
      if (applied) { toast('Protein timetable updated'); }
    } else {
      showScreen('today');
    }

    setupReturn = null;
  }

  /* ---------------- storage, as the settings screen sees it ---------------- */

  function renderStorage() {
    var info = Store.status();
    var where = $('storage-where');
    if (!where) { return; }

    where.textContent = info.label;

    var note = $('storage-note');
    if (!info.durable) {
      note.textContent = 'Nothing is being saved. This browser will not let the app store ' +
        'anything, so the plan lasts until you close the tab. Back it up if you want to keep it.';
    } else if (info.persistent) {
      note.textContent = 'Marked permanent, so Chrome will not clear it to free up space. ' +
        'It survives closing the browser and restarting the phone.';
    } else {
      note.textContent = 'Saved, but not marked permanent — Chrome may clear it if the device ' +
        'runs very low on space. A private window always clears it when the last one closes.';
    }

    $('storage-badge').textContent = info.persistent ? 'Permanent' :
      (info.durable ? 'Saved' : 'This tab only');
    $('storage-badge').className = 'pill' + (info.persistent ? ' pill-good' : '');
  }

  function backupNow() {
    Store.backup().then(function (file) {
      Exporter.save(new Blob([file.bytes], { type: file.type }), file.name);
      toast('Backup saved');
    }).catch(function () { toast('Could not make a backup'); });
  }

  function restorePicked(e) {
    var file = e.target.files && e.target.files[0];
    e.target.value = '';                 /* so the same file can be picked twice */
    if (!file) { return; }

    file.arrayBuffer()
      .then(Store.restore)
      .then(function (restored) {
        if (!restored) { toast('That is not a backup file'); return; }

        load();
        if (!state.week) {
          state.week = Planner.generateWeek(state.settings, {}, null);
          save();
        }
        selectedDay = Planner.todayIndex();
        syncSettings(); renderAll(); renderFoods(); renderStorage();
        toast('Backup restored');
      })
      .catch(function () { toast('Could not read that file'); });
  }

  function init() {
    Store.init()
      .catch(function () { /* db.js already degrades; boot regardless */ })
      .then(boot);
  }

  function boot() {
    document.body.classList.remove('is-booting');
    var splash = $('boot');
    if (splash) { splash.remove(); }

    var returning = load();

    if (!returning) {
      state.week = Planner.generateWeek(state.settings, {}, null);
      save();
    }

    SCREENS.forEach(function (s) {
      $('tab-' + s).addEventListener('click', function () { showScreen(s); });
    });

    $('btn-new-day').addEventListener('click', function () {
      var changed = 0;
      MEAL_ORDER.forEach(function (meal) {
        if (isLocked(selectedDay, meal)) { return; }
        state.week[selectedDay][meal] =
          Planner.regenerateSlot(state.week, selectedDay, meal, state.settings);
        changed++;
      });
      save(); renderAll();
      toast(changed ? 'New ideas for this day' : 'Every meal today is kept');
    });

    $('btn-new-week').addEventListener('click', function () {
      regenerate();
      toast(Object.keys(state.locked).length ? 'New plan — kept meals stay' : 'New plan');
    });

    /* foods */
    Array.prototype.forEach.call($('foods-seg').children, function (b) {
      b.addEventListener('click', function () {
        foodsTab = b.getAttribute('data-tab');
        renderFoods();
      });
    });

    $('foods-search').addEventListener('input', function (e) {
      foodsQuery = e.target.value.trim().toLowerCase();
      renderFoods();
    });

    $('btn-all').addEventListener('click', function () {
      Library.setMany(kindOfTab(), visibleItems().map(function (i) { return i.id; }), true);
      libraryChanged();
    });

    $('btn-none').addEventListener('click', function () {
      Library.setMany(kindOfTab(), visibleItems().map(function (i) { return i.id; }), false);
      libraryChanged();
    });

    $('btn-add').addEventListener('click', openAddSheet);

    $('sheet').addEventListener('click', function (e) {
      if (e.target === $('sheet')) { closeSheet(); }
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !$('sheet').hidden) { closeSheet(); }
    });

    $('btn-share-day').addEventListener('click', shareDay);
    $('btn-share-week').addEventListener('click', shareWeek);

    /* settings */
    $('opt-lean').addEventListener('change', function (e) {
      state.settings.health = e.target.checked ? 'lean' : 'everyday';
      settingsChanged();
      toast(e.target.checked ? 'Leaning healthier' : 'Everyday cooking');
    });

    [['opt-light', 'lightDinners'], ['opt-quick', 'quickBreakfast']]
      .forEach(function (pair) {
        $(pair[0]).addEventListener('change', function (e) {
          state.settings[pair[1]] = e.target.checked;
          settingsChanged();
        });
      });

    $('btn-reset').addEventListener('click', function () {
      if (!confirm('Erase the plan, your food list and your own dishes?')) { return; }
      Store.reset().then(function () {
        Library.reset();
        state.settings = Planner.defaultSettings();
        state.locked = {};
        selectedDay = Planner.todayIndex();
        state.week = Planner.generateWeek(state.settings, {}, null);
        save();
        syncSettings(); renderAll(); renderFoods(); renderStorage();
        toast('Back to defaults');
      });
    });

    $('btn-backup').addEventListener('click', backupNow);
    $('btn-restore').addEventListener('click', function () { $('restore-file').click(); });
    $('restore-file').addEventListener('change', restorePicked);

    $('btn-rerun-setup').addEventListener('click', function () { startSetup('settings'); });

    bindSetup();
    renderQuickfills();
    syncSettings();
    renderStorage();
    renderAll();
    showScreen('today');

    if (!returning) { startSetup(); }
  }

  document.addEventListener('DOMContentLoaded', init);
})();
