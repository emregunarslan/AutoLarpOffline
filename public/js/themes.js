// Vehicle controls and brand-specific menus. Loaded by the car page and the AI
// assistant in the browser, and imported by the server so both agree on which
// controls each vehicle has.

// [label, icon, onText, offText (null = one-shot), startsOn]
const BASE_CONTROLS = {
  lock: ['Lock', 'lock', 'Locked', 'Unlocked', true],
  climate: ['Climate', 'fan', 'Climate on', 'Climate off'],
  start: ['Remote Start', 'power', 'Engine started', 'Engine stopped'],
  trunk: ['Trunk', 'trunk', 'Trunk opened', 'Trunk closed'],
  charge: ['Charge Port', 'bolt', 'Charge port opened', 'Charge port closed'],
  charging: ['Charging', 'plug', 'Charging started', 'Charging stopped'],
  timer: ['Charge Timer', 'clock', 'Charge timer set', 'Charge timer off'],
  precond: ['Precondition', 'thermo', 'Preconditioning on', 'Preconditioning off'],
  defrost: ['Defrost', 'defrost', 'Defrost on', 'Defrost off'],
  seat: ['Heated Seats', 'seat', 'Heated seats on', 'Heated seats off'],
  seatcool: ['Cooled Seats', 'snow', 'Ventilated seats on', 'Ventilated seats off'],
  wheel: ['Heated Wheel', 'wheel', 'Heated steering wheel on', 'Heated steering wheel off'],
  windows: ['Windows', 'window', 'Windows opened', 'Windows closed'],
  sunroof: ['Sunroof', 'sunroof', 'Sunroof opened', 'Sunroof closed'],
  horn: ['Horn', 'horn', 'Horn sounded', null],
  flash: ['Lights', 'lights', 'Lights flashed', null],
  panic: ['Alarm', 'alarm', 'Alarm sounding', 'Alarm off'],
  locate: ['Find Vehicle', 'location', 'Vehicle location updated', null],
  garage: ['Garage Door', 'home', 'Garage door signal sent', null],
  valet: ['Valet Mode', 'valet', 'Valet Mode on', 'Valet Mode off'],
};

const SIGNATURE_FEATURES = {
  sport: ['Sport Mode', 'gauge', 'Sport mode ready', 'Comfort mode'],
  exhaust: ['Sport Exhaust', 'exhaust', 'Sport exhaust open', 'Sport exhaust quiet'],
  frontlift: ['Nose Lift', 'updown', 'Nose lift raised', 'Nose lift lowered'],
  wing: ['Rear Wing', 'wing', 'Rear wing deployed', 'Rear wing retracted'],
  starlight: ['Starlight', 'sparkle', 'Starlight headliner on', 'Starlight headliner off'],
  umbrella: ['Umbrellas', 'umbrella', 'Umbrella compartment opened', 'Umbrella compartment closed'],
  doors: ['Close Doors', 'door', 'Doors closing', null],
  mood: ['Mood Lighting', 'sparkle', 'Mood lighting on', 'Mood lighting off'],
  ambient: ['Ambient Light', 'sparkle', 'Ambient lighting on', 'Ambient lighting off'],
  massage: ['Massage Seats', 'seat', 'Massage seats on', 'Massage seats off'],
  fragrance: ['Fragrance', 'drop', 'Cabin fragrance on', 'Cabin fragrance off'],
  purifier: ['Air Purifier', 'wind', 'Air purifier on', 'Air purifier off'],
  camera: ['360° View', 'eye', 'Surround view refreshed', null],
  parking: ['Remote Park', 'parking', 'Remote parking ready', 'Remote parking cancelled'],
  heater: ['Aux Heater', 'thermo', 'Auxiliary heater on', 'Auxiliary heater off'],
  suspension: ['Ride Height', 'updown', 'Suspension raised', 'Suspension lowered'],
  terrain: ['Terrain Mode', 'mountain', 'Off-road mode on', 'Off-road mode off'],
  guard: ['Theft Guard', 'shield', 'Theft guard armed', 'Theft guard disarmed'],
  camp: ['Camp Mode', 'tent', 'Camp mode on', 'Camp mode off'],
  power: ['Onboard Power', 'plug', 'Power outlets on', 'Power outlets off'],
  bedlights: ['Bed Lights', 'lights', 'Bed lights on', 'Bed lights off'],
};

// Controls that physically move something get the press cooldown.
const COOLDOWN_CONTROLS = ['lock', 'start', 'trunk', 'charge', 'windows', 'sunroof',
  'frontlift', 'wing', 'suspension', 'doors', 'umbrella'];

const BRAND_THEMES = {
  tesla: { accent: '#3e6ae1', features: ['camp', 'purifier', 'guard'] },
  porsche: { accent: '#c8102e', features: ['sport', 'exhaust', 'frontlift'] },
  ferrari: { accent: '#da291c', features: ['sport', 'frontlift', 'exhaust'] },
  lamborghini: { accent: '#c9a227', features: ['frontlift', 'exhaust', 'sport'] },
  mclaren: { accent: '#ff7a00', features: ['wing', 'frontlift', 'sport'] },
  rollsroyce: { accent: '#a89068', features: ['starlight', 'umbrella', 'doors'] },
  bentley: { accent: '#2f7a55', features: ['mood', 'massage', 'purifier'] },
  astonmartin: { accent: '#00877a', features: ['sport', 'exhaust', 'ambient'] },
  bugatti: { accent: '#2350c8', features: ['wing', 'sport', 'frontlift'] },
  maserati: { accent: '#4f72b0', features: ['sport', 'exhaust', 'ambient'] },
  mercedes: { accent: '#0096d6', features: ['fragrance', 'massage', 'ambient'] },
  bmw: { accent: '#1c69d4', features: ['camera', 'parking', 'ambient'] },
  audi: { accent: '#bb0a30', features: ['heater', 'camera', 'ambient'] },
  lexus: { accent: '#7d8ea6', features: ['massage', 'purifier', 'ambient'] },
  cadillac: { accent: '#a6894f', features: ['massage', 'camera', 'ambient'] },
  lucid: { accent: '#b8975a', features: ['purifier', 'ambient', 'massage'] },
  rivian: { accent: '#e89a00', features: ['camp', 'suspension', 'guard'] },
  polestar: { accent: '#c99a44', features: ['purifier', 'heater', 'ambient'] },
  landrover: { accent: '#1f7a45', features: ['terrain', 'suspension', 'heater'] },
  jaguar: { accent: '#8c9196', features: ['sport', 'purifier', 'ambient'] },
  volvo: { accent: '#3f73b5', features: ['heater', 'purifier', 'camera'] },
  genesis: { accent: '#a9825a', features: ['parking', 'massage', 'ambient'] },
  toyota: { accent: '#d70c19', features: ['guard', 'camera', 'heater'] },
  honda: { accent: '#c40000', features: ['guard', 'camera', 'heater'] },
  ford: { accent: '#1351d8', features: ['power', 'guard', 'camera'] },
  chevrolet: { accent: '#c69214', features: ['guard', 'camera', 'heater'] },
  dodge: { accent: '#e0262e', features: ['sport', 'exhaust', 'guard'] },
  jeep: { accent: '#6b7a3a', features: ['terrain', 'guard', 'camera'] },
  nissan: { accent: '#c3002f', features: ['camera', 'guard', 'heater'] },
  hyundai: { accent: '#0088b8', features: ['parking', 'camera', 'guard'] },
  kia: { accent: '#c8323f', features: ['parking', 'camera', 'guard'] },
  mazda: { accent: '#9b1b30', features: ['camera', 'guard', 'heater'] },
  subaru: { accent: '#1971c2', features: ['terrain', 'heater', 'guard'] },
  volkswagen: { accent: '#2c74b5', features: ['heater', 'camera', 'guard'] },
  acura: { accent: '#a6192e', features: ['sport', 'camera', 'ambient'] },
  alfaromeo: { accent: '#9b1b30', features: ['sport', 'exhaust', 'ambient'] },
  buick: { accent: '#5d7391', features: ['massage', 'camera', 'guard'] },
  byd: { accent: '#1e88b8', features: ['purifier', 'camera', 'guard'] },
  chrysler: { accent: '#2d4a7a', features: ['camera', 'heater', 'guard'] },
  dacia: { accent: '#646b52', features: ['terrain', 'camera', 'guard'] },
  dsautomobiles: { accent: '#a08a6b', features: ['ambient', 'massage', 'camera'] },
  fiat: { accent: '#b5121b', features: ['ambient', 'camera', 'guard'] },
  gmc: { accent: '#c8102e', features: ['power', 'camera', 'guard'] },
  infiniti: { accent: '#7d8ea6', features: ['massage', 'camera', 'ambient'] },
  koenigsegg: { accent: '#b8962e', features: ['wing', 'frontlift', 'sport'] },
  lincoln: { accent: '#8a7a5c', features: ['massage', 'ambient', 'camera'] },
  lotus: { accent: '#b39500', features: ['sport', 'wing', 'exhaust'] },
  mg: { accent: '#a6192e', features: ['camera', 'guard', 'heater'] },
  mini: { accent: '#2b6cb0', features: ['ambient', 'sport', 'camera'] },
  mitsubishi: { accent: '#d7141a', features: ['terrain', 'camera', 'guard'] },
  nio: { accent: '#2f8fa1', features: ['purifier', 'ambient', 'massage'] },
  opel: { accent: '#b89400', features: ['heater', 'camera', 'guard'] },
  pagani: { accent: '#a68a4b', features: ['wing', 'frontlift', 'exhaust'] },
  peugeot: { accent: '#3d5a80', features: ['ambient', 'camera', 'heater'] },
  ram: { accent: '#7a7e84', features: ['power', 'terrain', 'camera'] },
  renault: { accent: '#b89400', features: ['heater', 'camera', 'guard'] },
  rimacautomobili: { accent: '#3b82c4', features: ['sport', 'wing', 'frontlift'] },
  seat: { accent: '#b5121b', features: ['sport', 'camera', 'ambient'] },
  skoda: { accent: '#2e7d4f', features: ['heater', 'camera', 'guard'] },
  smart: { accent: '#5e8f2f', features: ['purifier', 'camera', 'guard'] },
  suzuki: { accent: '#1f5fa8', features: ['terrain', 'camera', 'guard'] },
  vauxhall: { accent: '#c8102e', features: ['heater', 'camera', 'guard'] },
  vinfast: { accent: '#2d6cdf', features: ['purifier', 'camera', 'guard'] },
  xiaomi: { accent: '#e05e00', features: ['sport', 'ambient', 'purifier'] },
  xpeng: { accent: '#3b8bc6', features: ['parking', 'camera', 'ambient'] },
  zeekr: { accent: '#5a6b7d', features: ['sport', 'ambient', 'massage'] },
};

function brandTheme(slug) {
  return BRAND_THEMES[slug] || { accent: '#3e6ae1', features: ['ambient', 'camera', 'guard'] };
}

// What the rear opening is called for each body type.
function rearName(car) {
  return { suv: 'Liftgate', truck: 'Tailgate' }[car.bodyType] || 'Trunk';
}

// Every control definition for this car (the rear opening is named by body type).
function controlDefs(car) {
  const rear = rearName(car);
  return {
    ...BASE_CONTROLS,
    trunk: [rear, 'trunk', `${rear} opened`, `${rear} closed`],
    ...SIGNATURE_FEATURES,
  };
}

// Which controls this car shows: four quick buttons plus the grid.
// Brand signature features lead; trucks swap the sunroof for bed lights.
function controlLayout(car) {
  const electric = !['gas', 'hybrid'].includes(car.powertrain);
  const common = ['defrost', 'seat', 'seatcool', 'wheel', 'windows',
    car.bodyType === 'truck' ? 'bedlights' : 'sunroof',
    'horn', 'flash', 'panic', 'locate', 'garage', 'valet'];
  const features = brandTheme(car.brand).features;
  return electric
    ? { quick: ['lock', 'climate', 'charge', 'trunk'], grid: [...features, 'charging', 'timer', 'precond', ...common] }
    : { quick: ['lock', 'start', 'climate', 'trunk'], grid: [...features, ...common] };
}

// Lets the server import this file and use the same definitions.
globalThis.CarControls = { controlDefs, controlLayout, brandTheme, COOLDOWN_CONTROLS };
