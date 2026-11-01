// Made-up but believable car values in CAD. Each car's value comes from its brand's
// price band, placed within the band by a hash of the car's id, so the same car
// always shows the same value. Loaded by the pages and imported by the server.

// [low, high] in CAD.
// Deliberately generous: it's the owner's dream garage.
const PRICE_BANDS = {
  hypercar: [4000000, 8500000],
  supercar: [480000, 1100000],
  rollsroyce: [700000, 1200000],
  bentley: [420000, 750000],
  astonmartin: [340000, 650000],
  performance: [190000, 420000],
  luxury: [95000, 240000],
  mainstream: [55000, 120000],
  budget: [36000, 70000],
};

const BRAND_TIER = {
  bugatti: 'hypercar', koenigsegg: 'hypercar', pagani: 'hypercar', rimacautomobili: 'hypercar',
  ferrari: 'supercar', lamborghini: 'supercar', mclaren: 'supercar',
  rollsroyce: 'rollsroyce', bentley: 'bentley', astonmartin: 'astonmartin',
  porsche: 'performance', maserati: 'performance', lucid: 'performance', lotus: 'performance',
  mercedes: 'luxury', bmw: 'luxury', audi: 'luxury', lexus: 'luxury', cadillac: 'luxury', genesis: 'luxury',
  landrover: 'luxury', jaguar: 'luxury', volvo: 'luxury', polestar: 'luxury', lincoln: 'luxury',
  infiniti: 'luxury', acura: 'luxury', tesla: 'luxury', rivian: 'luxury', alfaromeo: 'luxury',
  dsautomobiles: 'luxury', nio: 'luxury', zeekr: 'luxury',
  dacia: 'budget', suzuki: 'budget', mitsubishi: 'budget', fiat: 'budget', smart: 'budget', mg: 'budget',
  seat: 'budget', skoda: 'budget', vinfast: 'budget',
  // Everything else (Toyota, Honda, Ford, GMC, Ram, VW, Kia, BYD, ...) is mainstream.
};

// Where in the band a body type tends to sit (0 = bottom, 1 = top).
const BODY_NUDGE = { coupe: 0.25, truck: 0.15, suv: 0.1, sedan: 0 };

// Stable number in [0, 1) from a string (FNV-1a hash).
function hash01(text) {
  let h = 2166136261;
  for (const ch of String(text)) h = Math.imul(h ^ ch.charCodeAt(0), 16777619) >>> 0;
  // Final mix so ids that differ by one character still land far apart.
  h ^= h >>> 16; h = Math.imul(h, 0x85ebca6b) >>> 0;
  h ^= h >>> 13; h = Math.imul(h, 0xc2b2ae35) >>> 0;
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296; // >>> 0: XOR returns a signed number
}

function roundNicely(n) {
  const step = n >= 1000000 ? 10000 : n >= 100000 ? 1000 : 500;
  return Math.round(n / step) * step;
}

function carValue(car) {
  const [low, high] = PRICE_BANDS[BRAND_TIER[car.brand] || 'mainstream'];
  // Cars sit in the upper 70% of their band; body type raises the floor within
  // that (coupes start higher) without pushing every car to the very top.
  const nudge = BODY_NUDGE[car.bodyType] || 0;
  const position = 0.3 + 0.7 * (nudge + (1 - nudge) * hash01(car.id || car.title || ''));
  const electric = !['gas', 'hybrid'].includes(car.powertrain);
  return roundNicely((low + (high - low) * position) * (electric ? 1.05 : 1));
}

// "CA$214,500", or compact "CA$214K" / "CA$3.2M".
function formatCAD(n, { compact = false } = {}) {
  return new Intl.NumberFormat('en-US', { // en-US shows CAD as "CA$", so it can't be read as US dollars
    style: 'currency', currency: 'CAD',
    ...(compact ? { notation: 'compact', maximumFractionDigits: 1 } : { maximumFractionDigits: 0 }),
  }).format(n);
}

// Values are shown as an estimate range around the car's value (about ±8%),
// e.g. a CA$420,000 car shows "CA$386,000 – CA$454,000".
const RANGE = 0.08;
function valueRange(value) {
  return [roundNicely(value * (1 - RANGE)), roundNicely(value * (1 + RANGE))];
}
function carValueRange(car) {
  return valueRange(carValue(car));
}
function formatCADRange([low, high], options) {
  return `${formatCAD(low, options)} – ${formatCAD(high, options)}`;
}

// Lets the server import this file and use the same numbers.
globalThis.CarValue = { carValue, carValueRange, valueRange, formatCAD, formatCADRange, PRICE_BANDS, BRAND_TIER };
