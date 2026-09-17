/* ------------------------------------------------------------------
   Storage, rendering and wiring.

   One source of truth: a week. Today is a view onto one row of it, so
   rerolling tonight's dinner from Today is the same edit as rerolling
   it from Week.

   English only for now. Dish records still carry their Tamil name in
   js/data.js — unused by the UI, but it is the seed for the language
   switch rather than something to retype later.
   ------------------------------------------------------------------ */

(function () {
  'use strict';

  var STORE_KEY = 'food-menu/v1';
  var SVG_NS = 'http://www.w3.org/2000/svg';

  var MEAL_LABEL = { breakfast: 'Breakfast', lunch: 'Lunch', dinner: 'Dinner' };
  var MEAL_SHORT = { breakfast: 'B', lunch: 'L', dinner: 'D' };

  var FLAG_LABEL = {
    nonveg: 'Non-veg',
    kids: "Kids' pick",
    light: 'Light',
    quick: 'Quick'
  };

  var SCREENS = ['today', 'week', 'export', 'settings'];

  var state = {
    settings: Planner.defaultSettings(),
    week: null,
    locked: {}
  };

  var selectedDay = Planner.todayIndex();
  var currentScreen = 'today';
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
    /* older WebKit still wants the xlink form */
    use.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', '#' + name);
    svg.appendChild(use);
    return svg;
  }

  /* ---------------- dates ---------------- */

  function weekMonday() {
    var d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
    return d;
  }

  function dateFor(dayIndex) {
    var d = weekMonday();
    d.setDate(d.getDate() + dayIndex);
    return d;
  }

  function fmt(date, opts) { return date.toLocaleDateString('en-GB', opts); }

  function greeting() {
    var h = new Date().getHours();
    if (h < 12) { return 'Good morning'; }
    if (h < 17) { return 'Good afternoon'; }
    return 'Good evening';
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
    } catch (e) { /* the plan still works for this session */ }
  }

  /* ---------------- shared ---------------- */

  function flagNodes(badges, cls) {
    var frag = document.createDocumentFragment();
    (badges || []).forEach(function (b) {
      if (!FLAG_LABEL[b]) { return; }
      frag.appendChild(el('span', (cls || 'flag flag-' + b), FLAG_LABEL[b]));
    });
    return frag;
  }

  function isNewsworthy(flag) { return flag === 'nonveg' || flag === 'kids'; }

  function isLocked(dayIndex, meal) { return !!state.locked[dayIndex + '-' + meal]; }

  function toggleLock(dayIndex, meal) {
    var key = dayIndex + '-' + meal;
    if (state.locked[key]) { delete state.locked[key]; }
    else { state.locked[key] = true; }
    save();
    renderAll();
  }

  function reroll(dayIndex, meal) {
    if (isLocked(dayIndex, meal)) {
      toast('That meal is kept — unlock it first');
      return;
    }
    state.week[dayIndex][meal] = Planner.regenerateSlot(state.week, dayIndex, meal, state.settings);
    save();
    renderAll();
  }

  function regenerate() {
    state.week = Planner.generateWeek(state.settings, state.locked, state.week);
    save();
    renderAll();
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

      chip.addEventListener('click', function () {
        selectedDay = i;
        renderToday();
      });

      strip.appendChild(chip);
    });
  }

  function renderToday() {
    var todayIdx = Planner.todayIndex();
    var isToday = selectedDay === todayIdx;
    var date = dateFor(selectedDay);
    var row = state.week[selectedDay];

    var title;
    if (isToday) { title = 'Today'; }
    else if (selectedDay === todayIdx + 1) { title = 'Tomorrow'; }
    else { title = fmt(date, { weekday: 'long' }); }

    $('today-eyebrow').textContent = isToday ? greeting() : 'Planned';
    $('today-title').textContent = title;
    $('today-date').textContent = fmt(date, { weekday: isToday ? 'long' : undefined, day: 'numeric', month: 'long' });

    renderDayStrip();

    var body = $('today-body');
    body.textContent = '';

    /* Only the real today has a meal that is genuinely "up next", so
       only today gets the hero treatment. */
    if (!isToday) {
      body.appendChild(sectionLabel('All three meals'));
      body.appendChild(stackOf(MEAL_ORDER, selectedDay));
      return;
    }

    var nowMeal = Planner.currentMeal();
    var at = MEAL_ORDER.indexOf(nowMeal);
    var before = MEAL_ORDER.slice(0, at);
    var after = MEAL_ORDER.slice(at + 1);

    body.appendChild(heroCard(row[nowMeal], selectedDay, nowMeal));

    if (after.length) {
      body.appendChild(sectionLabel('Later today'));
      body.appendChild(stackOf(after, selectedDay));
    }
    if (before.length) {
      body.appendChild(sectionLabel('Earlier today'));
      body.appendChild(stackOf(before, selectedDay));
    }
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

    var meta = el('span', 'hero-meta');
    meta.appendChild(icon('i-clock', 'icon-sm'));
    meta.appendChild(el('span', null, slot ? slot.mins + ' min' : '—'));
    top.appendChild(meta);
    card.appendChild(top);

    if (!slot) {
      card.appendChild(el('h2', 'hero-dish', 'Nothing planned'));
      return card;
    }

    card.appendChild(el('h2', 'hero-dish', slot.dish));

    if (slot.sides && slot.sides.length) {
      var ul = el('ul', 'hero-sides');
      slot.sides.forEach(function (s) { ul.appendChild(el('li', null, s)); });
      card.appendChild(ul);
    }

    if (slot.badges && slot.badges.length) {
      var flags = el('div', 'hero-flags');
      flags.appendChild(flagNodes(slot.badges, 'flag'));
      card.appendChild(flags);
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

  /* A card holding one row per meal. Fewer borders than a card each,
     which matters when the week view shows 21 of them. */
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
    tag.setAttribute('title', MEAL_LABEL[meal]);
    row.appendChild(tag);

    var body = el('div', 'row-body');

    var dish = el('div', 'row-dish');
    dish.appendChild(el('span', null, slot ? slot.dish : 'Nothing planned'));
    /* Only flags that carry real news here. "Light" and "Quick" are
       noise in a dense list — the minutes are already in the row, and
       they were wrapping every long dish name onto a third line. */
    if (slot && slot.badges) {
      dish.appendChild(flagNodes(slot.badges.filter(isNewsworthy).slice(0, 1)));
    }
    body.appendChild(dish);

    if (slot && slot.sides && slot.sides.length) {
      body.appendChild(el('div', 'row-sides', slot.sides.join(' · ')));
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
    lock.title = locked ? 'Kept — a new plan will not change this' : 'Keep this meal';
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

    $('week-range').textContent =
      fmt(dateFor(0), { day: 'numeric', month: 'short' }) + ' – ' +
      fmt(dateFor(6), { day: 'numeric', month: 'short' });

    state.week.forEach(function (row, dayIndex) {
      var weekend = row.day === 'Sat' || row.day === 'Sun';
      var today = dayIndex === todayIdx;

      var block = el('section', 'day-block' +
        (today ? ' is-today' : '') + (weekend ? ' is-weekend' : ''));

      var head = el('div', 'day-block-head');
      head.appendChild(el('span', 'name', DAY_FULL[row.day] || row.day));
      head.appendChild(el('span', 'when',
        today ? 'Today' : fmt(dateFor(dayIndex), { day: 'numeric', month: 'short' })));
      block.appendChild(head);

      block.appendChild(stackOf(MEAL_ORDER, dayIndex));
      body.appendChild(block);
    });
  }

  /* ---------------- export ---------------- */

  function renderExport() {
    Exporter.render($('export-canvas'), state.week, { monday: dateFor(0) });
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

  function renderPicker() {
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
        renderPicker();
        settingsChanged();
      });

      box.appendChild(btn);
    });
  }

  function syncSettings() {
    $('kids-slot').value = state.settings.kidsSlot;
    $('opt-elder').checked = state.settings.elderFriendly;
    $('opt-quick').checked = state.settings.quickBreakfast;
    $('opt-sunday').checked = state.settings.sundaySpecial;
    renderPicker();
  }

  /* A settings change that leaves the plan untouched is invisible, so
     the week rebuilds at once. Kept meals still survive. */
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
    SCREENS.forEach(function (s) {
      $('screen-' + s).hidden = s !== name;
      $('tab-' + s).setAttribute('aria-selected', String(s === name));
    });
    if (name === 'export') { renderExport(); }
    window.scrollTo(0, 0);
  }

  function renderAll() {
    renderToday();
    renderWeek();
    if (currentScreen === 'export') { renderExport(); }
  }

  function init() {
    if (!load()) {
      state.week = Planner.generateWeek(state.settings, {}, null);
      save();
    }

    SCREENS.forEach(function (s) {
      $('tab-' + s).addEventListener('click', function () { showScreen(s); });
    });

    /* Rerolls only the day you are looking at, not the whole week. */
    $('btn-new-day').addEventListener('click', function () {
      var changed = 0;
      MEAL_ORDER.forEach(function (meal) {
        if (isLocked(selectedDay, meal)) { return; }
        state.week[selectedDay][meal] =
          Planner.regenerateSlot(state.week, selectedDay, meal, state.settings);
        changed++;
      });
      save();
      renderAll();
      toast(changed ? 'New ideas for this day' : 'Every meal today is kept');
    });

    $('btn-new-week').addEventListener('click', function () {
      regenerate();
      toast(Object.keys(state.locked).length ? 'New plan — kept meals stay' : 'New plan');
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

    [['opt-elder', 'elderFriendly'], ['opt-quick', 'quickBreakfast'], ['opt-sunday', 'sundaySpecial']]
      .forEach(function (pair) {
        $(pair[0]).addEventListener('change', function (e) {
          state.settings[pair[1]] = e.target.checked;
          settingsChanged();
        });
      });

    $('btn-reset').addEventListener('click', function () {
      try { localStorage.removeItem(STORE_KEY); } catch (e) { /* nothing to clear */ }
      state.settings = Planner.defaultSettings();
      state.locked = {};
      state.week = Planner.generateWeek(state.settings, {}, null);
      selectedDay = Planner.todayIndex();
      save();
      syncSettings();
      renderAll();
      toast('Back to defaults');
    });

    syncSettings();
    renderAll();
    showScreen('today');
  }

  document.addEventListener('DOMContentLoaded', init);
})();
