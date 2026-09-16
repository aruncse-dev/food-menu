/* ------------------------------------------------------------------
   The generator.

   Random, but with rules. The rules are what stop it producing
   nonsense like parotta for breakfast on a Tuesday or biryani three
   days running.

   One source of truth: a week. "Today" is just today's row of it.
   ------------------------------------------------------------------ */

var Planner = (function () {
  'use strict';

  /* How many days must pass before a dish can come back. */
  var REPEAT_WINDOW = { breakfast: 4, lunch: 5, dinner: 4 };

  var WEEKDAYS = { Mon: 1, Tue: 1, Wed: 1, Thu: 1, Fri: 1 };

  function defaultSettings() {
    return {
      nonVegDays: ['Wed', 'Sun'],
      kidsSlot: 'Sat-dinner',
      elderFriendly: true,
      quickBreakfast: true,
      sundaySpecial: true
    };
  }

  /* On a non-veg day the main non-veg meal is lunch at the weekend and
     dinner on a working day, because weekday lunch is usually a box. */
  function nonVegMealFor(day) {
    return WEEKDAYS[day] ? 'dinner' : 'lunch';
  }

  function isNonVegSlot(day, meal, settings) {
    return settings.nonVegDays.indexOf(day) !== -1 && nonVegMealFor(day) === meal;
  }

  function hasTag(dish, tag) {
    return dish.tags.indexOf(tag) !== -1;
  }

  function pick(list) {
    return list[Math.floor(Math.random() * list.length)];
  }

  /* One item from each group, so the same main turns up with
     different accompaniments on different days. */
  function rollSides(dish) {
    return (dish.sides || []).map(pick);
  }

  function badgesFor(dish, isKidsSlot) {
    var out = [];
    if (dish.kind !== 'veg') { out.push('nonveg'); }
    if (isKidsSlot) { out.push('kids'); }
    if (hasTag(dish, 'light') && out.length < 3) { out.push('light'); }
    if (dish.mins <= 20 && out.length < 3) { out.push('quick'); }
    return out;
  }

  function toSlot(dish, isKidsSlot) {
    return {
      id: dish.id,
      dish: dish.name,
      tamil: dish.tamil,
      sides: rollSides(dish),
      mins: dish.mins,
      badges: badgesFor(dish, isKidsSlot)
    };
  }

  /* ---------------- candidate filtering ---------------- */

  function hardFilter(meal, day, settings, opts) {
    var wantNonVeg = opts.nonVegSlot;
    var kidsSlot = opts.kidsSlot;
    var weekday = !!WEEKDAYS[day];

    return DISHES.filter(function (d) {
      if (d.meals.indexOf(meal) === -1) { return false; }

      /* Veg unless this is explicitly the household's non-veg slot. */
      if (wantNonVeg) {
        if (d.kind === 'veg') { return false; }
      } else if (d.kind !== 'veg') {
        return false;
      }

      if (kidsSlot && !hasTag(d, 'kid')) { return false; }

      if (settings.elderFriendly && meal === 'dinner' && hasTag(d, 'heavy')) { return false; }

      if (opts.quickCap && d.mins > 20) { return false; }

      if (opts.specialOnly && !hasTag(d, 'special')) { return false; }

      /* Elaborate dishes are a weekend thing. Hard rule for breakfast,
         where a working morning genuinely has no room for poori. */
      if (weekday && meal === 'breakfast' && hasTag(d, 'weekend')) { return false; }

      return true;
    });
  }

  function score(dish, meal, day, dayIndex, settings, lastSeen) {
    var s = 10;
    var weekday = !!WEEKDAYS[day];

    var seen = lastSeen[dish.id];
    if (seen !== undefined) {
      var gap = dayIndex - seen.dayIndex;
      if (gap < REPEAT_WINDOW[meal]) { s -= 100; }
      else { s -= Math.max(0, 8 - gap); }
    }

    if (settings.elderFriendly && meal === 'dinner') {
      if (hasTag(dish, 'elder')) { s += 6; }
      if (hasTag(dish, 'light')) { s += 3; }
    }

    if (hasTag(dish, 'weekend')) { s += weekday ? -8 : 3; }

    /* A little noise so two runs of the same week differ. */
    return s + Math.random() * 2;
  }

  /* Fills one slot. Filters are relaxed in order rather than ever
     returning nothing: a household would rather see poori on a Tuesday
     than an empty box. */
  function fillSlot(meal, day, dayIndex, settings, lastSeen) {
    var base = {
      nonVegSlot: isNonVegSlot(day, meal, settings),
      kidsSlot: settings.kidsSlot === day + '-' + meal,
      quickCap: settings.quickBreakfast && meal === 'breakfast' && !!WEEKDAYS[day],
      specialOnly: settings.sundaySpecial && day === 'Sun' && meal === 'lunch'
    };

    var relaxations = [
      base,
      merge(base, { quickCap: false }),
      merge(base, { quickCap: false, specialOnly: false }),
      merge(base, { quickCap: false, specialOnly: false, kidsSlot: false }),
      merge(base, { quickCap: false, specialOnly: false, kidsSlot: false, nonVegSlot: false })
    ];

    var candidates = [];
    for (var i = 0; i < relaxations.length; i++) {
      candidates = hardFilter(meal, day, settings, relaxations[i]);
      if (candidates.length) { break; }
    }
    if (!candidates.length) { return null; }

    var scored = candidates.map(function (d) {
      return { dish: d, score: score(d, meal, day, dayIndex, settings, lastSeen) };
    });

    var best = scored.reduce(function (a, b) { return b.score > a.score ? b : a; }).score;

    /* Everything close to the best is fair game, so "new plan" gives a
       genuinely different week rather than the same deterministic one. */
    var shortlist = scored.filter(function (x) { return x.score >= best - 4; });

    return pick(shortlist).dish;
  }

  function merge(a, b) {
    var out = {}, k;
    for (k in a) { if (Object.prototype.hasOwnProperty.call(a, k)) { out[k] = a[k]; } }
    for (k in b) { if (Object.prototype.hasOwnProperty.call(b, k)) { out[k] = b[k]; } }
    return out;
  }

  /* ---------------- public ---------------- */

  /* Builds a fresh week. Any slot marked in `locked` is copied over
     from `previous` untouched, and still counts against repeats. */
  function generateWeek(settings, locked, previous) {
    locked = locked || {};
    var lastSeen = {};
    var week = [];

    /* Locked slots are registered first so the rest of the week is
       generated around them rather than colliding with them. */
    if (previous) {
      DAY_NAMES.forEach(function (day, dayIndex) {
        MEAL_ORDER.forEach(function (meal) {
          if (!locked[dayIndex + '-' + meal]) { return; }
          var slot = previous[dayIndex] && previous[dayIndex][meal];
          if (slot) { lastSeen[slot.id] = { dayIndex: dayIndex }; }
        });
      });
    }

    DAY_NAMES.forEach(function (day, dayIndex) {
      var row = { day: day };

      MEAL_ORDER.forEach(function (meal) {
        var key = dayIndex + '-' + meal;

        if (locked[key] && previous && previous[dayIndex] && previous[dayIndex][meal]) {
          row[meal] = previous[dayIndex][meal];
          return;
        }

        var dish = fillSlot(meal, day, dayIndex, settings, lastSeen);
        if (!dish) { row[meal] = null; return; }

        lastSeen[dish.id] = { dayIndex: dayIndex };
        row[meal] = toSlot(dish, settings.kidsSlot === day + '-' + meal);
      });

      week.push(row);
    });

    return week;
  }

  /* Rerolls a single meal, keeping the rest of the week as context so
     it does not hand back something eaten yesterday. */
  function regenerateSlot(week, dayIndex, meal, settings) {
    var lastSeen = {};

    week.forEach(function (row, i) {
      if (i === dayIndex) { return; }
      MEAL_ORDER.forEach(function (m) {
        if (row[m]) { lastSeen[row[m].id] = { dayIndex: i }; }
      });
    });

    var day = DAY_NAMES[dayIndex];
    var current = week[dayIndex][meal];
    var dish = fillSlot(meal, day, dayIndex, settings, lastSeen);

    /* Try once more if we landed on what is already there. */
    if (dish && current && dish.id === current.id) {
      var again = fillSlot(meal, day, dayIndex, settings, lastSeen);
      if (again) { dish = again; }
    }

    if (!dish) { return current; }
    return toSlot(dish, settings.kidsSlot === day + '-' + meal);
  }

  /* Mon-first index for a Date. */
  function todayIndex(date) {
    return ((date || new Date()).getDay() + 6) % 7;
  }

  /* Which meal is the useful answer to "what do I cook right now". */
  function currentMeal(date) {
    var h = (date || new Date()).getHours();
    if (h < 10) { return 'breakfast'; }
    if (h < 15) { return 'lunch'; }
    return 'dinner';
  }

  return {
    defaultSettings: defaultSettings,
    generateWeek: generateWeek,
    regenerateSlot: regenerateSlot,
    todayIndex: todayIndex,
    currentMeal: currentMeal,
    nonVegMealFor: nonVegMealFor
  };
})();
