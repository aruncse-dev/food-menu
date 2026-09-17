/* ==================================================================
   The household's own food list.

   Everything in js/data.js is a suggestion. This layer is what the
   house actually eats: which suggestions are switched off, and which
   dishes they added themselves.

   Stored as an "off" set rather than an "on" set on purpose — new
   dishes shipped in a later version then appear automatically instead
   of staying invisible until someone goes looking for them.
   ================================================================== */

var Library = (function () {
  'use strict';

  var store = {
    offMains: {}, offSides: {}, offAddons: {},
    customMains: [], customSides: [], customAddons: []
  };

  function hydrate(saved) {
    if (!saved) { return; }
    store.offMains = saved.offMains || {};
    store.offSides = saved.offSides || {};
    store.offAddons = saved.offAddons || {};
    store.customMains = saved.customMains || [];
    store.customSides = saved.customSides || [];
    store.customAddons = saved.customAddons || [];
  }

  function serialise() { return store; }

  /* ---------------- reading ---------------- */

  function allMains()  { return MAINS.concat(store.customMains); }
  function allSides()  { return SIDES.concat(store.customSides); }
  function allAddons() { return ADDONS.concat(store.customAddons); }

  function isOn(kind, id) {
    if (kind === 'main')  { return !store.offMains[id]; }
    if (kind === 'side')  { return !store.offSides[id]; }
    return !store.offAddons[id];
  }

  function mains(meal) {
    return allMains().filter(function (d) {
      return isOn('main', d.id) && (!meal || d.meals.indexOf(meal) !== -1);
    });
  }

  function sides(cat) {
    return allSides().filter(function (s) {
      return isOn('side', s.id) && (!cat || s.cat === cat);
    });
  }

  function addons(kind, meal) {
    return allAddons().filter(function (a) {
      return isOn('addon', a.id) &&
             (!kind || a.kind === kind) &&
             (!meal || a.meals.indexOf(meal) !== -1);
    });
  }

  function find(kind, id) {
    var list = kind === 'main' ? allMains() : kind === 'side' ? allSides() : allAddons();
    for (var i = 0; i < list.length; i++) {
      if (list[i].id === id) { return list[i]; }
    }
    return null;
  }

  /* ---------------- writing ---------------- */

  function toggle(kind, id, on) {
    var bag = kind === 'main' ? store.offMains : kind === 'side' ? store.offSides : store.offAddons;
    if (on) { delete bag[id]; } else { bag[id] = true; }
  }

  function setMany(kind, ids, on) {
    ids.forEach(function (id) { toggle(kind, id, on); });
  }

  function isCustom(id) { return id.indexOf('my-') === 0; }

  function slug(name) {
    return 'my-' + name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') +
           '-' + Math.random().toString(36).slice(2, 6);
  }

  /* A dish the household added. Sides default to a chutney or a gravy
     depending on the meal, which is right far more often than an empty
     plate and can be changed by rerolling. */
  function addMain(name, meals, mins, tags) {
    var dish = {
      id: slug(name),
      name: name.trim(),
      tamil: '',
      meals: meals.length ? meals : ['dinner'],
      mins: mins || 25,
      tags: tags || [],
      health: [],
      sides: { must: [], may: ['chutney', 'gravy', 'accompaniment'] }
    };
    store.customMains.push(dish);
    return dish;
  }

  function addSide(name, cat) {
    var side = { id: slug(name), name: name.trim(), cat: cat, health: [] };
    store.customSides.push(side);
    return side;
  }

  function addAddon(name, kind, meals, mins) {
    var addon = {
      id: slug(name),
      name: name.trim(),
      kind: kind,
      meals: meals.length ? meals : ['lunch', 'dinner'],
      mins: mins || 30,
      health: ['protein']
    };
    store.customAddons.push(addon);
    return addon;
  }

  function remove(kind, id) {
    var key = kind === 'main' ? 'customMains' : kind === 'side' ? 'customSides' : 'customAddons';
    store[key] = store[key].filter(function (d) { return d.id !== id; });
    toggle(kind, id, true);
  }

  function reset() {
    store.offMains = {}; store.offSides = {}; store.offAddons = {};
    store.customMains = []; store.customSides = []; store.customAddons = [];
  }

  /* How many mains the house has left switched on for each meal —
     used to warn before the planner has nothing to work with. */
  function counts() {
    var out = { sides: sides().length, addons: addons().length };
    MEAL_ORDER.forEach(function (m) { out[m] = mains(m).length; });
    return out;
  }

  return {
    hydrate: hydrate, serialise: serialise, reset: reset,
    allMains: allMains, allSides: allSides, allAddons: allAddons,
    mains: mains, sides: sides, addons: addons,
    isOn: isOn, toggle: toggle, setMany: setMany, find: find,
    isCustom: isCustom, counts: counts,
    addMain: addMain, addSide: addSide, addAddon: addAddon, remove: remove
  };
})();
