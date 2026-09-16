/* ------------------------------------------------------------------
   Step 1 placeholder data.
   Hardcoded so the UI shell can be reviewed before the dish database
   and the generator exist. js/data.js + js/planner.js replace this
   file in step 2; the shape below is the contract they must produce.
   ------------------------------------------------------------------ */

/* A slot:
     { dish, tamil, sides: [], mins, badges: [ 'nonveg' | 'kids' | 'light' | 'quick' ] }   */

const SAMPLE_DAY = {
  breakfast: {
    dish: 'Idli',
    tamil: 'இட்லி',
    sides: ['Sambar', 'Coconut chutney', 'Idli podi'],
    mins: 20,
    badges: ['quick']
  },
  lunch: {
    dish: 'Full meals',
    tamil: 'சாப்பாடு',
    sides: ['Rice', 'Vathal kuzhambu', 'Beans poriyal', 'Kootu', 'Rasam', 'Curd', 'Appalam'],
    mins: 45,
    badges: []
  },
  dinner: {
    dish: 'Chapati',
    tamil: 'சப்பாத்தி',
    sides: ['Veg kurma'],
    mins: 30,
    badges: ['light']
  }
};

const SAMPLE_WEEK = [
  {
    day: 'Mon',
    breakfast: { dish: 'Rava upma', tamil: 'ரவா உப்புமா', sides: ['Coconut chutney'], mins: 15, badges: ['quick'] },
    lunch:     { dish: 'Sambar sadam', tamil: 'சாம்பார் சாதம்', sides: ['Potato fry', 'Appalam'], mins: 35, badges: [] },
    dinner:    { dish: 'Dosai', tamil: 'தோசை', sides: ['Tomato chutney', 'Sambar'], mins: 25, badges: ['light'] }
  },
  {
    day: 'Tue',
    breakfast: { dish: 'Idli', tamil: 'இட்லி', sides: ['Sambar', 'Coconut chutney'], mins: 20, badges: ['quick'] },
    lunch:     { dish: 'Kara kuzhambu', tamil: 'கார குழம்பு', sides: ['Rice', 'Cabbage poriyal', 'Rasam', 'Curd'], mins: 40, badges: [] },
    dinner:    { dish: 'Chapati', tamil: 'சப்பாத்தி', sides: ['Channa masala'], mins: 30, badges: ['light'] }
  },
  {
    day: 'Wed',
    breakfast: { dish: 'Semiya upma', tamil: 'சேமியா உப்புமா', sides: ['Coconut chutney'], mins: 15, badges: ['quick'] },
    lunch:     { dish: 'Lemon rice', tamil: 'எலுமிச்சை சாதம்', sides: ['Curd', 'Appalam'], mins: 25, badges: ['quick'] },
    dinner:    { dish: 'Meen kuzhambu', tamil: 'மீன் குழம்பு', sides: ['Rice', 'Rasam', 'Cabbage poriyal'], mins: 40, badges: ['nonveg'] }
  },
  {
    day: 'Thu',
    breakfast: { dish: 'Ven pongal', tamil: 'வெண் பொங்கல்', sides: ['Medu vada', 'Sambar', 'Coconut chutney'], mins: 30, badges: [] },
    lunch:     { dish: 'More kuzhambu', tamil: 'மோர் குழம்பு', sides: ['Rice', 'Beans poriyal', 'Rasam', 'Appalam'], mins: 35, badges: [] },
    dinner:    { dish: 'Idiyappam', tamil: 'இடியாப்பம்', sides: ['Coconut milk'], mins: 25, badges: ['light'] }
  },
  {
    day: 'Fri',
    breakfast: { dish: 'Bread toast', tamil: 'பிரட் டோஸ்ட்', sides: ['Oats', 'Banana'], mins: 10, badges: ['quick', 'kids'] },
    lunch:     { dish: 'Puliyodarai', tamil: 'புளியோதரை', sides: ['Curd rice', 'Appalam'], mins: 30, badges: [] },
    dinner:    { dish: 'Kanji', tamil: 'கஞ்சி', sides: ['Sutta appalam', 'Pickle'], mins: 20, badges: ['light'] }
  },
  {
    day: 'Sat',
    breakfast: { dish: 'Poori', tamil: 'பூரி', sides: ['Potato masala'], mins: 30, badges: [] },
    lunch:     { dish: 'Thayir sadam', tamil: 'தயிர் சாதம்', sides: ['Vathal', 'Pickle', 'Appalam'], mins: 20, badges: ['quick', 'light'] },
    dinner:    { dish: 'Pasta in red sauce', tamil: 'பாஸ்தா', sides: ['Garlic bread'], mins: 25, badges: ['kids'] }
  },
  {
    day: 'Sun',
    breakfast: { dish: 'Masala dosai', tamil: 'மசாலா தோசை', sides: ['Sambar', 'Coconut chutney'], mins: 30, badges: [] },
    lunch:     { dish: 'Chicken biryani', tamil: 'சிக்கன் பிரியாணி', sides: ['Onion raita', 'Brinjal gravy', 'Boiled egg'], mins: 60, badges: ['nonveg'] },
    dinner:    { dish: 'Adai', tamil: 'அடை', sides: ['Avial', 'Jaggery'], mins: 35, badges: ['light'] }
  }
];
