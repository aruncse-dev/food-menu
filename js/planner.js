/* ==================================================================
   The generator.

   A meal is composed, not picked:

     base   a vegetarian main, always
     sides  one per "must" category, "may" categories about half the
            time — skipped silently if the house has none switched on
     addon  the protein for that day and meal, from the protein grid

   The protein grid is the whole configuration story. settings.protein
   is a plain 7 x 3 map of day -> meal -> 'veg' | 'egg' | 'chicken' |
   'fish' | 'mutton' | 'prawn'. "Egg with the kids' lunch every day"
   and "chicken on Sunday" are the same mechanism, so there is no
   special case for either.
   ================================================================== */

var Planner = (function () {
  'use strict';

  var REPEAT_WINDOW = { breakfast: 4, lunch: 5, dinner: 4 };
  var WEEKDAYS = { Mon: 1, Tue: 1, Wed: 1, Thu: 1, Fri: 1 };

  function emptyProtein() {
    var grid = {};
    DAY_NAMES.forEach(function (d) {
      grid[d] = { breakfast: 'veg', lunch: 'veg', dinner: 'veg' };
    });
    return grid;
  }

  function defaultSettings() {
    var protein = emptyProtein();
    /* A starting point, not a rule: chicken on Sunday, fish midweek. */
    protein.Sun.lunch = 'chicken';
    protein.Wed.dinner = 'fish';

    return {
      protein: protein,
      health: 'everyday',        /* everyday | lean */
      lightDinners: true,
      quickBreakfast: true
    };
  }

  function proteinAt(settings, day, meal) {
    var row = settings.protein && settings.protein[day];
    return (row && row[meal]) || 'veg';
  }

  function hasTag(dish, tag) { return (dish.tags || []).indexOf(tag) !== -1; }
  function pick(list) { return list[Math.floor(Math.random() * list.length)]; }

  /* ---------------- sides ---------------- */

  function rollSides(main) {
    var spec = main.sides || { must: [], may: [] };
    var out = [];
    var used = {};

    function take(cat) {
      var options = Library.sides(cat).filter(function (s) { return !used[s.id]; });
      if (!options.length) { return; }      /* nothing enabled here — fine */
      var chosen = pick(options);
      used[chosen.id] = true;
      out.push({ id: chosen.id, name: chosen.name, cat: chosen.cat });
    }

    (spec.must || []).forEach(take);
    (spec.may || []).forEach(function (cat) {
      if (Math.random() < 0.5) { take(cat); }
    });

    return out;
  }

  /* ---------------- candidate filtering ---------------- */

  function hardFilter(meal, day, settings, opts) {
    var weekday = !!WEEKDAYS[day];

    return Library.mains(meal).filter(function (d) {
      if (settings.lightDinners && meal === 'dinner' && hasTag(d, 'heavy')) { return false; }
      if (opts.quickCap && d.mins > 20) { return false; }
      if (opts.specialOnly && !hasTag(d, 'special')) { return false; }

      /* A working morning has no room for poori. */
      if (weekday && meal === 'breakfast' && hasTag(d, 'weekend')) { return false; }

      return true;
    });
  }

  function score(dish, meal, day, dayIndex, settings, lastSeen) {
    var s = 10;
    var weekday = !!WEEKDAYS[day];

    var seen = lastSeen[dish.id];
    if (seen !== undefined) {
      var gap = dayIndex - seen;
      if (gap < REPEAT_WINDOW[meal]) { s -= 100; }
      else { s -= Math.max(0, 8 - gap); }
    }

    if (settings.lightDinners && meal === 'dinner') {
      if (hasTag(dish, 'elder')) { s += 6; }
      if (hasTag(dish, 'light')) { s += 3; }
    }

    /* Lean mode nudges rather than filters: a household that wants to
       eat better still wants dosai sometimes. */
    if (settings.health === 'lean') {
      s += (dish.health || []).length * 2.5;
      if (hasTag(dish, 'heavy')) { s -= 6; }
    }

    if (hasTag(dish, 'weekend')) { s += weekday ? -8 : 3; }

    return s + Math.random() * 2;
  }

  function merge(a, b) {
    var out = {}, k;
    for (k in a) { if (Object.prototype.hasOwnProperty.call(a, k)) { out[k] = a[k]; } }
    for (k in b) { if (Object.prototype.hasOwnProperty.call(b, k)) { out[k] = b[k]; } }
    return out;
  }

  /* Filters relax in order rather than ever returning nothing. A
     household would rather see poori on a Tuesday than an empty box. */
  function pickMain(meal, day, dayIndex, settings, lastSeen, excludeId) {
    var base = {
      quickCap: settings.quickBreakfast && meal === 'breakfast' && !!WEEKDAYS[day],
      /* Sunday lunch is always the big one. This used to be a switch,
         but nobody was ever going to ask for a worse Sunday. */
      specialOnly: day === 'Sun' && meal === 'lunch'
    };

    var relaxations = [
      base,
      merge(base, { quickCap: false }),
      merge(base, { quickCap: false, specialOnly: false })
    ];

    var candidates = [];
    for (var i = 0; i < relaxations.length; i++) {
      candidates = hardFilter(meal, day, settings, relaxations[i]);
      if (candidates.length) { break; }
    }

    /* The house has switched everything off for this meal. */
    if (!candidates.length) { return null; }

    /* Never hand back the dish already there while an alternative
       exists: "Change" doing nothing reads as a broken button. */
    if (excludeId) {
      var others = candidates.filter(function (d) { return d.id !== excludeId; });
      if (others.length) { candidates = others; }
    }

    var scored = candidates.map(function (d) {
      return { dish: d, score: score(d, meal, day, dayIndex, settings, lastSeen) };
    });

    return weightedPick(scored);
  }

  /* Weighted by score rather than "everything within N of the best".
     A fixed band turned preferences into hard filters: the light-dinner
     bonus alone was bigger than the band, so any dinner dish without
     those tags — every dish a household adds itself, which starts
     untagged — could never be reached. Cubing keeps favourites clearly
     favoured while leaving the rest a real chance. */
  function weightedPick(scored) {
    var viable = scored.filter(function (x) { return x.score > 0; });
    if (!viable.length) { viable = scored; }

    var total = 0;
    viable.forEach(function (x) {
      x.weight = Math.pow(Math.max(x.score, 0.5), 3);
      total += x.weight;
    });

    var r = Math.random() * total;
    for (var i = 0; i < viable.length; i++) {
      r -= viable[i].weight;
      if (r <= 0) { return viable[i].dish; }
    }
    return viable[viable.length - 1].dish;
  }

  function pickAddon(kind, meal) {
    if (!kind || kind === 'veg') { return null; }
    var options = Library.addons(kind, meal);
    if (!options.length) { return null; }
    var a = pick(options);
    return { id: a.id, name: a.name, kind: a.kind, mins: a.mins };
  }

  /* ---------------- assembling a slot ---------------- */

  function buildSlot(main, meal, day, settings) {
    if (!main) { return null; }

    var addon = pickAddon(proteinAt(settings, day, meal), meal);

    /* The protein cooks alongside the base rather than after it, so
       half its time is a fairer estimate than the full amount. */
    var mins = main.mins + (addon ? Math.round(addon.mins / 2) : 0);

    var tags = [];
    if (hasTag(main, 'light')) { tags.push('light'); }
    if (mins <= 20) { tags.push('quick'); }

    return {
      id: main.id,
      main: main.name,
      mins: mins,
      sides: rollSides(main),
      addon: addon,
      tags: tags,
      health: (main.health || []).slice(0, 2)
    };
  }

  /* ---------------- public ---------------- */

  function generateWeek(settings, locked, previous) {
    locked = locked || {};
    var lastSeen = {};
    var week = [];

    /* Kept meals are registered first so the rest generates around
       them rather than colliding with them. */
    if (previous) {
      DAY_NAMES.forEach(function (day, dayIndex) {
        MEAL_ORDER.forEach(function (meal) {
          if (!locked[dayIndex + '-' + meal]) { return; }
          var slot = previous[dayIndex] && previous[dayIndex][meal];
          if (slot) { lastSeen[slot.id] = dayIndex; }
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

        var main = pickMain(meal, day, dayIndex, settings, lastSeen);
        if (main) { lastSeen[main.id] = dayIndex; }
        row[meal] = buildSlot(main, meal, day, settings);
      });

      week.push(row);
    });

    return week;
  }

  function regenerateSlot(week, dayIndex, meal, settings) {
    var lastSeen = {};

    week.forEach(function (row, i) {
      if (i === dayIndex) { return; }
      MEAL_ORDER.forEach(function (m) {
        if (row[m]) { lastSeen[row[m].id] = i; }
      });
    });

    var day = DAY_NAMES[dayIndex];
    var current = week[dayIndex][meal];
    var main = pickMain(meal, day, dayIndex, settings, lastSeen, current && current.id);

    if (!main) { return current; }
    return buildSlot(main, meal, day, settings);
  }

  /* Rerolls only the sides, keeping the main. Useful when the dish is
     right but the poriyal is not. */
  function regenerateSides(slot, settings) {
    if (!slot) { return slot; }
    var main = Library.find('main', slot.id);
    if (!main) { return slot; }

    var copy = {};
    for (var k in slot) { if (Object.prototype.hasOwnProperty.call(slot, k)) { copy[k] = slot[k]; } }
    copy.sides = rollSides(main);
    return copy;
  }

  function todayIndex(date) { return ((date || new Date()).getDay() + 6) % 7; }

  function currentMeal(date) {
    var h = (date || new Date()).getHours();
    if (h < 10) { return 'breakfast'; }
    if (h < 15) { return 'lunch'; }
    return 'dinner';
  }

  return {
    defaultSettings: defaultSettings,
    emptyProtein: emptyProtein,
    proteinAt: proteinAt,
    generateWeek: generateWeek,
    regenerateSlot: regenerateSlot,
    regenerateSides: regenerateSides,
    todayIndex: todayIndex,
    currentMeal: currentMeal
  };
})();
