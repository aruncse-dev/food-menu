/* ==================================================================
   The food library.

   Three separate things, because a meal is made of three separate
   things:

     MAINS    the base dish. Always vegetarian.
     SIDES    accompaniments, grouped by category. All optional.
     ADDONS   the protein — egg, chicken, fish, mutton, prawn.

   Why the base is always veg: a household does not stop being
   vegetarian for the people who are. On a non-veg day the rice and
   kuzhambu still land on the table; the chicken is an extra dish
   beside it. Modelling it as "non-veg replaces the meal" was wrong,
   and it made "egg with the kids' lunch" impossible to express.

   Each main declares which side CATEGORIES it wants:
     must  one item is picked from each of these
     may   picked about half the time, so the same main varies

   Health tags drive the "lean" mode: low-oil, millet, protein,
   no-fry, fibre.
   ================================================================== */

var MEAL_ORDER = ['breakfast', 'lunch', 'dinner'];
var DAY_NAMES  = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

var DAY_FULL = {
  Mon: 'Monday', Tue: 'Tuesday', Wed: 'Wednesday', Thu: 'Thursday',
  Fri: 'Friday', Sat: 'Saturday', Sun: 'Sunday'
};

/* Side categories, in the order they should read on a plate. */
var CATEGORIES = [
  { id: 'sambar',        name: 'Sambar & rasam' },
  { id: 'kuzhambu',      name: 'Kuzhambu' },
  { id: 'chutney',       name: 'Chutney' },
  { id: 'podi',          name: 'Podi & thogayal' },
  { id: 'gravy',         name: 'Gravy & kurma' },
  { id: 'poriyal',       name: 'Poriyal' },
  { id: 'kootu',         name: 'Kootu' },
  { id: 'accompaniment', name: 'Curd, pickle, appalam' },
  { id: 'extra',         name: 'Extras' }
];

var ADDON_KINDS = [
  { id: 'veg',    name: 'Veg only', short: 'Veg' },
  { id: 'egg',    name: 'Egg',      short: 'Egg' },
  { id: 'chicken', name: 'Chicken', short: 'Chicken' },
  { id: 'fish',   name: 'Fish',     short: 'Fish' },
  { id: 'mutton', name: 'Mutton',   short: 'Mutton' },
  { id: 'prawn',  name: 'Prawn',    short: 'Prawn' }
];

var HEALTH_LABEL = {
  'low-oil': 'Low oil',
  'millet':  'Millet',
  'protein': 'Protein',
  'no-fry':  'No fry',
  'fibre':   'Fibre'
};

/* ---------------- mains ---------------- */

var MAINS = [

  /* --- breakfast --- */
  { id: 'idli', name: 'Idli', tamil: 'இட்லி', meals: ['breakfast', 'dinner'], mins: 20,
    tags: ['kid', 'elder', 'light', 'quick'], health: ['no-fry', 'low-oil'],
    sides: { must: ['sambar', 'chutney'], may: ['podi'] } },

  { id: 'dosai', name: 'Dosai', tamil: 'தோசை', meals: ['breakfast', 'dinner'], mins: 25,
    tags: ['kid', 'elder', 'light'], health: [],
    sides: { must: ['chutney'], may: ['sambar', 'podi'] } },

  { id: 'ragi-dosai', name: 'Ragi dosai', tamil: 'ராகி தோசை', meals: ['breakfast', 'dinner'], mins: 25,
    tags: ['elder', 'light'], health: ['millet', 'fibre', 'low-oil'],
    sides: { must: ['chutney'], may: ['sambar'] } },

  { id: 'millet-dosai', name: 'Millet dosai', tamil: 'சிறுதானிய தோசை', meals: ['breakfast', 'dinner'], mins: 25,
    tags: ['light'], health: ['millet', 'fibre'],
    sides: { must: ['chutney'], may: ['sambar'] } },

  { id: 'ragi-idli', name: 'Ragi idli', tamil: 'ராகி இட்லி', meals: ['breakfast', 'dinner'], mins: 22,
    tags: ['elder', 'light', 'quick'], health: ['millet', 'fibre', 'no-fry', 'low-oil'],
    sides: { must: ['sambar', 'chutney'], may: ['podi'] } },

  { id: 'masala-dosai', name: 'Masala dosai', tamil: 'மசாலா தோசை', meals: ['breakfast', 'dinner'], mins: 35,
    tags: ['kid', 'weekend'], health: [],
    sides: { must: ['chutney'], may: ['sambar'] } },

  { id: 'uthappam', name: 'Onion uthappam', tamil: 'ஊத்தப்பம்', meals: ['breakfast', 'dinner'], mins: 25,
    tags: ['kid'], health: [],
    sides: { must: ['chutney'], may: ['sambar'] } },

  { id: 'rava-dosai', name: 'Rava dosai', tamil: 'ரவா தோசை', meals: ['breakfast', 'dinner'], mins: 25,
    tags: [], health: [],
    sides: { must: ['chutney'], may: ['sambar'] } },

  { id: 'ven-pongal', name: 'Ven pongal', tamil: 'வெண் பொங்கல்', meals: ['breakfast', 'dinner'], mins: 30,
    tags: ['kid', 'elder', 'light'], health: ['no-fry'],
    sides: { must: ['sambar'], may: ['chutney', 'extra'] } },

  { id: 'samai-pongal', name: 'Samai pongal', tamil: 'சாமை பொங்கல்', meals: ['breakfast', 'dinner'], mins: 32,
    tags: ['elder', 'light'], health: ['millet', 'fibre', 'low-oil'],
    sides: { must: ['sambar'], may: ['chutney'] } },

  { id: 'idiyappam', name: 'Idiyappam', tamil: 'இடியாப்பம்', meals: ['breakfast', 'dinner'], mins: 30,
    tags: ['elder', 'light'], health: ['no-fry', 'low-oil'],
    sides: { must: ['gravy'], may: [] } },

  { id: 'appam', name: 'Appam', tamil: 'ஆப்பம்', meals: ['breakfast', 'dinner'], mins: 30,
    tags: ['elder', 'light'], health: ['low-oil'],
    sides: { must: ['gravy'], may: [] } },

  { id: 'poori', name: 'Poori', tamil: 'பூரி', meals: ['breakfast', 'dinner'], mins: 30,
    tags: ['kid', 'weekend', 'heavy'], health: [],
    sides: { must: ['gravy'], may: [] } },

  { id: 'rava-upma', name: 'Rava upma', tamil: 'ரவா உப்புமா', meals: ['breakfast', 'dinner'], mins: 15,
    tags: ['quick', 'elder'], health: [],
    sides: { must: ['chutney'], may: ['extra'] } },

  { id: 'oats-upma', name: 'Oats upma', tamil: 'ஓட்ஸ் உப்புமா', meals: ['breakfast', 'dinner'], mins: 15,
    tags: ['quick', 'elder', 'light'], health: ['fibre', 'low-oil', 'no-fry'],
    sides: { must: ['chutney'], may: [] } },

  { id: 'semiya-upma', name: 'Semiya upma', tamil: 'சேமியா உப்புமா', meals: ['breakfast', 'dinner'], mins: 15,
    tags: ['quick', 'kid', 'light'], health: [],
    sides: { must: ['chutney'], may: [] } },

  { id: 'aval-upma', name: 'Aval upma', tamil: 'அவல் உப்புமா', meals: ['breakfast'], mins: 15,
    tags: ['quick', 'elder', 'light'], health: ['low-oil'],
    sides: { must: ['chutney'], may: [] } },

  { id: 'arisi-upma', name: 'Arisi upma', tamil: 'அரிசி உப்புமா', meals: ['breakfast', 'dinner'], mins: 25,
    tags: ['elder'], health: [],
    sides: { must: ['chutney'], may: ['accompaniment'] } },

  { id: 'paniyaram', name: 'Kuzhi paniyaram', tamil: 'குழி பணியாரம்', meals: ['breakfast', 'dinner'], mins: 25,
    tags: ['kid'], health: [],
    sides: { must: ['chutney'], may: ['sambar'] } },

  { id: 'adai', name: 'Adai', tamil: 'அடை', meals: ['breakfast', 'dinner'], mins: 30,
    tags: [], health: ['protein', 'fibre'],
    sides: { must: ['kootu'], may: ['extra'] } },

  { id: 'oats-adai', name: 'Oats adai', tamil: 'ஓட்ஸ் அடை', meals: ['breakfast', 'dinner'], mins: 28,
    tags: ['light'], health: ['protein', 'fibre', 'low-oil'],
    sides: { must: ['chutney'], may: ['kootu'] } },

  { id: 'sevai', name: 'Lemon sevai', tamil: 'எலுமிச்சை சேவை', meals: ['breakfast', 'dinner'], mins: 25,
    tags: ['light'], health: ['low-oil'],
    sides: { must: ['chutney'], may: [] } },

  { id: 'kichadi', name: 'Rava kichadi', tamil: 'ரவா கிச்சடி', meals: ['breakfast', 'dinner'], mins: 25,
    tags: [], health: [],
    sides: { must: ['chutney'], may: [] } },

  { id: 'ragi-kali', name: 'Ragi kali', tamil: 'ராகி களி', meals: ['breakfast', 'dinner'], mins: 20,
    tags: ['elder', 'light', 'quick'], health: ['millet', 'fibre', 'low-oil'],
    sides: { must: ['chutney'], may: [] } },

  { id: 'kambu-koozh', name: 'Kambu koozh', tamil: 'கம்பு கூழ்', meals: ['breakfast'], mins: 20,
    tags: ['elder', 'light', 'quick'], health: ['millet', 'fibre', 'low-oil', 'no-fry'],
    sides: { must: ['accompaniment'], may: [] } },

  { id: 'puttu', name: 'Puttu', tamil: 'புட்டு', meals: ['breakfast'], mins: 30,
    tags: ['elder'], health: ['no-fry', 'low-oil'],
    sides: { must: ['gravy'], may: [] } },

  { id: 'bread-toast', name: 'Bread toast', tamil: 'பிரெட் டோஸ்ட்', meals: ['breakfast'], mins: 10,
    tags: ['quick', 'kid'], health: [],
    sides: { must: ['extra'], may: [] } },

  { id: 'oats', name: 'Oats', tamil: 'ஓட்ஸ்', meals: ['breakfast'], mins: 10,
    tags: ['quick', 'elder', 'light'], health: ['fibre', 'no-fry', 'low-oil'],
    sides: { must: ['extra'], may: [] } },

  { id: 'fruit-bowl', name: 'Fruit & sprouts bowl', tamil: 'பழம் & முளைகட்டிய பயறு', meals: ['breakfast'], mins: 10,
    tags: ['quick', 'light', 'elder'], health: ['fibre', 'protein', 'no-fry', 'low-oil'],
    sides: { must: [], may: [] } },

  /* --- lunch --- */
  { id: 'full-meals', name: 'Full meals', tamil: 'சாப்பாடு', meals: ['lunch'], mins: 60,
    tags: ['weekend', 'special'], health: ['fibre'],
    sides: { must: ['sambar', 'poriyal', 'kootu', 'accompaniment'], may: ['kuzhambu'] } },

  { id: 'vathal-kuzhambu', name: 'Vathal kuzhambu meals', tamil: 'வத்தல் குழம்பு', meals: ['lunch'], mins: 40,
    tags: [], health: [],
    sides: { must: ['poriyal', 'accompaniment'], may: ['podi', 'kootu'] } },

  { id: 'kara-kuzhambu', name: 'Kara kuzhambu meals', tamil: 'கார குழம்பு', meals: ['lunch'], mins: 40,
    tags: [], health: [],
    sides: { must: ['poriyal', 'accompaniment'], may: ['sambar'] } },

  { id: 'more-kuzhambu', name: 'More kuzhambu meals', tamil: 'மோர் குழம்பு', meals: ['lunch'], mins: 35,
    tags: ['elder', 'light'], health: ['low-oil'],
    sides: { must: ['poriyal'], may: ['accompaniment'] } },

  { id: 'poricha-kuzhambu', name: 'Poricha kuzhambu meals', tamil: 'பொரிச்ச குழம்பு', meals: ['lunch'], mins: 35,
    tags: ['elder', 'light'], health: ['low-oil', 'fibre'],
    sides: { must: ['accompaniment'], may: ['poriyal'] } },

  { id: 'ennai-kathirikai', name: 'Ennai kathirikai meals', tamil: 'எண்ணெய் கத்தரிக்காய்', meals: ['lunch'], mins: 45,
    tags: [], health: [],
    sides: { must: ['accompaniment'], may: ['poriyal'] } },

  { id: 'sambar-sadam', name: 'Sambar sadam', tamil: 'சாம்பார் சாதம்', meals: ['lunch'], mins: 35,
    tags: ['kid', 'onepot'], health: ['fibre'],
    sides: { must: ['accompaniment'], may: ['poriyal'] } },

  { id: 'rasam-sadam', name: 'Rasam sadam', tamil: 'ரசம் சாதம்', meals: ['lunch', 'dinner'], mins: 25,
    tags: ['elder', 'light', 'onepot'], health: ['low-oil'],
    sides: { must: ['accompaniment'], may: ['poriyal'] } },

  { id: 'thayir-sadam', name: 'Curd rice', tamil: 'தயிர் சாதம்', meals: ['lunch', 'dinner'], mins: 20,
    tags: ['kid', 'elder', 'light', 'quick', 'onepot'], health: ['no-fry', 'low-oil'],
    sides: { must: ['accompaniment'], may: [] } },

  { id: 'puliyodarai', name: 'Puliyodarai', tamil: 'புளியோதரை', meals: ['lunch'], mins: 30,
    tags: ['onepot'], health: [],
    sides: { must: ['accompaniment'], may: ['extra'] } },

  { id: 'lemon-rice', name: 'Lemon rice', tamil: 'எலுமிச்சை சாதம்', meals: ['lunch'], mins: 25,
    tags: ['quick', 'onepot'], health: ['low-oil'],
    sides: { must: ['accompaniment'], may: [] } },

  { id: 'coconut-rice', name: 'Coconut rice', tamil: 'தேங்காய் சாதம்', meals: ['lunch'], mins: 25,
    tags: ['onepot'], health: [],
    sides: { must: ['accompaniment'], may: [] } },

  { id: 'tomato-rice', name: 'Tomato rice', tamil: 'தக்காளி சாதம்', meals: ['lunch'], mins: 30,
    tags: ['kid', 'onepot'], health: [],
    sides: { must: ['accompaniment'], may: ['poriyal'] } },

  { id: 'millet-sadam', name: 'Varagu sambar sadam', tamil: 'வரகு சாம்பார் சாதம்', meals: ['lunch'], mins: 35,
    tags: ['onepot', 'light'], health: ['millet', 'fibre', 'low-oil'],
    sides: { must: ['accompaniment'], may: ['poriyal'] } },

  { id: 'brown-rice-meals', name: 'Brown rice meals', tamil: 'கைக்குத்தல் அரிசி சாப்பாடு', meals: ['lunch'], mins: 45,
    tags: ['light'], health: ['fibre', 'low-oil'],
    sides: { must: ['sambar', 'poriyal'], may: ['kootu', 'accompaniment'] } },

  { id: 'veg-biryani', name: 'Vegetable biryani', tamil: 'காய்கறி பிரியாணி', meals: ['lunch'], mins: 45,
    tags: ['kid', 'weekend', 'special'], health: [],
    sides: { must: ['accompaniment'], may: ['gravy'] } },

  { id: 'chapati', name: 'Chapati', tamil: 'சப்பாத்தி', meals: ['lunch', 'dinner'], mins: 30,
    tags: ['light'], health: ['fibre', 'low-oil'],
    sides: { must: ['gravy'], may: ['poriyal'] } },

  /* --- dinner --- */
  { id: 'parotta', name: 'Parotta', tamil: 'பரோட்டா', meals: ['dinner'], mins: 35,
    tags: ['weekend', 'heavy', 'kid'], health: [],
    sides: { must: ['gravy'], may: [] } },

  { id: 'kanji', name: 'Kanji', tamil: 'கஞ்சி', meals: ['dinner'], mins: 20,
    tags: ['elder', 'light', 'quick', 'onepot'], health: ['low-oil', 'no-fry'],
    sides: { must: ['accompaniment'], may: [] } },

  { id: 'veg-fried-rice', name: 'Veg fried rice', tamil: 'ஃப்ரைடு ரைஸ்', meals: ['dinner'], mins: 25,
    tags: ['kid'], health: [],
    sides: { must: ['extra'], may: [] } },

  { id: 'noodles', name: 'Veg noodles', tamil: 'நூடுல்ஸ்', meals: ['dinner'], mins: 25,
    tags: ['kid'], health: [],
    sides: { must: ['extra'], may: [] } },

  { id: 'pasta-red', name: 'Pasta in red sauce', tamil: 'பாஸ்தா', meals: ['dinner'], mins: 25,
    tags: ['kid'], health: [],
    sides: { must: ['extra'], may: [] } },

  { id: 'pasta-white', name: 'Pasta in white sauce', tamil: 'ஒயிட் சாஸ் பாஸ்தா', meals: ['dinner'], mins: 30,
    tags: ['kid'], health: [],
    sides: { must: ['extra'], may: [] } },

  { id: 'veg-cutlet', name: 'Veg cutlet', tamil: 'காய்கறி கட்லெட்', meals: ['dinner'], mins: 30,
    tags: ['kid'], health: [],
    sides: { must: ['extra'], may: [] } },

  { id: 'veg-soup-salad', name: 'Soup & salad', tamil: 'சூப் & சாலட்', meals: ['dinner'], mins: 20,
    tags: ['light', 'quick', 'elder'], health: ['fibre', 'low-oil', 'no-fry'],
    sides: { must: [], may: ['extra'] } },

  { id: 'steamed-veg', name: 'Steamed veg bowl', tamil: 'ஆவியில் வேகவைத்த காய்கறி', meals: ['dinner'], mins: 20,
    tags: ['light', 'elder'], health: ['fibre', 'low-oil', 'no-fry'],
    sides: { must: [], may: ['extra'] } }

];

/* ---------------- sides ---------------- */

var SIDES = [
  { id: 's-sambar',      name: 'Sambar',            cat: 'sambar',        health: ['fibre'] },
  { id: 's-rasam',       name: 'Rasam',             cat: 'sambar',        health: ['low-oil'] },
  { id: 's-pepper-rasam', name: 'Pepper rasam',     cat: 'sambar',        health: ['low-oil'] },

  { id: 's-vathal-k',    name: 'Vathal kuzhambu',   cat: 'kuzhambu',      health: [] },
  { id: 's-kara-k',      name: 'Kara kuzhambu',     cat: 'kuzhambu',      health: [] },
  { id: 's-more-k',      name: 'More kuzhambu',     cat: 'kuzhambu',      health: ['low-oil'] },

  { id: 's-coconut-ch',  name: 'Coconut chutney',   cat: 'chutney',       health: [] },
  { id: 's-tomato-ch',   name: 'Tomato chutney',    cat: 'chutney',       health: ['low-oil'] },
  { id: 's-mint-ch',     name: 'Mint chutney',      cat: 'chutney',       health: ['low-oil'] },
  { id: 's-coriander-ch', name: 'Coriander chutney', cat: 'chutney',      health: ['low-oil'] },
  { id: 's-onion-ch',    name: 'Onion chutney',     cat: 'chutney',       health: [] },
  { id: 's-peanut-ch',   name: 'Peanut chutney',    cat: 'chutney',       health: ['protein'] },
  { id: 's-garlic-ch',   name: 'Garlic chutney',    cat: 'chutney',       health: ['low-oil'] },

  { id: 's-idli-podi',   name: 'Idli podi',         cat: 'podi',          health: [] },
  { id: 's-paruppu-podi', name: 'Paruppu podi',     cat: 'podi',          health: ['protein'] },
  { id: 's-thogayal',    name: 'Paruppu thogayal',  cat: 'podi',          health: ['protein'] },

  { id: 's-veg-kurma',   name: 'Veg kurma',         cat: 'gravy',         health: [] },
  { id: 's-channa',      name: 'Channa masala',     cat: 'gravy',         health: ['protein', 'fibre'] },
  { id: 's-dal-fry',     name: 'Dal fry',           cat: 'gravy',         health: ['protein'] },
  { id: 's-potato-masala', name: 'Potato masala',   cat: 'gravy',         health: [] },
  { id: 's-coconut-milk', name: 'Coconut milk',     cat: 'gravy',         health: [] },
  { id: 's-sodhi',       name: 'Sodhi',             cat: 'gravy',         health: ['low-oil'] },
  { id: 's-veg-stew',    name: 'Veg stew',          cat: 'gravy',         health: ['low-oil', 'fibre'] },
  { id: 's-veg-salna',   name: 'Veg salna',         cat: 'gravy',         health: [] },
  { id: 's-kadala',      name: 'Kadala curry',      cat: 'gravy',         health: ['protein', 'fibre'] },

  { id: 's-beans-p',     name: 'Beans poriyal',     cat: 'poriyal',       health: ['fibre', 'low-oil'] },
  { id: 's-cabbage-p',   name: 'Cabbage poriyal',   cat: 'poriyal',       health: ['fibre', 'low-oil'] },
  { id: 's-carrot-p',    name: 'Carrot poriyal',    cat: 'poriyal',       health: ['fibre', 'low-oil'] },
  { id: 's-beetroot-p',  name: 'Beetroot poriyal',  cat: 'poriyal',       health: ['fibre'] },
  { id: 's-keerai-p',    name: 'Keerai poriyal',    cat: 'poriyal',       health: ['fibre', 'low-oil'] },
  { id: 's-avarakkai-p', name: 'Avarakkai poriyal', cat: 'poriyal',       health: ['fibre'] },
  { id: 's-chow-p',      name: 'Chow chow poriyal', cat: 'poriyal',       health: ['fibre', 'low-oil'] },
  { id: 's-potato-fry',  name: 'Potato fry',        cat: 'poriyal',       health: [] },

  { id: 's-pumpkin-k',   name: 'Pumpkin kootu',     cat: 'kootu',         health: ['fibre'] },
  { id: 's-chow-k',      name: 'Chow chow kootu',   cat: 'kootu',         health: ['fibre', 'low-oil'] },
  { id: 's-cabbage-k',   name: 'Cabbage kootu',     cat: 'kootu',         health: ['fibre'] },
  { id: 's-keerai-k',    name: 'Keerai kootu',      cat: 'kootu',         health: ['fibre', 'protein'] },
  { id: 's-avial',       name: 'Avial',             cat: 'kootu',         health: ['fibre'] },

  { id: 's-curd',        name: 'Curd',              cat: 'accompaniment', health: ['protein'] },
  { id: 's-buttermilk',  name: 'Buttermilk',        cat: 'accompaniment', health: ['low-oil'] },
  { id: 's-appalam',     name: 'Appalam',           cat: 'accompaniment', health: [] },
  { id: 's-sutta-appalam', name: 'Sutta appalam',   cat: 'accompaniment', health: ['no-fry', 'low-oil'] },
  { id: 's-pickle',      name: 'Pickle',            cat: 'accompaniment', health: [] },
  { id: 's-vathal',      name: 'Vathal',            cat: 'accompaniment', health: [] },
  { id: 's-onion-raita', name: 'Onion raita',       cat: 'accompaniment', health: ['low-oil'] },
  { id: 's-salad',       name: 'Kosumalli salad',   cat: 'accompaniment', health: ['fibre', 'no-fry', 'low-oil'] },

  { id: 's-medu-vada',   name: 'Medu vada',         cat: 'extra',         health: [] },
  { id: 's-ketchup',     name: 'Tomato ketchup',    cat: 'extra',         health: [] },
  { id: 's-garlic-bread', name: 'Garlic bread',     cat: 'extra',         health: [] },
  { id: 's-corn-soup',   name: 'Sweet corn soup',   cat: 'extra',         health: ['low-oil'] },
  { id: 's-manchurian',  name: 'Gobi manchurian',   cat: 'extra',         health: [] },
  { id: 's-banana',      name: 'Banana',            cat: 'extra',         health: ['fibre', 'no-fry'] },
  { id: 's-milk',        name: 'Milk',              cat: 'extra',         health: ['protein'] },
  { id: 's-honey',       name: 'Honey',             cat: 'extra',         health: [] },
  { id: 's-jaggery',     name: 'Jaggery',           cat: 'extra',         health: [] },
  { id: 's-sprouts',     name: 'Sprouts',           cat: 'extra',         health: ['protein', 'fibre', 'no-fry'] },
  { id: 's-nuts',        name: 'Dates & nuts',      cat: 'extra',         health: ['protein', 'no-fry'] }
];

/* ---------------- protein add-ons ---------------- */
/* These sit BESIDE the veg base, never instead of it. */

var ADDONS = [
  { id: 'a-boiled-egg',  name: 'Boiled egg',       kind: 'egg',     meals: ['breakfast', 'lunch', 'dinner'], mins: 10, health: ['protein', 'no-fry'] },
  { id: 'a-egg-poriyal', name: 'Egg poriyal',      kind: 'egg',     meals: ['lunch', 'dinner'],              mins: 15, health: ['protein'] },
  { id: 'a-egg-masala',  name: 'Egg masala',       kind: 'egg',     meals: ['lunch', 'dinner'],              mins: 20, health: ['protein'] },
  { id: 'a-omelette',    name: 'Omelette',         kind: 'egg',     meals: ['breakfast', 'dinner'],          mins: 10, health: ['protein'] },
  { id: 'a-egg-kuzhambu', name: 'Egg kuzhambu',    kind: 'egg',     meals: ['lunch'],                        mins: 25, health: ['protein'] },

  { id: 'a-chicken-curry', name: 'Chicken curry',  kind: 'chicken', meals: ['lunch', 'dinner'],              mins: 35, health: ['protein'] },
  { id: 'a-chicken-chukka', name: 'Chicken chukka', kind: 'chicken', meals: ['lunch', 'dinner'],             mins: 35, health: ['protein'] },
  { id: 'a-chicken-65',  name: 'Chicken 65',       kind: 'chicken', meals: ['lunch', 'dinner'],              mins: 30, health: ['protein'] },
  { id: 'a-pepper-chicken', name: 'Pepper chicken', kind: 'chicken', meals: ['lunch', 'dinner'],             mins: 35, health: ['protein', 'low-oil'] },

  { id: 'a-meen-kuzhambu', name: 'Meen kuzhambu',  kind: 'fish',    meals: ['lunch', 'dinner'],              mins: 35, health: ['protein'] },
  { id: 'a-meen-varuval', name: 'Meen varuval',    kind: 'fish',    meals: ['lunch', 'dinner'],              mins: 25, health: ['protein'] },
  { id: 'a-nethili-fry', name: 'Nethili fry',      kind: 'fish',    meals: ['lunch', 'dinner'],              mins: 20, health: ['protein'] },

  { id: 'a-mutton-kuzhambu', name: 'Mutton kuzhambu', kind: 'mutton', meals: ['lunch'],                      mins: 50, health: ['protein'] },
  { id: 'a-mutton-chukka', name: 'Mutton chukka',  kind: 'mutton',  meals: ['lunch', 'dinner'],              mins: 50, health: ['protein'] },

  { id: 'a-prawn-thokku', name: 'Prawn thokku',    kind: 'prawn',   meals: ['lunch', 'dinner'],              mins: 30, health: ['protein'] }
];
