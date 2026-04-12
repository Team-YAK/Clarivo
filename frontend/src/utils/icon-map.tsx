/**
 * icon-map.ts — Single Source of Truth
 *
 * Maps every tree concept key to a Phosphor icon component name.
 * Every tree node in the decision tree pulls its icon from here.
 * Use weight="regular" and size={36} when rendering.
 *
 * The getIconComponent() helper does a dynamic lookup from @phosphor-icons/react.
 */

import React from "react";
import * as PhosphorIcons from "@phosphor-icons/react";

// ─────────────────────────────────────────────────────────────
// Comprehensive concept → Phosphor icon name mapping
// ─────────────────────────────────────────────────────────────
export const ICON_MAP: Record<string, string> = {
  // ══════════════════════════════════════════════════════════
  // ROOT CATEGORIES
  // ══════════════════════════════════════════════════════════
  physical: "PersonArmsSpread",
  emotional: "Smiley",
  environment: "House",
  food: "ForkKnife",
  drink: "Drop",
  sleep: "Moon",
  social: "Users",
  watch: "MonitorPlay",
  toilet: "Toilet",
  medical: "FirstAidKit",
  activities: "GameController",
  time: "Clock",
  weather: "CloudSun",
  objects: "Cube",
  places: "MapPin",
  people: "UserCircle",
  communication: "ChatCircle",
  transportation: "Car",
  education: "GraduationCap",
  music: "MusicNote",
  clothing: "TShirt",
  hygiene: "Shower",

  // ══════════════════════════════════════════════════════════
  // PHYSICAL NEEDS
  // ══════════════════════════════════════════════════════════
  pain: "Warning",
  hot: "Thermometer",
  cold: "Snowflake",
  itch: "HandPalm",
  dizzy: "CircleNotch",
  nausea: "SmileyXEyes",
  numbness: "HandFist",
  cramp: "Lightning",
  swelling: "ArrowsOut",
  bleeding: "Drop",
  breathing: "Wind",
  choking: "Prohibit",
  cough: "SpeakerX",
  sneeze: "Confetti",
  shivering: "Snowflake",
  sweating: "ThermometerHot",
  weakness: "BatteryLow",
  fatigue: "BatteryWarning",
  stiffness: "Barbell",

  // ── Pain subtypes ──
  headache: "Brain",
  stomach: "Bandaids",
  backpain: "Person",
  chestpain: "Heartbeat",
  joints: "Bone",
  teeth: "Tooth",
  earache: "Ear",
  eyepain: "Eye",
  throatpain: "Microphone",
  neck: "ArrowsVertical",
  shoulder: "ArrowBendUpRight",
  knee: "ArrowBendDownRight",
  foot: "SneakerMove",
  hand: "Hand",
  muscle: "Barbell",
  migraine: "Lightning",

  // ══════════════════════════════════════════════════════════
  // EMOTIONS / FEELINGS
  // ══════════════════════════════════════════════════════════
  happy: "SmileyWink",
  sad: "SmileySad",
  angry: "SmileyAngry",
  anxious: "HeartBreak",
  tired: "BatteryLow",
  scared: "Ghost",
  confused: "Question",
  excited: "RocketLaunch",
  bored: "Clock",
  lonely: "UserMinus",
  frustrated: "XCircle",
  grateful: "HandsPraying",
  hopeful: "Sparkle",
  calm: "Leaf",
  nervous: "Pulse",
  overwhelmed: "Waves",
  proud: "Trophy",
  embarrassed: "EyeSlash",
  jealous: "Eye",
  love: "Heart",
  nostalgic: "Rewind",
  peaceful: "Flower",
  surprised: "Smiley",
  worried: "WarningCircle",
  content: "SmileyMeh",
  depressed: "CloudRain",
  hurt: "HeartBreak",
  irritated: "BugBeetle",
  relieved: "CheckCircle",
  stressed: "Lightning",
  uncomfortable: "ThumbsDown",

  // ── Happy subtypes ──
  joyful: "Confetti",
  laughing: "SmileyWink",
  cheerful: "Sun",
  playful: "GameController",
  elated: "Star",
  blissful: "Sparkle",

  // ── Sad subtypes ──
  crying: "Drop",
  grieving: "Heart",
  melancholy: "CloudRain",
  heartbroken: "HeartBreak",
  disappointed: "ThumbsDown",
  gloomy: "Cloud",

  // ── Angry subtypes ──
  furious: "Fire",
  annoyed: "BugBeetle",
  resentful: "ShieldWarning",
  outraged: "Megaphone",

  // ══════════════════════════════════════════════════════════
  // FOOD
  // ══════════════════════════════════════════════════════════
  breakfast: "Coffee",
  lunch: "Hamburger",
  dinner: "ForkKnife",
  snack: "Cookie",
  dessert: "IceCream",

  // ── Breakfast items ──
  cereal: "Bowl",
  toast: "Bread",
  eggs: "Egg",
  pancakes: "CookingPot",
  oatmeal: "Bowl",
  yogurt: "Cup",
  fruit_breakfast: "OrangeSlice",
  bacon: "ForkKnife",
  sausage: "ForkKnife",
  muffin: "Cookie",
  croissant: "Bread",
  bagel: "Circle",
  waffles: "GridFour",
  smoothie_bowl: "Bowl",

  // ── Lunch items ──
  sandwich: "Bread",
  salad: "Leaf",
  soup: "Bowl",
  pasta: "ForkKnife",
  rice: "Grains",
  burger: "Hamburger",
  wrap: "CircleHalf",
  sushi: "Fish",
  tacos: "ForkKnife",
  pizza: "Pizza",
  noodles: "ForkKnife",
  stew: "CookingPot",

  // ── Dinner items ──
  steak: "Knife",
  chicken: "Bird",
  fish_dinner: "Fish",
  vegetables: "Carrot",
  potato: "Circle",
  casserole: "CookingPot",
  meatloaf: "Knife",
  roast: "Fire",
  lasagna: "SquaresFour",
  curry: "CookingPot",
  stirfry: "ForkKnife",
  grilled: "Fire",

  // ── Snacks ──
  chips: "Cookie",
  crackers: "SquaresFour",
  nuts: "Tree",
  popcorn: "Popcorn",
  fruit: "Apple",
  apple: "Apple",
  banana: "ForkKnife",
  orange: "OrangeSlice",
  grapes: "Grains",
  berries: "Flower",
  cheese: "SquareHalf",
  chocolate: "Cookie",
  candy: "Candy",
  granola_bar: "Rectangle",
  pretzels: "Pretzel",

  // ── Desserts ──
  cake: "Cake",
  pie: "PieSlice",
  ice_cream: "IceCream",
  cookies: "Cookie",
  pudding: "Bowl",
  brownie: "Square",
  tiramisu: "Coffee",
  cheesecake: "PieSlice",
  custard: "Cup",
  donut: "Circle",
  cupcake: "Cake",
  fruit_salad: "Apple",

  // ── General food concepts ──
  spicy: "Pepper",
  sweet: "Cookie",
  sour: "OrangeSlice",
  salty: "Grains",
  bitter: "Leaf",
  hot_food: "Fire",
  cold_food: "Snowflake",
  soft: "Cloud",
  crunchy: "Lightning",
  bland: "Minus",
  savory: "ForkKnife",
  fresh: "Leaf",
  frozen: "Snowflake",
  cooked: "CookingPot",
  raw: "Leaf",

  // ══════════════════════════════════════════════════════════
  // DRINK
  // ══════════════════════════════════════════════════════════
  water: "DropHalf",
  juice: "OrangeSlice",
  tea: "Coffee",
  coffee_drink: "Coffee",
  milk: "Cup",
  soda: "BeerBottle",
  smoothie: "Blender",
  lemonade: "OrangeSlice",
  hot_chocolate: "Coffee",
  milkshake: "Cup",
  sparkling_water: "Sparkle",
  coconut_water: "Tree",
  protein_shake: "Barbell",
  iced_tea: "Coffee",
  espresso: "Coffee",
  wine: "Wine",
  beer: "BeerBottle",
  cocktail: "Cocktail",
  broth: "Bowl",
  warm: "ThermometerHot",
  cold_drink: "Snowflake",
  straw: "ArrowDown",
  cup: "Cup",
  bottle: "Bottle",
  glass: "Wine",

  // ══════════════════════════════════════════════════════════
  // SLEEP & REST
  // ══════════════════════════════════════════════════════════
  rest: "Bed",
  nap: "Moon",
  bed: "Bed",
  pillow: "CloudMoon",
  blanket: "Rectangle",
  dark_room: "MoonStars",
  quiet: "SpeakerSlash",
  nightlight: "Lamp",
  lullaby: "MusicNote",
  sleepy: "Moon",
  insomnia: "SunHorizon",
  nightmare: "Ghost",
  dream: "Sparkle",
  snoring: "SpeakerHigh",
  alarm_clock: "Alarm",
  wake_up: "SunHorizon",

  // ══════════════════════════════════════════════════════════
  // ENVIRONMENT
  // ══════════════════════════════════════════════════════════
  temperature: "Thermometer",
  light: "LightbulbFilament",
  noise: "SpeakerHigh",
  air: "Wind",
  window: "BrowsersThree",
  door: "DoorOpen",
  fan: "Fan",
  heater: "Fire",
  air_conditioner: "Snowflake",
  curtains: "Rectangle",
  tv_on: "Television",
  tv_off: "TelevisionSimple",
  radio: "Radio",
  smell: "Flower",
  clean: "Broom",
  dirty: "Warning",
  bright: "Sun",
  dim: "Moon",
  too_loud: "SpeakerHigh",
  too_quiet: "SpeakerLow",
  comfortable: "Couch",
  uncomfortable_env: "Warning",

  // ══════════════════════════════════════════════════════════
  // SOCIAL / PEOPLE
  // ══════════════════════════════════════════════════════════
  family: "UsersThree",
  friend: "UserCircle",
  nurse: "FirstAid",
  doctor: "Stethoscope",
  alone: "User",
  visitor: "DoorOpen",
  spouse: "Heart",
  child: "Baby",
  parent: "Users",
  sibling: "UsersThree",
  grandchild: "Baby",
  caregiver: "HandHeart",
  therapist: "ChatCircle",
  companion: "HandshakeExtended",
  pet: "PawPrint",
  neighbor: "HouseSimple",
  stranger: "UserCircleGear",
  group: "UsersThree",
  baby: "Baby",
  elderly: "Person",
  man: "User",
  woman: "User",
  boy: "SmileyWink",
  girl: "Smiley",

  // ── Social actions ──
  talk: "ChatCircle",
  call_someone: "Phone",
  video_call: "VideoCamera",
  text_message: "ChatText",
  hug: "HandsPraying",
  wave: "HandWaving",
  visit: "DoorOpen",
  meet: "Handshake",
  thank: "Heart",
  apologize: "HandsPraying",
  ask_for_help: "HandRaised",

  // ══════════════════════════════════════════════════════════
  // MEDICAL / HEALTH
  // ══════════════════════════════════════════════════════════
  medicine: "Pill",
  pill: "Pill",
  injection: "Syringe",
  bandage: "Bandaids",
  thermometer_med: "Thermometer",
  stethoscope: "Stethoscope",
  wheelchair: "Wheelchair",
  crutches: "Person",
  oxygen: "Wind",
  iv_drip: "Drop",
  blood_pressure: "Heartbeat",
  xray: "Scan",
  surgery: "Scissors",
  prescription: "Prescription",
  appointment: "CalendarCheck",
  checkup: "ClipboardText",
  emergency: "Siren",
  ambulance: "Ambulance",
  hospital: "Hospital",
  pharmacy: "Storefront",
  lab_test: "Flask",
  allergy: "Warning",
  vaccination: "Syringe",
  first_aid: "FirstAidKit",
  inhaler: "Wind",
  eye_drops: "Eye",
  cream: "Jar",
  vitamins: "Pill",
  supplement: "Pill",
  pain_relief: "Bandaids",
  antibiotic: "Pill",
  insulin: "Syringe",
  blood_test: "TestTube",
  heart_monitor: "Heartbeat",
  pulse_check: "Pulse",
  temperature_check: "Thermometer",

  // ══════════════════════════════════════════════════════════
  // ACTIVITIES
  // ══════════════════════════════════════════════════════════
  walk: "PersonSimpleWalk",
  read: "BookOpen",
  write: "PencilSimple",
  draw: "PaintBrush",
  paint: "Palette",
  play: "Play",
  sing: "Microphone",
  dance: "PersonArmsSpread",
  cook: "CookingPot",
  garden: "Plant",
  craft: "Scissors",
  puzzle: "PuzzlePiece",
  exercise: "Barbell",
  stretch: "PersonArmsSpread",
  meditate: "Flower",
  pray: "HandsPraying",
  knit: "Needle",
  sew: "Needle",
  photography: "Camera",
  birdwatch: "Bird",
  fishing: "FishSimple",
  swim: "SwimmingPool",
  bike: "Bicycle",
  yoga: "PersonSimpleThrow",
  chess: "Castle",
  cards: "Cards",
  board_game: "Dice",
  video_game: "GameController",
  crossword: "GridNine",
  coloring: "PaintBrush",
  listening: "Headphones",
  watching: "MonitorPlay",
  shopping: "ShoppingCart",
  cleaning: "Broom",
  organizing: "SquaresFour",
  journaling: "Notebook",

  // ══════════════════════════════════════════════════════════
  // ENTERTAINMENT / WATCH
  // ══════════════════════════════════════════════════════════
  tv: "Television",
  movie: "FilmStrip",
  show: "MonitorPlay",
  documentary: "FilmSlate",
  news: "Newspaper",
  sports: "SoccerBall",
  comedy: "SmileyWink",
  drama: "MaskHappy",
  cartoon: "SmileySticker",
  reality: "Television",
  nature_show: "Tree",
  cooking_show: "CookingPot",
  music_video: "MusicNote",
  podcast: "Headphones",
  audiobook: "BookOpen",
  youtube: "YoutubeLogo",
  streaming: "WifiHigh",
  radio_show: "Radio",

  // ══════════════════════════════════════════════════════════
  // OBJECTS / THINGS
  // ══════════════════════════════════════════════════════════
  phone: "Phone",
  tablet: "DeviceTabletSpeaker",
  computer: "Desktop",
  laptop: "Laptop",
  remote: "SlidersHorizontal",
  glasses_obj: "Glasses",
  hearing_aid: "Ear",
  dentures: "Smiley",
  watch_obj: "Watch",
  wallet: "Wallet",
  keys: "Key",
  book: "Book",
  magazine: "Newspaper",
  pen: "Pen",
  paper: "File",
  tissues: "Note",
  towel: "Rectangle",
  soap: "Drop",
  toothbrush: "Tooth",
  comb: "Comb",
  mirror: "MagnifyingGlass",
  lamp_obj: "Lamp",
  chair: "Armchair",
  table: "Rectangle",
  clock_obj: "Clock",
  calendar: "Calendar",
  photo: "Image",
  bag: "Bag",
  umbrella: "Umbrella",
  flashlight: "Flashlight",
  charger: "BatteryCharging",
  headphones: "Headphones",
  speaker: "SpeakerHigh",

  // ══════════════════════════════════════════════════════════
  // PLACES
  // ══════════════════════════════════════════════════════════
  home: "House",
  bedroom: "Bed",
  bathroom: "Bathtub",
  kitchen: "CookingPot",
  living_room: "Couch",
  garden_place: "Plant",
  porch: "HouseSimple",
  hospital_place: "Hospital",
  clinic: "FirstAid",
  church: "Church",
  park: "Tree",
  store: "Storefront",
  restaurant: "ForkKnife",
  bank: "Bank",
  library: "Books",
  school: "GraduationCap",
  gym: "Barbell",
  beach: "Umbrella",
  mountain: "Mountains",
  lake: "Waves",
  city: "Buildings",
  countryside: "Mountains",
  mall: "Storefront",
  market: "ShoppingCart",
  office: "OfficeChair",
  outside: "Tree",
  inside: "House",
  upstairs: "ArrowUp",
  downstairs: "ArrowDown",

  // ══════════════════════════════════════════════════════════
  // TIME
  // ══════════════════════════════════════════════════════════
  now: "ClockClockwise",
  later: "ClockAfternoon",
  soon: "Timer",
  morning: "SunHorizon",
  afternoon: "Sun",
  evening: "SunDim",
  night: "MoonStars",
  today: "CalendarBlank",
  tomorrow: "CalendarPlus",
  yesterday: "CalendarMinus",
  weekend: "CalendarCheck",
  hour: "ClockCountdown",
  minute: "Timer",
  before: "ArrowLeft",
  after: "ArrowRight",
  early: "SunHorizon",
  late: "Moon",
  always: "Infinity",
  never: "XCircle",
  sometimes: "ArrowsClockwise",
  daily: "CalendarCheck",
  weekly: "Calendar",
  monthly: "CalendarDots",

  // ══════════════════════════════════════════════════════════
  // WEATHER
  // ══════════════════════════════════════════════════════════
  sunny: "Sun",
  cloudy: "Cloud",
  rainy: "CloudRain",
  snowy: "Snowflake",
  windy: "Wind",
  stormy: "CloudLightning",
  foggy: "CloudFog",
  rainbow: "Rainbow",
  hot_weather: "ThermometerHot",
  cold_weather: "ThermometerCold",
  humid: "Drop",
  dry: "Sun",
  hail: "CloudSnow",
  thunder: "Lightning",
  tornado: "Tornado",
  overcast: "Cloud",
  clear_sky: "Sun",
  frost: "Snowflake",

  // ══════════════════════════════════════════════════════════
  // COMMUNICATION
  // ══════════════════════════════════════════════════════════
  yes: "Check",
  no: "X",
  maybe: "Question",
  please: "HandsPraying",
  thank_you: "Heart",
  sorry: "SmileySad",
  hello: "HandWaving",
  goodbye: "HandWaving",
  help: "Lifebuoy",
  stop: "StopCircle",
  wait: "Hourglass",
  more: "Plus",
  less: "Minus",
  again: "ArrowClockwise",
  done: "CheckCircle",
  not_yet: "Clock",
  i_dont_know: "Question",
  i_want: "ArrowRight",
  i_need: "Star",
  i_feel: "Heart",
  i_am: "User",
  i_like: "ThumbsUp",
  i_dont_like: "ThumbsDown",
  show_me: "Eye",
  tell_me: "ChatCircle",
  take_me: "MapPin",
  give_me: "HandGrabbing",
  bring_me: "Package",

  // ══════════════════════════════════════════════════════════
  // HYGIENE & SELF-CARE
  // ══════════════════════════════════════════════════════════
  shower: "Shower",
  bath: "Bathtub",
  brush_teeth: "Tooth",
  wash_hands: "HandSoap",
  wash_face: "Drop",
  shave: "Scissors",
  haircut: "Scissors",
  lotion: "Jar",
  deodorant: "SprayBottle",
  makeup: "PaintBrush",
  nail_care: "Scissors",
  change_clothes: "TShirt",
  laundry: "TShirt",

  // ══════════════════════════════════════════════════════════
  // CLOTHING
  // ══════════════════════════════════════════════════════════
  shirt: "TShirt",
  pants: "Pants",
  dress: "Dress",
  coat: "Hoodie",
  sweater: "Hoodie",
  jacket: "Hoodie",
  socks: "Boot",
  shoes: "SneakerMove",
  hat: "BaseballCap",
  scarf: "Rectangle",
  gloves: "Hand",
  underwear: "TShirt",
  pajamas: "Moon",
  robe: "Hoodie",
  belt: "Minus",
  tie: "ArrowDown",
  sunglasses: "Sunglasses",
  boots: "Boot",

  // ══════════════════════════════════════════════════════════
  // TRANSPORTATION
  // ══════════════════════════════════════════════════════════
  car: "Car",
  bus: "Bus",
  taxi: "Taxi",
  train: "Train",
  airplane: "Airplane",
  boat: "Boat",
  bicycle_trans: "Bicycle",
  walk_trans: "PersonSimpleWalk",
  wheelchair_trans: "Wheelchair",
  scooter: "Scooter",
  van: "Van",
  motorcycle: "Motorcycle",
  helicopter: "Helicopter",
  subway: "TrainSimple",

  // ══════════════════════════════════════════════════════════
  // MUSIC & SOUND
  // ══════════════════════════════════════════════════════════
  singing: "Microphone",
  guitar: "Guitar",
  piano: "Piano",
  drums: "Metronome",
  classical: "MusicNote",
  jazz: "MusicNotes",
  rock: "Guitar",
  pop: "MusicNotesPlus",
  country: "MusicNote",
  opera: "MicrophoneStage",
  choir: "UsersThree",
  instrument: "Guitar",
  melody: "MusicNotes",
  rhythm: "Metronome",
  volume_up: "SpeakerHigh",
  volume_down: "SpeakerLow",
  mute: "SpeakerSlash",
  playlist: "Playlist",

  // ══════════════════════════════════════════════════════════
  // NATURE & ANIMALS
  // ══════════════════════════════════════════════════════════
  flower: "Flower",
  tree_nature: "TreeEvergreen",
  plant: "Potted",
  grass: "Grains",
  river: "Waves",
  ocean: "Waves",
  forest: "TreeEvergreen",
  mountain_nature: "Mountains",
  sunset: "SunHorizon",
  sunrise: "SunDim",
  stars: "Star",
  moon_nature: "Moon",
  dog: "Dog",
  cat: "Cat",
  bird_animal: "Bird",
  fish_animal: "Fish",
  horse: "Horse",
  rabbit: "Rabbit",
  butterfly: "Butterfly",
  bee: "BugBeetle",
  squirrel: "PawPrint",

  // ══════════════════════════════════════════════════════════
  // EDUCATION & LEARNING
  // ══════════════════════════════════════════════════════════
  learn: "GraduationCap",
  study: "BookOpen",
  practice: "Target",
  homework: "Notebook",
  teacher: "Chalkboard",
  student: "Student",
  class: "Chalkboard",
  lesson: "BookOpen",
  exam: "Exam",
  grade: "Certificate",
  diploma: "Certificate",
  lecture: "Presentation",
  tutor: "Person",
  science: "Atom",
  math: "MathOperations",
  history: "ScrollOpen",
  language: "Translate",
  art: "Palette",

  // ══════════════════════════════════════════════════════════
  // RELIGION & SPIRITUALITY
  // ══════════════════════════════════════════════════════════
  church_place: "Church",
  prayer: "HandsPraying",
  bible: "Book",
  worship: "HandsPraying",
  faith: "Cross",
  blessing: "Sparkle",
  meditation: "Flower",
  spirit: "Sparkle",
  soul: "Heart",
  peace: "Peace",
  hope: "Star",

  // ══════════════════════════════════════════════════════════
  // TECHNOLOGY
  // ══════════════════════════════════════════════════════════
  internet: "Globe",
  wifi: "WifiHigh",
  bluetooth: "Bluetooth",
  email: "Envelope",
  camera: "Camera",
  printer: "Printer",
  usb: "Usb",
  battery: "BatteryFull",
  settings: "GearSix",
  search: "MagnifyingGlass",
  download: "DownloadSimple",
  upload: "UploadSimple",
  notification: "Bell",
  password: "Lock",
  screen: "Monitor",

  // ══════════════════════════════════════════════════════════
  // EMOTIONS — EXTENDED
  // ══════════════════════════════════════════════════════════
  confident: "Shield",
  determined: "Target",
  inspired: "LightbulbFilament",
  motivated: "Fire",
  patient_feeling: "Hourglass",
  impatient: "Timer",
  curious: "MagnifyingGlass",
  creative: "PaintBrush",
  moody: "CloudMoon",
  sensitive: "Heart",
  stubborn: "Wall",
  flexible: "Waves",
  generous: "Gift",
  selfish: "User",
  sympathetic: "Handshake",
  indifferent: "Minus",
  optimistic: "Sun",
  pessimistic: "Cloud",
  thoughtful: "Brain",

  // ══════════════════════════════════════════════════════════
  // HOUSEHOLD
  // ══════════════════════════════════════════════════════════
  vacuum: "Broom",
  dishes: "Bowl",
  cooking: "CookingPot",
  garbage: "Trash",
  recycling: "Recycle",
  mop: "Broom",
  dust: "Wind",
  iron: "Lightning",
  fold: "SquaresFour",
  sweep: "Broom",
  fix: "Wrench",
  repair: "Screwdriver",
  replace: "ArrowsClockwise",
  install: "Hammer",

  // ══════════════════════════════════════════════════════════
  // QUANTITY / DESCRIPTORS
  // ══════════════════════════════════════════════════════════
  a_little: "Minus",
  a_lot: "Plus",
  some: "CircleHalf",
  all: "Circle",
  none: "XCircle",
  big: "ArrowsOut",
  small: "ArrowsIn",
  hot_desc: "Fire",
  cold_desc: "Snowflake",
  good: "ThumbsUp",
  bad: "ThumbsDown",
  new_desc: "Star",
  old_desc: "Clock",
  fast: "Lightning",
  slow: "Snail",
  hard: "Diamond",
  easy: "CheckCircle",
  heavy: "Barbell",
  light_desc: "Feather",
  right: "CheckCircle",
  wrong: "XCircle",
  same: "Equals",
  different: "ArrowsHorizontal",
  better: "TrendUp",
  worse: "TrendDown",
  best: "Crown",
  worst: "WarningCircle",
  favorite: "Star",
  important: "Flag",
  urgent: "Siren",

  // ══════════════════════════════════════════════════════════
  // ACTIONS / VERBS
  // ══════════════════════════════════════════════════════════
  go: "ArrowRight",
  come: "ArrowLeft",
  sit: "Armchair",
  stand: "Person",
  lie_down: "Bed",
  turn: "ArrowsClockwise",
  open: "DoorOpen",
  close: "Door",
  push: "ArrowRight",
  pull: "ArrowLeft",
  pick_up: "ArrowUp",
  put_down: "ArrowDown",
  take: "HandGrabbing",
  give: "Gift",
  hold: "Hand",
  drop: "ArrowDown",
  throw: "ArrowUpRight",
  catch: "Hand",
  move: "ArrowsHorizontal",
  carry: "Package",
  lift: "ArrowUp",
  lower: "ArrowDown",
  eat: "ForkKnife",
  drink_verb: "Cup",
  chew: "Tooth",
  swallow: "ArrowDown",
  taste: "Cookie",
  smell_verb: "Flower",
  look: "Eye",
  listen: "Ear",
  touch: "HandPointing",
  feel: "Heart",
  think: "Brain",
  remember: "Brain",
  forget: "MinusCircle",
  understand: "LightbulbFilament",
  try: "Target",
  start: "Play",
  finish: "FlagCheckered",
  continue: "ArrowRight",
  change: "ArrowsClockwise",
  choose: "Crosshairs",
  decide: "ScalesThreeD",
  agree: "Check",
  disagree: "X",

  // ══════════════════════════════════════════════════════════
  // CORRECTIONS / META
  // ══════════════════════════════════════════════════════════
  undo: "ArrowCounterClockwise",
  redo: "ArrowClockwise",
  delete: "Trash",
  clear: "XCircle",
  submit: "PaperPlaneRight",
  speak: "SpeakerHigh",
  deeper: "CaretDown",
  back: "ArrowLeft",
  forward: "ArrowRight",

  // ══════════════════════════════════════════════════════════
  // FALLBACK
  // ══════════════════════════════════════════════════════════
  unknown: "Question",
  other: "DotsThree",
  more_options: "DotsThreeOutline",
};

/**
 * Retrieve the React component for a given concept key.
 * Supports three modes:
 *   1. ICON_MAP key → Phosphor component
 *   2. Direct Phosphor component name → Phosphor component
 *   3. Inline SVG string (starts with "<svg") → renders raw SVG
 * Falls back to the Question icon if no mapping exists.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const getIconComponent = (key: string): React.ComponentType<any> => {
  // Layered icon payload from backend, e.g. layer:person-simple-run+sun
  if (key && key.startsWith("layer:")) {
    const [a, b] = key.replace("layer:", "").split("+");
    const toPascal = (value: string) =>
      value
        .split("-")
        .filter(Boolean)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join("");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const A = (PhosphorIcons as any)[toPascal(a)];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const B = (PhosphorIcons as any)[toPascal(b)];
    if (A && B) {
      const LayeredIcon = (props: { className?: string; style?: React.CSSProperties }) => (
        <span className={props.className} style={{ position: "relative", display: "inline-flex", ...props.style }}>
          <A weight="regular" style={{ position: "absolute", inset: 0, opacity: 0.9 }} />
          <B weight="fill" style={{ position: "absolute", inset: 0, transform: "scale(0.68) translate(32%, 32%)" }} />
          <span style={{ width: "1em", height: "1em", display: "inline-block" }} />
        </span>
      );
      LayeredIcon.displayName = "LayeredIcon";
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return LayeredIcon as any;
    }
  }

  // Tier 3 fallback: inline SVG from the Icon Agent
  if (key && key.trim().startsWith("<svg")) {
    // Return a component that renders the raw SVG
    const InlineSvgIcon = (props: { className?: string; style?: React.CSSProperties }) => {
      return (
        <span
          className={props.className}
          style={{ display: "inline-flex", ...props.style }}
          dangerouslySetInnerHTML={{ __html: key }}
        />
      );
    };
    InlineSvgIcon.displayName = "InlineSvgIcon";
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return InlineSvgIcon as any;
  }

  const toPascal = (value: string) =>
    value
      .split("-")
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join("");

  // New backend payload: kebab-case Phosphor name, e.g. "fork-knife"
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const directKebab = (PhosphorIcons as any)[toPascal(key)];
  if (directKebab) return directKebab;

  const iconName = ICON_MAP[key] || key; // legacy semantic key path
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const Icon = (PhosphorIcons as any)[iconName];
  if (!Icon) {
    console.warn(`Icon "${iconName}" (key: "${key}") not found in Phosphor Icons, falling back to DotsThreeCircle.`);
    return PhosphorIcons.DotsThreeCircle;
  }
  return Icon;
};
