/* ------------------------------------------------------------------
   The dish database.

   This is the heart of the app and the thing worth editing. Everything
   else is machinery. Add your family's dishes here and the planner
   picks them up with no other changes.

   A dish:
     id     unique slug
     name   English / transliterated name
     tamil  Tamil name, shown under it
     meals  which slots it can fill: breakfast | lunch | dinner
     kind   veg | egg | nonveg
     mins   rough cooking time, used by the quick-breakfast rule
     tags   kid    — children actually eat it
            elder  — soft, light, low-oil
            light  — easy on the stomach at night
            quick  — 20 minutes or less
            weekend— too long or too elaborate for a weekday
            heavy  — skipped when "easy on the elders" is on
            special— Sunday-lunch material
            onepot — no separate sides needed
     sides  groups of alternatives. One item is picked from each group,
            so the same main turns up with different accompaniments:
              [['Sambar'], ['Coconut chutney', 'Tomato chutney']]
            gives "Sambar · Coconut chutney" or "Sambar · Tomato chutney".
   ------------------------------------------------------------------ */

var DISHES = [

  /* ---------------- breakfast / tiffin ---------------- */

  { id: 'idli', name: 'Idli', tamil: 'இட்லி', meals: ['breakfast', 'dinner'], kind: 'veg', mins: 20,
    tags: ['kid', 'elder', 'light', 'quick'],
    sides: [['Sambar'], ['Coconut chutney', 'Tomato chutney', 'Mint chutney'], ['Idli podi']] },

  { id: 'dosai', name: 'Dosai', tamil: 'தோசை', meals: ['breakfast', 'dinner'], kind: 'veg', mins: 25,
    tags: ['kid', 'elder', 'light'],
    sides: [['Sambar'], ['Coconut chutney', 'Tomato chutney', 'Coriander chutney']] },

  { id: 'masala-dosai', name: 'Masala dosai', tamil: 'மசாலா தோசை', meals: ['breakfast', 'dinner'], kind: 'veg', mins: 35,
    tags: ['kid', 'weekend'],
    sides: [['Sambar'], ['Coconut chutney']] },

  { id: 'uthappam', name: 'Onion uthappam', tamil: 'வெங்காய ஊத்தப்பம்', meals: ['breakfast', 'dinner'], kind: 'veg', mins: 25,
    tags: ['kid'],
    sides: [['Sambar'], ['Coconut chutney', 'Tomato chutney']] },

  { id: 'rava-dosai', name: 'Rava dosai', tamil: 'ரவா தோசை', meals: ['breakfast', 'dinner'], kind: 'veg', mins: 25,
    tags: [],
    sides: [['Coconut chutney'], ['Sambar']] },

  { id: 'ven-pongal', name: 'Ven pongal', tamil: 'வெண் பொங்கல்', meals: ['breakfast', 'dinner'], kind: 'veg', mins: 30,
    tags: ['kid', 'elder', 'light'],
    sides: [['Medu vada'], ['Sambar'], ['Coconut chutney']] },

  { id: 'idiyappam', name: 'Idiyappam', tamil: 'இடியாப்பம்', meals: ['breakfast', 'dinner'], kind: 'veg', mins: 30,
    tags: ['elder', 'light'],
    sides: [['Coconut milk', 'Sodhi', 'Veg kurma']] },

  { id: 'appam', name: 'Appam', tamil: 'ஆப்பம்', meals: ['breakfast', 'dinner'], kind: 'veg', mins: 30,
    tags: ['elder', 'light'],
    sides: [['Coconut milk', 'Veg stew']] },

  { id: 'poori', name: 'Poori', tamil: 'பூரி', meals: ['breakfast', 'dinner'], kind: 'veg', mins: 30,
    tags: ['kid', 'weekend', 'heavy'],
    sides: [['Potato masala']] },

  { id: 'rava-upma', name: 'Rava upma', tamil: 'ரவா உப்புமா', meals: ['breakfast', 'dinner'], kind: 'veg', mins: 15,
    tags: ['quick', 'elder'],
    sides: [['Coconut chutney', 'Tomato chutney'], ['Sugar', 'Banana']] },

  { id: 'semiya-upma', name: 'Semiya upma', tamil: 'சேமியா உப்புமா', meals: ['breakfast', 'dinner'], kind: 'veg', mins: 15,
    tags: ['quick', 'kid', 'light'],
    sides: [['Coconut chutney', 'Tomato chutney']] },

  { id: 'aval-upma', name: 'Aval upma', tamil: 'அவல் உப்புமா', meals: ['breakfast'], kind: 'veg', mins: 15,
    tags: ['quick', 'elder', 'light'],
    sides: [['Coconut chutney']] },

  { id: 'arisi-upma', name: 'Arisi upma', tamil: 'அரிசி உப்புமா', meals: ['breakfast', 'dinner'], kind: 'veg', mins: 25,
    tags: ['elder'],
    sides: [['Coconut chutney'], ['Sutta appalam']] },

  { id: 'paniyaram', name: 'Kuzhi paniyaram', tamil: 'குழி பணியாரம்', meals: ['breakfast', 'dinner'], kind: 'veg', mins: 25,
    tags: ['kid'],
    sides: [['Coconut chutney'], ['Sambar']] },

  { id: 'adai', name: 'Adai', tamil: 'அடை', meals: ['breakfast', 'dinner'], kind: 'veg', mins: 30,
    tags: [],
    sides: [['Avial'], ['Jaggery', 'Butter']] },

  { id: 'sevai', name: 'Lemon sevai', tamil: 'எலுமிச்சை சேவை', meals: ['breakfast', 'dinner'], kind: 'veg', mins: 25,
    tags: ['light'],
    sides: [['Coconut chutney']] },

  { id: 'kichadi', name: 'Rava kichadi', tamil: 'ரவா கிச்சடி', meals: ['breakfast', 'dinner'], kind: 'veg', mins: 25,
    tags: [],
    sides: [['Coconut chutney']] },

  { id: 'ragi-kali', name: 'Ragi kali', tamil: 'ராகி களி', meals: ['breakfast', 'dinner'], kind: 'veg', mins: 20,
    tags: ['elder', 'light', 'quick'],
    sides: [['Garlic chutney', 'Buttermilk']] },

  { id: 'puttu', name: 'Puttu', tamil: 'புட்டு', meals: ['breakfast'], kind: 'veg', mins: 30,
    tags: ['elder'],
    sides: [['Kadala curry', 'Banana and sugar']] },

  { id: 'bread-toast', name: 'Bread toast', tamil: 'பிரெட் டோஸ்ட்', meals: ['breakfast'], kind: 'veg', mins: 10,
    tags: ['quick', 'kid'],
    sides: [['Jam', 'Butter'], ['Banana', 'Milk']] },

  { id: 'oats', name: 'Oats', tamil: 'ஓட்ஸ்', meals: ['breakfast'], kind: 'veg', mins: 10,
    tags: ['quick', 'elder', 'light'],
    sides: [['Banana', 'Dates', 'Honey']] },

  { id: 'egg-dosai', name: 'Egg dosai', tamil: 'முட்டை தோசை', meals: ['breakfast', 'dinner'], kind: 'egg', mins: 25,
    tags: ['kid'],
    sides: [['Coconut chutney'], ['Sambar']] },

  { id: 'bread-omelette', name: 'Bread omelette', tamil: 'ப்ரெட் ஆம்லெட்', meals: ['breakfast', 'dinner'], kind: 'egg', mins: 12,
    tags: ['quick', 'kid'],
    sides: [['Tomato ketchup']] },

  /* ---------------- lunch ---------------- */

  { id: 'vathal-kuzhambu', name: 'Vathal kuzhambu', tamil: 'வத்தல் குழம்பு', meals: ['lunch'], kind: 'veg', mins: 40,
    tags: [],
    sides: [['Rice'], ['Beans poriyal', 'Cabbage poriyal', 'Carrot poriyal'], ['Paruppu thogayal'], ['Appalam']] },

  { id: 'kara-kuzhambu', name: 'Kara kuzhambu', tamil: 'கார குழம்பு', meals: ['lunch'], kind: 'veg', mins: 40,
    tags: [],
    sides: [['Rice'], ['Cabbage poriyal', 'Beetroot poriyal'], ['Rasam'], ['Curd']] },

  { id: 'more-kuzhambu', name: 'More kuzhambu', tamil: 'மோர் குழம்பு', meals: ['lunch'], kind: 'veg', mins: 35,
    tags: ['elder', 'light'],
    sides: [['Rice'], ['Sutta appalam'], ['Beans poriyal', 'Carrot poriyal']] },

  { id: 'poricha-kuzhambu', name: 'Poricha kuzhambu', tamil: 'பொரிச்ச குழம்பு', meals: ['lunch'], kind: 'veg', mins: 35,
    tags: ['elder', 'light'],
    sides: [['Rice'], ['Rasam'], ['Appalam']] },

  { id: 'ennai-kathirikai', name: 'Ennai kathirikai kuzhambu', tamil: 'எண்ணெய் கத்தரிக்காய்', meals: ['lunch'], kind: 'veg', mins: 45,
    tags: [],
    sides: [['Rice'], ['Rasam'], ['Appalam']] },

  { id: 'sambar-sadam', name: 'Sambar sadam', tamil: 'சாம்பார் சாதம்', meals: ['lunch'], kind: 'veg', mins: 35,
    tags: ['kid', 'onepot'],
    sides: [['Potato fry', 'Vadam'], ['Appalam']] },

  { id: 'rasam-sadam', name: 'Rasam sadam', tamil: 'ரசம் சாதம்', meals: ['lunch', 'dinner'], kind: 'veg', mins: 25,
    tags: ['elder', 'light', 'onepot'],
    sides: [['Potato fry', 'Sutta appalam'], ['Pickle']] },

  { id: 'thayir-sadam', name: 'Curd rice', tamil: 'தயிர் சாதம்', meals: ['lunch', 'dinner'], kind: 'veg', mins: 20,
    tags: ['kid', 'elder', 'light', 'quick', 'onepot'],
    sides: [['Mango pickle', 'Vathal', 'Lemon pickle'], ['Appalam']] },

  { id: 'puliyodarai', name: 'Puliyodarai', tamil: 'புளியோதரை', meals: ['lunch'], kind: 'veg', mins: 30,
    tags: ['onepot'],
    sides: [['Curd rice'], ['Appalam']] },

  { id: 'lemon-rice', name: 'Lemon rice', tamil: 'எலுமிச்சை சாதம்', meals: ['lunch'], kind: 'veg', mins: 25,
    tags: ['quick', 'onepot'],
    sides: [['Curd'], ['Appalam']] },

  { id: 'coconut-rice', name: 'Coconut rice', tamil: 'தேங்காய் சாதம்', meals: ['lunch'], kind: 'veg', mins: 25,
    tags: ['onepot'],
    sides: [['Curd'], ['Appalam']] },

  { id: 'tomato-rice', name: 'Tomato rice', tamil: 'தக்காளி சாதம்', meals: ['lunch'], kind: 'veg', mins: 30,
    tags: ['kid', 'onepot'],
    sides: [['Onion raita'], ['Appalam']] },

  { id: 'veg-biryani', name: 'Vegetable biryani', tamil: 'காய்கறி பிரியாணி', meals: ['lunch'], kind: 'veg', mins: 45,
    tags: ['kid', 'weekend', 'special'],
    sides: [['Onion raita'], ['Brinjal gravy']] },

  { id: 'full-meals', name: 'Full meals', tamil: 'சாப்பாடு', meals: ['lunch'], kind: 'veg', mins: 60,
    tags: ['weekend', 'special'],
    sides: [['Rice'], ['Sambar'], ['Rasam'], ['Beans poriyal', 'Cabbage poriyal'], ['Kootu'], ['Curd'], ['Appalam']] },

  { id: 'chapati-lunch', name: 'Chapati', tamil: 'சப்பாத்தி', meals: ['lunch', 'dinner'], kind: 'veg', mins: 30,
    tags: ['light'],
    sides: [['Veg kurma', 'Channa masala', 'Dal fry', 'Paneer butter masala']] },

  /* ---------------- non-veg ---------------- */

  { id: 'chicken-biryani', name: 'Chicken biryani', tamil: 'சிக்கன் பிரியாணி', meals: ['lunch'], kind: 'nonveg', mins: 60,
    tags: ['kid', 'weekend', 'special'],
    sides: [['Onion raita'], ['Brinjal gravy'], ['Boiled egg']] },

  { id: 'mutton-biryani', name: 'Mutton biryani', tamil: 'மட்டன் பிரியாணி', meals: ['lunch'], kind: 'nonveg', mins: 75,
    tags: ['weekend', 'special', 'heavy'],
    sides: [['Onion raita'], ['Brinjal gravy']] },

  { id: 'meen-kuzhambu', name: 'Meen kuzhambu', tamil: 'மீன் குழம்பு', meals: ['lunch', 'dinner'], kind: 'nonveg', mins: 45,
    tags: [],
    sides: [['Rice'], ['Meen varuval', 'Nethili fry'], ['Rasam'], ['Cabbage poriyal']] },

  { id: 'chicken-kuzhambu', name: 'Chicken kuzhambu', tamil: 'சிக்கன் குழம்பு', meals: ['lunch', 'dinner'], kind: 'nonveg', mins: 45,
    tags: [],
    sides: [['Rice'], ['Rasam'], ['Appalam']] },

  { id: 'mutton-chukka', name: 'Mutton chukka', tamil: 'மட்டன் சுக்கா', meals: ['lunch'], kind: 'nonveg', mins: 60,
    tags: ['weekend', 'heavy'],
    sides: [['Rice'], ['Rasam'], ['Appalam']] },

  { id: 'egg-kuzhambu', name: 'Egg kuzhambu', tamil: 'முட்டை குழம்பு', meals: ['lunch', 'dinner'], kind: 'egg', mins: 30,
    tags: [],
    sides: [['Rice'], ['Beans poriyal'], ['Rasam']] },

  { id: 'prawn-thokku', name: 'Prawn thokku', tamil: 'இறால் தொக்கு', meals: ['lunch'], kind: 'nonveg', mins: 40,
    tags: [],
    sides: [['Rice'], ['Rasam'], ['Appalam']] },

  { id: 'chicken-65-parotta', name: 'Parotta with chicken salna', tamil: 'பரோட்டா சால்னா', meals: ['dinner'], kind: 'nonveg', mins: 40,
    tags: ['weekend', 'heavy', 'kid'],
    sides: [['Chicken salna'], ['Onion raita']] },

  { id: 'chicken-fried-rice', name: 'Chicken fried rice', tamil: 'சிக்கன் ஃப்ரைடு ரைஸ்', meals: ['dinner'], kind: 'nonveg', mins: 30,
    tags: ['kid'],
    sides: [['Chilli chicken', 'Sweet corn soup']] },

  /* ---------------- dinner ---------------- */

  { id: 'parotta', name: 'Parotta', tamil: 'பரோட்டா', meals: ['dinner'], kind: 'veg', mins: 35,
    tags: ['weekend', 'heavy', 'kid'],
    sides: [['Veg salna', 'Veg kurma']] },

  { id: 'kanji', name: 'Kanji', tamil: 'கஞ்சி', meals: ['dinner'], kind: 'veg', mins: 20,
    tags: ['elder', 'light', 'quick', 'onepot'],
    sides: [['Sutta appalam'], ['Pickle', 'Vathal']] },

  { id: 'veg-fried-rice', name: 'Veg fried rice', tamil: 'ஃப்ரைடு ரைஸ்', meals: ['dinner'], kind: 'veg', mins: 25,
    tags: ['kid'],
    sides: [['Gobi manchurian', 'Veg manchurian'], ['Sweet corn soup']] },

  { id: 'noodles', name: 'Veg noodles', tamil: 'நூடுல்ஸ்', meals: ['dinner'], kind: 'veg', mins: 25,
    tags: ['kid'],
    sides: [['Tomato ketchup'], ['Sweet corn soup']] },

  { id: 'pasta-red', name: 'Pasta in red sauce', tamil: 'பாஸ்தா', meals: ['dinner'], kind: 'veg', mins: 25,
    tags: ['kid'],
    sides: [['Garlic bread'], ['Sweet corn soup']] },

  { id: 'pasta-white', name: 'Pasta in white sauce', tamil: 'ஒயிட் சாஸ் பாஸ்தா', meals: ['dinner'], kind: 'veg', mins: 30,
    tags: ['kid'],
    sides: [['Garlic bread']] },

  { id: 'veg-cutlet', name: 'Veg cutlet', tamil: 'காய்கறி கட்லெட்', meals: ['dinner'], kind: 'veg', mins: 30,
    tags: ['kid'],
    sides: [['Tomato ketchup'], ['Bread']] }

];

/* Slots the planner fills, in order. */
var MEAL_ORDER = ['breakfast', 'lunch', 'dinner'];

var DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

var DAY_FULL = {
  Mon: 'Monday', Tue: 'Tuesday', Wed: 'Wednesday', Thu: 'Thursday',
  Fri: 'Friday', Sat: 'Saturday', Sun: 'Sunday'
};
