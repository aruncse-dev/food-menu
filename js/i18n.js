/* ==================================================================
   Language.

   Two things need translating and they live in different places.

   Food words — dish names, side categories, what counts as protein —
   are content, so they carry their own `tamil` alongside `name` in
   js/data.js and are read through I18N.name(). Interface words are
   here, keyed, with one object per language.

   Adding a language is therefore a translation job and not a code
   job: copy the `en` block, translate the values, add a row to LANGS.
   The five listed below are the ones this app is meant to grow into.
   Only the ones marked ready can be chosen; the rest are shown so the
   house can see what is coming rather than wonder.
   ================================================================== */

var I18N = (function () {
  'use strict';

  var LANGS = [
    { id: 'en', native: 'English',   english: 'English',   ready: true },
    { id: 'ta', native: 'தமிழ்',      english: 'Tamil',     ready: true },
    { id: 'hi', native: 'हिन्दी',      english: 'Hindi',     ready: false },
    { id: 'te', native: 'తెలుగు',     english: 'Telugu',    ready: false },
    { id: 'kn', native: 'ಕನ್ನಡ',      english: 'Kannada',   ready: false },
    { id: 'ml', native: 'മലയാളം',    english: 'Malayalam', ready: false }
  ];

  var EN = {
    'app.boot': 'Opening your menu…',

    'nav.today': 'Today',
    'nav.week': 'Week',
    'nav.foods': 'Foods',
    'nav.settings': 'Settings',

    'meal.breakfast': 'Breakfast',
    'meal.lunch': 'Lunch',
    'meal.dinner': 'Dinner',
    'meal.breakfast.short': 'B',
    'meal.lunch.short': 'L',
    'meal.dinner.short': 'D',

    'day.Mon': 'Monday',
    'day.Tue': 'Tuesday',
    'day.Wed': 'Wednesday',
    'day.Thu': 'Thursday',
    'day.Fri': 'Friday',
    'day.Sat': 'Saturday',
    'day.Sun': 'Sunday',
    'day.Mon.short': 'Mon',
    'day.Tue.short': 'Tue',
    'day.Wed.short': 'Wed',
    'day.Thu.short': 'Thu',
    'day.Fri.short': 'Fri',
    'day.Sat.short': 'Sat',
    'day.Sun.short': 'Sun',

    'health.low-oil': 'Low oil',
    'health.millet': 'Millet',
    'health.protein': 'Protein',
    'health.no-fry': 'No fry',
    'health.fibre': 'Fibre',

    'units.min': '{n} min',
    'units.minShort': '{n}m',
    'units.minsLong': 'Roughly how long',

    /* ---- first run ---- */
    'setup.lang.eyebrow': 'Before anything else',
    'setup.lang.title': 'Which language?',
    'setup.lang.hint': 'You can change this any time in Settings.',
    'setup.lang.soon': 'Soon',
    'setup.step1.eyebrow': 'One quick thing',
    'setup.step1.title': 'What does your house eat?',
    'setup.step1.hint': 'Vegetarian food is always cooked either way. ' +
                        'This just decides what gets added beside it.',
    'setup.veg': 'Pure vegetarian',
    'setup.veg.sub': 'No egg, no meat',
    'setup.egg': 'Vegetarian and egg',
    'setup.egg.sub': 'Egg, but no meat',
    'setup.nonveg': 'We eat non-veg too',
    'setup.nonveg.sub': 'Chicken, fish, mutton',
    'setup.step2.eyebrow': 'Last one',
    'setup.step2.title': 'How often?',
    'setup.step2.hint': 'A rough starting point. You can set exact days later.',
    'setup.eggDaily': 'Egg with lunch, every day',
    'setup.eggDaily.sub': 'Some houses make this compulsory for the children.',
    'setup.skip': 'Skip, just show me a plan',
    'setup.cancel': 'Cancel',
    'setup.eggHow': 'How often is egg on the table?',
    'setup.nonvegHow': 'How often is non-veg on the table?',
    'setup.egg.week': 'One egg dish a week',
    'setup.egg.twice': 'Twice a week',
    'setup.egg.weekday': 'Egg at lunch on working days',
    'setup.nv.sunday': 'Only on Sundays',
    'setup.nv.two': 'Just a couple of days',
    'setup.nv.most': 'Something non-veg four or five times',

    /* ---- today ---- */
    'today.morning': 'Good morning',
    'today.afternoon': 'Good afternoon',
    'today.evening': 'Good evening',
    'today.title': 'Today',
    'today.tomorrow': 'Tomorrow',
    'today.planned': 'Planned',
    'today.earlier': 'Earlier today',
    'today.later': 'Later today',
    'today.next': 'Up next · {meal}',
    'today.served': 'Served at',
    'today.empty': 'Nothing to cook',
    'today.allKept': 'Every meal today is kept',
    'today.share': 'Share this day',
    'today.reroll': 'New ideas for this day',
    'today.pickDay': 'Pick a day',
    'today.menu': "Today's menu",

    /* ---- week ---- */
    'week.eyebrow': 'Twenty-one meals',
    'week.title': 'This week',
    'week.hint': 'Padlock keeps a meal',
    'week.share': 'Share the week',
    'week.reroll': 'New plan',
    'week.menu': 'Menu for the week',

    /* ---- foods ---- */
    'foods.eyebrow': 'Your food list',
    'foods.title': 'Foods',
    'foods.hint': 'Tick what your house eats. Anything unticked is never planned.',
    'foods.list': 'Food list',
    'foods.sides': 'Sides',
    'foods.protein': 'Protein',
    'foods.all': 'All',
    'foods.none': 'None',
    'foods.add': 'Add',
    'foods.search': 'Search dishes',
    'foods.sections': 'Sections',
    'foods.count': '{on} of {total} ticked',
    'foods.noMatch': 'Nothing matches "{q}"',
    'foods.addDish': 'Add a dish',
    'foods.addSide': 'Add a side',
    'foods.addProtein': 'Add a protein dish',
    'foods.name': 'Name',
    'foods.namePlaceholder': 'e.g. Kothu parotta',
    'foods.sidePlaceholder': 'e.g. Murungakkai poriyal',
    'foods.goesWith': 'Goes with',
    'foods.type': 'Type',
    'foods.allThree': 'All three meals',
    'foods.addToList': 'Add to my list',
    'foods.nameFirst': 'Give it a name first',
    'foods.added': '{name} added',
    'foods.removed': '{name} removed',
    'foods.joins': 'It joins the rotation straight away.',
    'foods.offered': 'It will be offered on the days your protein timetable asks for this type.',
    'foods.nothingTicked': 'Nothing ticked',
    'foods.nothingTickedFor': 'Nothing ticked for {meal} — the plan will leave it empty.',
    'foods.noneTicked': 'none ticked',
    'foods.delete': 'Delete {name}',

    /* ---- settings ---- */
    'settings.eyebrow': 'How your house eats',
    'settings.title': 'Settings',
    'settings.hint': 'Everything here rebuilds the plan straight away.',
    'settings.households': 'Households',
    'settings.addHouse': 'Add a house',
    'house.default': 'Home',
    'house.name': 'House name',
    'house.placeholder': 'e.g. Chennai house',
    'house.add': 'Add this house',
    'house.rename': 'Rename',
    'house.remove': 'Remove',
    'house.removeConfirm': 'Remove {name}, and everything planned for it?',
    'house.switched': 'Now showing {name}',
    'house.added': '{name} added',
    'house.removed': '{name} removed',
    'house.nameFirst': 'Give the house a name first',
    'house.edit': 'Edit {name}',
    'settings.language': 'Language',
    'settings.languageHint': 'Dish names and the whole interface.',
    'settings.protein': 'Protein timetable',
    'settings.proteinHint': 'Tap any meal to say what protein goes <strong>beside</strong> it. ' +
                            'The vegetarian food is always cooked — this only adds a dish for ' +
                            'whoever eats it.',
    'settings.rerunSetup': 'Not sure? Answer two questions',
    'settings.allVeg': 'All veg',
    'settings.eggLunch': 'Egg every lunch',
    'settings.nvWeekend': 'Non-veg weekends',
    'settings.style': 'Cooking style',
    'settings.lean': 'Health conscious',
    'settings.leanHint': 'Leans the plan towards millets, low-oil and steamed dishes. ' +
                         'Nothing is banned — dosai still turns up.',
    'settings.light': 'Light dinners',
    'settings.lightHint': 'Soft, low-oil food at night. Nothing heavy or deep-fried after dark.',
    'settings.quick': 'Quick weekday breakfasts',
    'settings.quickHint': 'Nothing over 20 minutes Monday to Friday.',
    'settings.data': 'Data',
    'settings.where': 'Where this is kept',
    'settings.checking': 'Checking…',
    'settings.backup': 'Backup',
    'settings.backupHint': 'Saves the whole database as one file. ' +
                           'The only copy that outlives this browser.',
    'settings.save': 'Save',
    'settings.restore': 'Restore',
    'settings.startOver': 'Start over',
    'settings.startOverHint': 'Erases the plan, your food list and your own dishes ' +
                              'from this browser.',
    'settings.reset': 'Reset',
    'settings.footnote': 'Everything lives in this browser. No account, no server, ' +
                         'nothing leaves your device.',

    /* ---- storage wording ---- */
    'storage.sqlite': 'SQLite database in this browser',
    'storage.local': 'This browser’s local storage',
    'storage.tab': 'This tab only',
    'storage.permanent': 'Permanent',
    'storage.saved': 'Saved',
    'storage.notePermanent': 'Marked permanent, so Chrome will not clear it to free up space. ' +
                             'It survives closing the browser and restarting the phone.',
    'storage.noteSaved': 'Saved, but not marked permanent — Chrome may clear it if the device ' +
                         'runs very low on space. A private window always clears it when the ' +
                         'last one closes.',
    'storage.noteNone': 'Nothing is being saved. This browser will not let the app store ' +
                        'anything, so the plan lasts until you close the tab. Back it up if ' +
                        'you want to keep it.',

    /* ---- sheets and actions ---- */
    'action.change': 'Change',
    'action.keepShort': 'Keep',
    'action.kept': 'Kept',
    'action.changeMeal': 'Change this meal',
    'action.keep': 'Keep this meal',
    'action.share': 'Share',
    'action.print': 'Print',
    'action.copyText': 'Copy as text',

    /* ---- toasts ---- */
    'toast.newPlan': 'New plan',
    'toast.newPlanKept': 'New plan — kept meals stay',
    'toast.locked': 'That meal is kept — unlock it first',
    'toast.reset': 'Back to defaults',
    'toast.lean': 'Leaning healthier',
    'toast.everyday': 'Everyday cooking',
    'toast.protein': 'Protein timetable updated',
    'toast.copied': 'Menu copied',
    'toast.imageSaved': 'Image saved',
    'toast.backupSaved': 'Backup saved',
    'toast.backupRestored': 'Backup restored',
    'toast.notBackup': 'That is not a backup from this app',
    'toast.unreadable': 'Could not read that file',
    'toast.backupFailed': 'Could not make a backup',
    'toast.copyFailed': 'Could not copy automatically',
    'toast.imageFailed': 'Could not save the image',
    'toast.shareFailed': 'Could not open the share sheet',
    'toast.shareUnsupported': 'Sharing needs a phone browser — save the image instead',
    'toast.langChanged': 'Language changed',

    'confirm.reset': 'Erase the plan, your food list and your own dishes?',
    'export.brand': "WHAT'S COOKING",
    'export.weekday': 'weekday',
    'export.weekend': 'weekend',
    'export.footer': 'Planned at home · one less thing to argue about'
  };

  var TA = {
    'app.boot': 'உங்கள் மெனு திறக்கிறது…',

    'nav.today': 'இன்று',
    'nav.week': 'வாரம்',
    'nav.foods': 'உணவுகள்',
    'nav.settings': 'அமைப்புகள்',

    'meal.breakfast': 'காலை உணவு',
    'meal.lunch': 'மதிய உணவு',
    'meal.dinner': 'இரவு உணவு',
    'meal.breakfast.short': 'கா',
    'meal.lunch.short': 'ம',
    'meal.dinner.short': 'இ',

    'day.Mon': 'திங்கள்',
    'day.Tue': 'செவ்வாய்',
    'day.Wed': 'புதன்',
    'day.Thu': 'வியாழன்',
    'day.Fri': 'வெள்ளி',
    'day.Sat': 'சனி',
    'day.Sun': 'ஞாயிறு',
    'day.Mon.short': 'திங்',
    'day.Tue.short': 'செவ்',
    'day.Wed.short': 'புத',
    'day.Thu.short': 'வியா',
    'day.Fri.short': 'வெள்',
    'day.Sat.short': 'சனி',
    'day.Sun.short': 'ஞாயி',

    'health.low-oil': 'குறைந்த எண்ணெய்',
    'health.millet': 'சிறுதானியம்',
    'health.protein': 'புரதம்',
    'health.no-fry': 'பொரிக்காதது',
    'health.fibre': 'நார்ச்சத்து',

    'units.min': '{n} நிமிடம்',
    'units.minShort': '{n}நி',
    'units.minsLong': 'எவ்வளவு நேரம்',

    'setup.lang.eyebrow': 'எல்லாவற்றிற்கும் முன்',
    'setup.lang.title': 'எந்த மொழி?',
    'setup.lang.hint': 'இதை எப்போது வேண்டுமானாலும் அமைப்புகளில் மாற்றலாம்.',
    'setup.lang.soon': 'விரைவில்',
    'setup.step1.eyebrow': 'ஒரு சிறிய கேள்வி',
    'setup.step1.title': 'உங்கள் வீட்டில் என்ன சாப்பிடுவீர்கள்?',
    'setup.step1.hint': 'சைவ உணவு எப்படியும் சமைக்கப்படும். ' +
                        'இது அதனுடன் என்ன சேர்க்க வேண்டும் என்பதை மட்டுமே முடிவு செய்கிறது.',
    'setup.veg': 'முழு சைவம்',
    'setup.veg.sub': 'முட்டை இல்லை, இறைச்சி இல்லை',
    'setup.egg': 'சைவமும் முட்டையும்',
    'setup.egg.sub': 'முட்டை உண்டு, இறைச்சி இல்லை',
    'setup.nonveg': 'அசைவமும் சாப்பிடுவோம்',
    'setup.nonveg.sub': 'சிக்கன், மீன், மட்டன்',
    'setup.step2.eyebrow': 'கடைசி கேள்வி',
    'setup.step2.title': 'எத்தனை முறை?',
    'setup.step2.hint': 'இது ஒரு தொடக்கப் புள்ளி. சரியான நாட்களை பிறகு அமைக்கலாம்.',
    'setup.eggDaily': 'தினமும் மதிய உணவுடன் முட்டை',
    'setup.eggDaily.sub': 'சில வீடுகளில் குழந்தைகளுக்கு இது கட்டாயம்.',
    'setup.skip': 'விட்டுவிடு, திட்டத்தைக் காட்டு',
    'setup.cancel': 'ரத்து',
    'setup.eggHow': 'முட்டை எத்தனை முறை?',
    'setup.nonvegHow': 'அசைவம் எத்தனை முறை?',
    'setup.egg.week': 'வாரத்திற்கு ஒரு முட்டை உணவு',
    'setup.egg.twice': 'வாரத்திற்கு இரண்டு முறை',
    'setup.egg.weekday': 'வேலை நாட்களில் மதிய உணவுடன் முட்டை',
    'setup.nv.sunday': 'ஞாயிறு மட்டும்',
    'setup.nv.two': 'வாரத்திற்கு இரண்டு நாட்கள்',
    'setup.nv.most': 'வாரத்திற்கு நான்கு அல்லது ஐந்து முறை',

    'today.morning': 'காலை வணக்கம்',
    'today.afternoon': 'மதிய வணக்கம்',
    'today.evening': 'மாலை வணக்கம்',
    'today.title': 'இன்று',
    'today.tomorrow': 'நாளை',
    'today.planned': 'திட்டமிட்டது',
    'today.earlier': 'இன்று முன்பு',
    'today.later': 'இன்று பிறகு',
    'today.next': 'அடுத்தது · {meal}',
    'today.served': 'நேரம்',
    'today.empty': 'சமைக்க எதுவும் இல்லை',
    'today.allKept': 'இன்றைய எல்லா உணவும் வைக்கப்பட்டுள்ளது',
    'today.share': 'இந்த நாளைப் பகிர்',
    'today.reroll': 'இந்த நாளுக்கு புதிய யோசனைகள்',
    'today.pickDay': 'ஒரு நாளைத் தேர்ந்தெடு',
    'today.menu': 'இன்றைய மெனு',

    'week.eyebrow': 'இருபத்தி ஒரு உணவுகள்',
    'week.title': 'இந்த வாரம்',
    'week.hint': 'பூட்டு ஒரு உணவைத் தக்கவைக்கும்',
    'week.share': 'வாரத்தைப் பகிர்',
    'week.reroll': 'புதிய திட்டம்',
    'week.menu': 'வாரத்திற்கான மெனு',

    'foods.eyebrow': 'உங்கள் உணவுப் பட்டியல்',
    'foods.title': 'உணவுகள்',
    'foods.hint': 'உங்கள் வீட்டில் சாப்பிடுவதைத் தேர்ந்தெடுங்கள். ' +
                  'தேர்ந்தெடுக்காதது ஒருபோதும் திட்டமிடப்படாது.',
    'foods.list': 'உணவுப் பட்டியல்',
    'foods.sides': 'சைடுகள்',
    'foods.protein': 'புரதம்',
    'foods.all': 'அனைத்தும்',
    'foods.none': 'எதுவும்',
    'foods.add': 'சேர்',
    'foods.search': 'உணவுகளைத் தேடு',
    'foods.sections': 'பிரிவுகள்',
    'foods.count': '{total}-ல் {on} தேர்ந்தெடுக்கப்பட்டது',
    'foods.noMatch': '"{q}" பொருந்தவில்லை',
    'foods.addDish': 'ஒரு உணவைச் சேர்',
    'foods.addSide': 'ஒரு சைடைச் சேர்',
    'foods.addProtein': 'ஒரு புரத உணவைச் சேர்',
    'foods.name': 'பெயர்',
    'foods.namePlaceholder': 'எ.கா. கொத்து பரோட்டா',
    'foods.sidePlaceholder': 'எ.கா. முருங்கைக்காய் பொரியல்',
    'foods.goesWith': 'எதனுடன் சேரும்',
    'foods.type': 'வகை',
    'foods.allThree': 'மூன்று வேளையும்',
    'foods.addToList': 'என் பட்டியலில் சேர்',
    'foods.nameFirst': 'முதலில் ஒரு பெயர் கொடுங்கள்',
    'foods.added': '{name} சேர்க்கப்பட்டது',
    'foods.removed': '{name} நீக்கப்பட்டது',
    'foods.joins': 'இது உடனே சுழற்சியில் சேர்ந்துவிடும்.',
    'foods.offered': 'உங்கள் புரத அட்டவணை இந்த வகையைக் கேட்கும் நாட்களில் இது வரும்.',
    'foods.nothingTicked': 'எதுவும் தேர்ந்தெடுக்கப்படவில்லை',
    'foods.nothingTickedFor': '{meal}-க்கு எதுவும் தேர்ந்தெடுக்கப்படவில்லை — ' +
                              'அந்த வேளை காலியாக இருக்கும்.',
    'foods.noneTicked': 'எதுவும் இல்லை',
    'foods.delete': '{name} நீக்கு',

    'settings.eyebrow': 'உங்கள் வீட்டு உணவு முறை',
    'settings.title': 'அமைப்புகள்',
    'settings.hint': 'இங்கு மாற்றினால் திட்டம் உடனே மீண்டும் உருவாகும்.',
    'settings.households': 'வீடுகள்',
    'settings.addHouse': 'ஒரு வீட்டைச் சேர்',
    'house.default': 'வீடு',
    'house.name': 'வீட்டின் பெயர்',
    'house.placeholder': 'எ.கா. சென்னை வீடு',
    'house.add': 'இந்த வீட்டைச் சேர்',
    'house.rename': 'பெயர் மாற்று',
    'house.remove': 'நீக்கு',
    'house.removeConfirm': '{name} மற்றும் அதற்குத் திட்டமிட்ட அனைத்தையும் நீக்கவா?',
    'house.switched': 'இப்போது {name}',
    'house.added': '{name} சேர்க்கப்பட்டது',
    'house.removed': '{name} நீக்கப்பட்டது',
    'house.nameFirst': 'முதலில் வீட்டிற்கு ஒரு பெயர் கொடுங்கள்',
    'house.edit': '{name} திருத்து',
    'settings.language': 'மொழி',
    'settings.languageHint': 'உணவுப் பெயர்களும் முழு இடைமுகமும்.',
    'settings.protein': 'புரத அட்டவணை',
    'settings.proteinHint': 'எந்த புரதம் <strong>உடன்</strong> வர வேண்டும் என்பதைச் சொல்ல ' +
                            'ஒரு வேளையைத் தொடுங்கள். சைவ உணவு எப்படியும் சமைக்கப்படும் — ' +
                            'இது சாப்பிடுபவர்களுக்கு ஒரு உணவை மட்டுமே சேர்க்கிறது.',
    'settings.rerunSetup': 'தெரியவில்லையா? இரண்டு கேள்விகள்',
    'settings.allVeg': 'முழு சைவம்',
    'settings.eggLunch': 'தினமும் முட்டை',
    'settings.nvWeekend': 'வார இறுதியில் அசைவம்',
    'settings.style': 'சமையல் முறை',
    'settings.lean': 'உடல்நலம் கருதி',
    'settings.leanHint': 'சிறுதானியம், குறைந்த எண்ணெய், ஆவியில் வேகவைத்த உணவுகளை நோக்கிச் ' +
                         'சாய்கிறது. எதுவும் தடை இல்லை — தோசை இன்னும் வரும்.',
    'settings.light': 'இலகுவான இரவு உணவு',
    'settings.lightHint': 'இரவில் மென்மையான, குறைந்த எண்ணெய் உணவு. ' +
                          'கனமானது அல்லது பொரித்தது இல்லை.',
    'settings.quick': 'வேலை நாட்களில் விரைவான காலை உணவு',
    'settings.quickHint': 'திங்கள் முதல் வெள்ளி வரை 20 நிமிடத்திற்கு மேல் இல்லை.',
    'settings.data': 'தரவு',
    'settings.where': 'இது எங்கே சேமிக்கப்படுகிறது',
    'settings.checking': 'சரிபார்க்கிறது…',
    'settings.backup': 'காப்புப்பிரதி',
    'settings.backupHint': 'முழு தரவுத்தளத்தையும் ஒரே கோப்பாகச் சேமிக்கும். ' +
                           'இந்த உலாவியைத் தாண்டி நிலைக்கும் ஒரே நகல் இதுதான்.',
    'settings.save': 'சேமி',
    'settings.restore': 'மீட்டெடு',
    'settings.startOver': 'மீண்டும் தொடங்கு',
    'settings.startOverHint': 'திட்டம், உணவுப் பட்டியல், நீங்கள் சேர்த்த உணவுகள் ' +
                              'அனைத்தையும் இந்த உலாவியிலிருந்து அழிக்கும்.',
    'settings.reset': 'மீட்டமை',
    'settings.footnote': 'எல்லாம் இந்த உலாவியில் மட்டுமே. கணக்கு இல்லை, சர்வர் இல்லை, ' +
                         'உங்கள் சாதனத்தை விட்டு எதுவும் வெளியே செல்லாது.',

    'storage.sqlite': 'இந்த உலாவியில் SQLite தரவுத்தளம்',
    'storage.local': 'இந்த உலாவியின் லோக்கல் ஸ்டோரேஜ்',
    'storage.tab': 'இந்த தாவல் மட்டும்',
    'storage.permanent': 'நிரந்தரம்',
    'storage.saved': 'சேமிக்கப்பட்டது',
    'storage.notePermanent': 'நிரந்தரமாகக் குறிக்கப்பட்டுள்ளது, எனவே இடம் காலி செய்ய Chrome ' +
                             'இதை அழிக்காது. உலாவியை மூடினாலும், போனை மறுதொடக்கம் ' +
                             'செய்தாலும் இது இருக்கும்.',
    'storage.noteSaved': 'சேமிக்கப்பட்டது, ஆனால் நிரந்தரமாகக் குறிக்கப்படவில்லை — சாதனத்தில் ' +
                         'இடம் மிகக் குறைவாக இருந்தால் Chrome இதை அழிக்கலாம். ' +
                         'தனிப்பட்ட சாளரம் (private window) கடைசி சாளரம் மூடும்போது ' +
                         'எப்போதும் இதை அழித்துவிடும்.',
    'storage.noteNone': 'எதுவும் சேமிக்கப்படவில்லை. இந்த உலாவி எதையும் சேமிக்க அனுமதிக்கவில்லை, ' +
                        'எனவே தாவலை மூடும் வரை மட்டுமே திட்டம் இருக்கும். ' +
                        'வைத்திருக்க விரும்பினால் காப்புப்பிரதி எடுங்கள்.',

    'action.change': 'மாற்று',
    'action.keepShort': 'வைத்திரு',
    'action.kept': 'வைத்தாச்சு',
    'action.changeMeal': 'இந்த வேளையை மாற்று',
    'action.keep': 'இந்த வேளையை வைத்திரு',
    'action.share': 'பகிர்',
    'action.print': 'அச்சிடு',
    'action.copyText': 'உரையாக நகலெடு',

    'toast.newPlan': 'புதிய திட்டம்',
    'toast.newPlanKept': 'புதிய திட்டம் — வைத்தவை அப்படியே',
    'toast.locked': 'அந்த வேளை வைக்கப்பட்டுள்ளது — முதலில் பூட்டைத் திறங்கள்',
    'toast.reset': 'இயல்பு நிலைக்குத் திரும்பியது',
    'toast.lean': 'உடல்நலம் நோக்கி',
    'toast.everyday': 'வழக்கமான சமையல்',
    'toast.protein': 'புரத அட்டவணை புதுப்பிக்கப்பட்டது',
    'toast.copied': 'மெனு நகலெடுக்கப்பட்டது',
    'toast.imageSaved': 'படம் சேமிக்கப்பட்டது',
    'toast.backupSaved': 'காப்புப்பிரதி சேமிக்கப்பட்டது',
    'toast.backupRestored': 'காப்புப்பிரதி மீட்டெடுக்கப்பட்டது',
    'toast.notBackup': 'இது இந்த ஆப்பின் காப்புப்பிரதி இல்லை',
    'toast.unreadable': 'அந்தக் கோப்பைப் படிக்க முடியவில்லை',
    'toast.backupFailed': 'காப்புப்பிரதி எடுக்க முடியவில்லை',
    'toast.copyFailed': 'தானாக நகலெடுக்க முடியவில்லை',
    'toast.imageFailed': 'படத்தைச் சேமிக்க முடியவில்லை',
    'toast.shareFailed': 'பகிர்வுத் திரையைத் திறக்க முடியவில்லை',
    'toast.shareUnsupported': 'பகிர போன் உலாவி தேவை — படமாகச் சேமியுங்கள்',
    'toast.langChanged': 'மொழி மாற்றப்பட்டது',

    'confirm.reset': 'திட்டம், உணவுப் பட்டியல், நீங்கள் சேர்த்த உணவுகள் அனைத்தையும் அழிக்கவா?',
    'export.brand': 'இன்று என்ன சமையல்',
    'export.weekday': 'வேலை நாள்',
    'export.weekend': 'வார இறுதி',
    'export.footer': 'வீட்டில் திட்டமிட்டது · வாதிட ஒரு விஷயம் குறைவு'
  };

  var STRINGS = { en: EN, ta: TA };

  /* Dates are formatted by the browser, which needs a BCP 47 tag
     rather than our own two-letter id. */
  var LOCALE = { en: 'en-GB', ta: 'ta-IN' };

  var lang = 'en';

  /* A missing key falls back to English rather than showing the key,
     so a half-finished language is shabby rather than broken. */
  function t(key, vars) {
    var table = STRINGS[lang] || EN;
    var text = table[key];
    if (text === undefined) { text = EN[key]; }
    if (text === undefined) { return key; }
    if (!vars) { return text; }
    return text.replace(/\{(\w+)\}/g, function (whole, slot) {
      return vars[slot] === undefined ? whole : vars[slot];
    });
  }

  /* Food records carry their own translation. */
  function name(record) {
    if (!record) { return ''; }
    if (lang === 'ta' && record.tamil) { return record.tamil; }
    return record.name || '';
  }

  function shortName(record) {
    if (!record) { return ''; }
    if (lang === 'ta' && record.tamilShort) { return record.tamilShort; }
    return record.short || record.name || '';
  }

  /* A plan slot stores the name that was current when it was
     generated, so switching language would leave last week's plan
     written in the old one. Resolving by id at render time fixes that
     without regenerating anything. The stored name is the fallback,
     for a dish that has since been deleted. */
  function dish(kind, id, fallback) {
    var record = (typeof Library !== 'undefined' && id) ? Library.find(kind, id) : null;
    return record ? name(record) : (fallback || '');
  }

  function sideNames(list) {
    return (list || []).map(function (s) { return dish('side', s.id, s.name); });
  }

  function addonName(record) {
    if (!record) { return ''; }
    return record.id ? dish('addon', record.id, record.name) : name(record);
  }

  function mealName(meal) { return t('meal.' + meal); }
  function mealShort(meal) { return t('meal.' + meal + '.short'); }
  function dayName(day) { return t('day.' + day); }
  function dayShort(day) { return t('day.' + day + '.short'); }
  function healthName(tag) { return t('health.' + tag); }
  function minutes(n) { return t('units.min', { n: n }); }

  function langs() { return LANGS.slice(); }

  function isReady(id) {
    for (var i = 0; i < LANGS.length; i++) {
      if (LANGS[i].id === id) { return !!LANGS[i].ready; }
    }
    return false;
  }

  function get() { return lang; }

  function locale() { return LOCALE[lang] || 'en-GB'; }

  function set(id) {
    if (!isReady(id)) { return false; }
    lang = id;
    document.documentElement.setAttribute('lang', id);
    return true;
  }

  /* Walks the static markup. Dynamic screens re-render through t()
     instead, so this only has to cover what index.html ships. */
  function apply(root) {
    var scope = root || document;

    Array.prototype.forEach.call(scope.querySelectorAll('[data-i18n]'), function (node) {
      node.textContent = t(node.getAttribute('data-i18n'));
    });

    /* innerHTML only ever receives strings from the catalogues above —
       our own source, never anything a household typed. */
    Array.prototype.forEach.call(scope.querySelectorAll('[data-i18n-html]'), function (node) {
      node.innerHTML = t(node.getAttribute('data-i18n-html'));
    });

    [['data-i18n-placeholder', 'placeholder'],
     ['data-i18n-title', 'title'],
     ['data-i18n-aria', 'aria-label']].forEach(function (pair) {
      Array.prototype.forEach.call(scope.querySelectorAll('[' + pair[0] + ']'), function (node) {
        node.setAttribute(pair[1], t(node.getAttribute(pair[0])));
      });
    });
  }

  return {
    t: t, name: name, shortName: shortName,
    dish: dish, sideNames: sideNames, addonName: addonName,
    mealName: mealName, mealShort: mealShort,
    dayName: dayName, dayShort: dayShort,
    healthName: healthName, minutes: minutes,
    langs: langs, isReady: isReady, get: get, set: set, apply: apply, locale: locale
  };
})();
