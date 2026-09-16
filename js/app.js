/* ------------------------------------------------------------------
   UI shell.
   Step 1: renders the hardcoded sample plan from js/sample-data.js.
   Step 2: the same render functions get fed by js/planner.js instead,
   and the generate / shuffle buttons stop being placeholders.
   ------------------------------------------------------------------ */

(function () {
  'use strict';

  var MEALS = ['breakfast', 'lunch', 'dinner'];

  var MEAL_LABEL = {
    breakfast: 'Breakfast',
    lunch: 'Lunch',
    dinner: 'Dinner'
  };

  var BADGE_LABEL = {
    nonveg: 'Non-veg',
    kids: "Kids' pick",
    light: 'Light',
    quick: 'Quick'
  };

  var DAY_FULL = {
    Mon: 'Monday', Tue: 'Tuesday', Wed: 'Wednesday', Thu: 'Thursday',
    Fri: 'Friday', Sat: 'Saturday', Sun: 'Sunday'
  };

  var locked = {};   // "2-lunch" -> true

  function $(id) { return document.getElementById(id); }

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) { node.className = className; }
    if (text !== undefined) { node.textContent = text; }
    return node;
  }

  function badgeNodes(badges) {
    var frag = document.createDocumentFragment();
    (badges || []).forEach(function (b) {
      if (!BADGE_LABEL[b]) { return; }
      frag.appendChild(el('span', 'badge badge-' + b, BADGE_LABEL[b]));
    });
    return frag;
  }

  /* ---------------- day view ---------------- */

  function renderDay(plan) {
    var today = new Date();
    $('day-date').textContent = today.toLocaleDateString(undefined, {
      weekday: 'long', day: 'numeric', month: 'long'
    });

    var list = $('day-meals');
    list.textContent = '';

    MEALS.forEach(function (meal) {
      var slot = plan[meal];
      if (!slot) { return; }

      var card = el('article', 'meal-card');
      card.setAttribute('data-meal', meal);

      var head = el('div', 'meal-head');
      head.appendChild(el('span', 'meal-label', MEAL_LABEL[meal]));
      head.appendChild(el('span', 'meal-time', slot.mins + ' min'));
      head.appendChild(el('span', 'spacer'));

      var shuffle = el('button', 'btn btn-icon', '🎲');
      shuffle.title = 'Change just this meal';
      shuffle.setAttribute('aria-label', 'Change ' + MEAL_LABEL[meal]);
      shuffle.addEventListener('click', function () { notYet(); });
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
        var row = el('div', 'badges');
        row.appendChild(badgeNodes(slot.badges));
        card.appendChild(row);
      }

      list.appendChild(card);
    });
  }

  /* ---------------- week view ---------------- */

  function renderWeek(week) {
    var grid = $('week-grid');
    grid.textContent = '';

    grid.appendChild(el('div', 'col-head', ''));
    MEALS.forEach(function (meal) {
      grid.appendChild(el('div', 'col-head', MEAL_LABEL[meal]));
    });

    week.forEach(function (day, dayIndex) {
      var isWeekend = day.day === 'Sat' || day.day === 'Sun';
      var head = el('div', 'row-head' + (isWeekend ? ' is-weekend' : ''));
      head.appendChild(el('span', null, day.day));
      head.appendChild(el('span', 'day-sub', DAY_FULL[day.day] || ''));
      grid.appendChild(head);

      MEALS.forEach(function (meal) {
        grid.appendChild(cellNode(day[meal], dayIndex, meal));
      });
    });
  }

  function cellNode(slot, dayIndex, meal) {
    var key = dayIndex + '-' + meal;
    var cell = el('div', 'cell' + (locked[key] ? ' is-locked' : ''));
    cell.setAttribute('data-meal-label', MEAL_LABEL[meal]);

    if (!slot) { return cell; }

    cell.appendChild(el('div', 'cell-dish', slot.dish));

    if (slot.sides && slot.sides.length) {
      cell.appendChild(el('div', 'cell-sides', slot.sides.join(' · ')));
    }

    if (slot.badges && slot.badges.length) {
      var row = el('div', 'cell-badges');
      row.appendChild(badgeNodes(slot.badges));
      cell.appendChild(row);
    }

    var lock = el('button', 'cell-lock' + (locked[key] ? ' is-on' : ''), locked[key] ? '🔒' : '🔓');
    lock.title = locked[key] ? 'Locked — a new plan will keep this' : 'Lock this meal';
    lock.setAttribute('aria-label', lock.title);
    lock.addEventListener('click', function () {
      locked[key] = !locked[key];
      renderWeek(SAMPLE_WEEK);
    });
    cell.appendChild(lock);

    return cell;
  }

  /* ---------------- copy as text ---------------- */

  function planAsText() {
    if (currentRange === 'day') {
      var lines = ['🍛 Today'];
      MEALS.forEach(function (meal) {
        var slot = SAMPLE_DAY[meal];
        if (slot) { lines.push(MEAL_LABEL[meal] + ': ' + slotLine(slot)); }
      });
      return lines.join('\n');
    }

    var out = ['🍛 This week'];
    SAMPLE_WEEK.forEach(function (day) {
      out.push('');
      out.push(DAY_FULL[day.day] || day.day);
      MEALS.forEach(function (meal) {
        if (day[meal]) { out.push('  ' + MEAL_LABEL[meal] + ': ' + slotLine(day[meal])); }
      });
    });
    return out.join('\n');
  }

  function slotLine(slot) {
    if (slot.sides && slot.sides.length) {
      return slot.dish + ' with ' + slot.sides.join(', ');
    }
    return slot.dish;
  }

  function copyPlan() {
    var text = planAsText();

    // navigator.clipboard is unavailable on file:// in some browsers, so fall back.
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(
        function () { toast('Plan copied'); },
        function () { legacyCopy(text); }
      );
      return;
    }
    legacyCopy(text);
  }

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
    toast(ok ? 'Plan copied' : 'Could not copy — select the text manually');
  }

  /* ---------------- chrome ---------------- */

  var currentRange = 'day';
  var toastTimer;

  function toast(message) {
    var node = $('toast');
    node.textContent = message;
    node.classList.add('is-visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { node.classList.remove('is-visible'); }, 2200);
  }

  function notYet() {
    toast('Mock — the generator lands in step 2');
  }

  function showScreen(name) {
    $('screen-plan').hidden = name !== 'plan';
    $('screen-settings').hidden = name !== 'settings';
    $('tab-plan').setAttribute('aria-selected', String(name === 'plan'));
    $('tab-settings').setAttribute('aria-selected', String(name === 'settings'));
  }

  function showRange(range) {
    currentRange = range;
    $('view-day').hidden = range !== 'day';
    $('view-week').hidden = range !== 'week';
    $('range-day').setAttribute('aria-selected', String(range === 'day'));
    $('range-week').setAttribute('aria-selected', String(range === 'week'));
  }

  function buildDayPicker() {
    var box = $('nonveg-days');
    var defaults = { Sun: true, Wed: true };

    ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].forEach(function (day) {
      var label = el('label', defaults[day] ? 'is-on' : null);
      label.textContent = day;
      label.addEventListener('click', function () {
        label.classList.toggle('is-on');
      });
      box.appendChild(label);
    });
  }

  function init() {
    $('tab-plan').addEventListener('click', function () { showScreen('plan'); });
    $('tab-settings').addEventListener('click', function () { showScreen('settings'); });

    $('range-day').addEventListener('click', function () { showRange('day'); });
    $('range-week').addEventListener('click', function () { showRange('week'); });

    $('btn-regenerate').addEventListener('click', notYet);
    $('btn-surprise').addEventListener('click', notYet);
    $('btn-reset').addEventListener('click', notYet);
    $('btn-copy').addEventListener('click', copyPlan);

    buildDayPicker();
    renderDay(SAMPLE_DAY);
    renderWeek(SAMPLE_WEEK);
    showScreen('plan');
    showRange('day');
  }

  document.addEventListener('DOMContentLoaded', init);
})();
