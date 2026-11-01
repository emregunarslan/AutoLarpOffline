// Brand-specific control menus: each brand gets its own accent colour and a
// few signature features on top of the shared controls.

// [label, icon, onText, offText (null = one-shot)]
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

// Features that physically move something get the press cooldown.
const SIGNATURE_COOLDOWN = ['frontlift', 'wing', 'suspension', 'doors', 'umbrella'];

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
};

function brandTheme(slug) {
  return BRAND_THEMES[slug] || { accent: '#3e6ae1', features: ['ambient', 'camera', 'guard'] };
}
