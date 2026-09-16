/* ------------------------------------------------------------------
   Storage, rendering and wiring.

   One source of truth: a week. "Today" is today's row of it, so
   rerolling tonight's dinner on the Today screen is the same edit as
   rerolling it in the week view.
   ------------------------------------------------------------------ */

(function () {
  'use strict';

  var STORE_KEY = 'food-menu/v1';

  var MEAL_LABEL = { breakfast: 'Breakfast', lunch: 'Lunch', dinner: 'Dinner' };

  var BADGE_LABEL = {
    nonveg: 'Non-veg',
    kids: "Kids' pick",
    light: 'Light',
    quick: 'Quick'
  };

  var state = {
    settings: Planner.defaultSettings(),
    week: null,
    locked: {}
  };

  var currentRange = 'day';
  var currentScreen = 'plan';
  var toastTimer;

  function $(id) { return document.getElementById(id); }

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) { node.className = className; }
    if (text !== undefined) { node.textContent = text; }
    return node;
  }

  /* ---------------- storage ----------------
     localStorage throws in private mode and in some file:// contexts,
     so every access is guarded and the app stays usable without it. */

  function load() {
    try {
      var raw = localStorage.getItem(STORE_KEY);
      if (!raw) { return false; }
      var saved = JSON.parse(raw);
      if (!saved || !saved.week || !saved.week.length) { return false; }

      state.settings = Object.assign(Planner.defaultSettings(), saved.settings || {});
      state.week = saved.week;
      state.locked = saved.locked || {};
      return true;
    } catch (e) {
      return false;
    }
  }

  function save() {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify({
        settings: state.settings,
        week: state.week,
        locked: state.locked
      }));
    } catch (e) { /* nothing worth doing — the plan still works this session */ }
  }

  /* ---------------- shared bits ---------------- */

  function badgeNodes(badges) {
    var frag = document.createDocumentFragment();
    (badges || []).forEach(function (b) {
      if (!BADGE_LABEL[b]) { return; }
      frag.appendChild(el('span', 'badge badge-' + b, BADGE_LABEL[b]));
    });
    return frag;
  }

  function regenerate() {
    state.week = Planner.generateWeek(state.settings, state.locked, state.week);
    save();
    renderAll();
  }

  /* ---------------- today ---------------- */

  function renderDay() {
    var idx = Planner.todayIndex();
    var row = state.week[idx];
    var nowMeal = Planner.currentMeal();

    $('day-date').textContent = new Date().toLocaleDateString(undefined, {
      weekday: 'long', day: 'numeric', month: 'long'
    });

    var list = $('day-meals');
    list.textContent = '';

    MEAL_ORDER.forEach(function (meal) {
      var slot = row[meal];
      if (!slot) { return; }

      var card = el('article', 'meal-card' + (meal === nowMeal ? ' is-now' : ''));
      card.setAttribute('data-meal', meal);

      var head = el('div', 'meal-head');
      head.appendChild(el('span', 'meal-label', MEAL_LABEL[meal]));
      head.appendChild(el('span', 'meal-time', slot.mins + ' min'));
      if (meal === nowMeal) { head.appendChild(el('span', 'now-pill', 'Up next')); }
      head.appendChild(el('span', 'spacer'));

      var shuffle = el('button', 'btn btn-round btn-icon', '🎲');
      shuffle.title = 'Change just this meal';
      shuffle.setAttribute('aria-label', 'Change ' + MEAL_LABEL[meal]);
      shuffle.addEventListener('click', function () { rerollSlot(idx, meal); });
      head.appendChild(shuffle);

      card.appendChild(head);
      card.appendChild(el('h2', 'dish-name', slot.dish));
      if (slot.tamil) { card.appendChild(el('p', 'dish-tamil', slot.tamil)); }

      if (slot.sides && slot.sides.length) {
        var ul = el('ul', 'sides');
        slot.sides.forEach(function (s) { ul.appendChild(el('li', null, s)); });
        card.appendChild(ul);
      }

      if (slot.badges && slot.badges.length) {
        var badges = el('div', 'badges');
        badges.appendChild(badgeNodes(slot.badges));
        card.appendChild(badges);
      }

      list.appendChild(card);
    });
  }

  function rerollSlot(dayIndex, meal) {
    var key = dayIndex + '-' + meal;

    if (state.locked[key]) {
      toast('That meal is locked — unlock it first');
      return;
    }

    state.week[dayIndex][meal] = Planner.regenerateSlot(state.week, dayIndex, meal, state.settings);
    save();
    renderAll();
  }

  /* ---------------- week ---------------- */

  function renderWeek() {
    var list = $('week-list');
    var todayIdx = Planner.todayIndex();
    list.textContent = '';

    state.week.forEach(function (row, dayIndex) {
      var isWeekend = row.day === 'Sat' || row.day === 'Sun';
      var isToday = dayIndex === todayIdx;

      var head = el('div', 'day-head' +
        (isToday ? ' is-today' : '') + (isWeekend ? ' is-weekend' : ''));
      head.appendChild(el('span', null, DAY_FULL[row.day] || row.day));
      if (isToday) { head.appendChild(el('span', 'sub', 'today')); }
      list.appendChild(head);

      MEAL_ORDER.forEach(function (meal) {
        list.appendChild(cellNode(row[meal], dayIndex, meal));
      });
    });
  }

  function cellNode(slot, dayIndex, meal) {
    var key = dayIndex + '-' + meal;
    var isLocked = !!state.locked[key];
    var cell = el('div', 'cell' + (isLocked ? ' is-locked' : ''));

    cell.appendChild(el('div', 'cell-meal', MEAL_LABEL[meal]));

    if (!slot) { return cell; }

    cell.appendChild(el('div', 'cell-dish', slot.dish));

    if (slot.sides && slot.sides.length) {
      cell.appendChild(el('div', 'cell-sides', slot.sides.join(' · ')));
    }

    if (slot.badges && slot.badges.length) {
      var badges = el('div', 'cell-badges');
      badges.appendChild(badgeNodes(slot.badges));
      cell.appendChild(badges);
    }

    var lock = el('button', 'cell-lock' + (isLocked ? ' is-on' : ''), isLocked ? '🔒' : '🔓');
    lock.title = isLocked ? 'Locked — a new plan keeps this' : 'Lock this meal';
    lock.setAttribute('aria-label', lock.title);
    lock.addEventListener('click', function () {
      if (isLocked) { delete state.locked[key]; }
      else { state.locked[key] = true; }
      save();
      renderWeek();
    });
    cell.appendChild(lock);

    return cell;
  }

  /* ---------------- export ---------------- */

  function renderExport() {
    Exporter.render($('export-canvas'), state.week, { date: new Date() });
  }

  function copyText() {
    var text = Exporter.asText(state.week);

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(
        function () { toast('Menu copied'); },
        function () { legacyCopy(text); }
      );
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

  /* ---------------- settings ---------------- */

  function buildDayPicker() {
    var box = $('nonveg-days');
    box.textContent = '';

    DAY_NAMES.forEach(function (day) {
      var on = state.settings.nonVegDays.indexOf(day) !== -1;
      var btn = el('button', on ? 'is-on' : null, day);
      btn.setAttribute('aria-pressed', String(on));
      btn.title = day + ': non-veg at ' + Planner.nonVegMealFor(day);

      btn.addEventListener('click', function () {
        var i = state.settings.nonVegDays.indexOf(day);
        if (i === -1) { state.settings.nonVegDays.push(day); }
        else { state.settings.nonVegDays.splice(i, 1); }
        buildDayPicker();
        settingsChanged();
      });

      box.appendChild(btn);
    });
  }

  function syncSettingsUI() {
    $('kids-slot').value = state.settings.kidsSlot;
    $('opt-elder').checked = state.settings.elderFriendly;
    $('opt-quick').checked = state.settings.quickBreakfast;
    $('opt-sunday').checked = state.settings.sundaySpecial;
    buildDayPicker();
  }

  /* A settings change that does not rebuild the plan is invisible, so
     the plan is regenerated immediately — locked meals still survive. */
  function settingsChanged() {
    regenerate();
    toast('Plan updated');
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
    ['plan', 'export', 'settings'].forEach(function (s) {
      $('screen-' + s).hidden = s !== name;
      $('tab-' + s).setAttribute('aria-selected', String(s === name));
    });
    if (name === 'export') { renderExport(); }
    window.scrollTo(0, 0);
  }

  function showRange(range) {
    currentRange = range;
    $('view-day').hidden = range !== 'day';
    $('view-week').hidden = range !== 'week';
    $('range-day').setAttribute('aria-selected', String(range === 'day'));
    $('range-week').setAttribute('aria-selected', String(range === 'week'));
  }

  function renderAll() {
    renderDay();
    renderWeek();
    if (currentScreen === 'export') { renderExport(); }
  }

  function init() {
    if (!load()) {
      state.week = Planner.generateWeek(state.settings, {}, null);
      save();
    }

    $('tab-plan').addEventListener('click', function () { showScreen('plan'); });
    $('tab-export').addEventListener('click', function () { showScreen('export'); });
    $('tab-settings').addEventListener('click', function () { showScreen('settings'); });

    $('range-day').addEventListener('click', function () { showRange('day'); });
    $('range-week').addEventListener('click', function () { showRange('week'); });

    $('btn-regenerate').addEventListener('click', function () {
      regenerate();
      toast(Object.keys(state.locked).length ? 'New plan — locked meals kept' : 'New plan');
    });

    /* "Right now" means the meal you are actually about to cook. */
    $('btn-surprise').addEventListener('click', function () {
      var meal = Planner.currentMeal();
      showRange('day');
      rerollSlot(Planner.todayIndex(), meal);
      toast('New idea for ' + MEAL_LABEL[meal].toLowerCase());
    });

    $('btn-copy').addEventListener('click', copyText);

    $('btn-download').addEventListener('click', function () {
      Exporter.download($('export-canvas'), 'menu-week.png').then(function (ok) {
        toast(ok ? 'Image saved' : 'Could not save the image');
      });
    });

    $('btn-print').addEventListener('click', function () { window.print(); });

    $('btn-share').addEventListener('click', function () {
      Exporter.share($('export-canvas'), Exporter.asText(state.week)).then(function (result) {
        if (result === 'unsupported') { toast('Sharing needs a phone browser — save the image instead'); }
        else if (result === 'failed') { toast('Could not open the share sheet'); }
      });
    });

    $('kids-slot').addEventListener('change', function (e) {
      state.settings.kidsSlot = e.target.value;
      settingsChanged();
    });

    $('opt-elder').addEventListener('change', function (e) {
      state.settings.elderFriendly = e.target.checked;
      settingsChanged();
    });

    $('opt-quick').addEventListener('change', function (e) {
      state.settings.quickBreakfast = e.target.checked;
      settingsChanged();
    });

    $('opt-sunday').addEventListener('change', function (e) {
      state.settings.sundaySpecial = e.target.checked;
      settingsChanged();
    });

    $('btn-reset').addEventListener('click', function () {
      try { localStorage.removeItem(STORE_KEY); } catch (e) { /* nothing to clear */ }
      state.settings = Planner.defaultSettings();
      state.locked = {};
      state.week = Planner.generateWeek(state.settings, {}, null);
      save();
      syncSettingsUI();
      renderAll();
      toast('Back to defaults');
    });

    syncSettingsUI();
    renderAll();
    showScreen('plan');
    showRange('day');
  }

  document.addEventListener('DOMContentLoaded', init);
})();
