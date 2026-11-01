// Made-up but believable car values in CAD. Each car's value comes from its brand's
// price band, placed within the band by a hash of the car's id, so the same car
// always shows the same value. Loaded by the pages and imported by the server.

// [low, high] in CAD.
const PRICE_BANDS = {
  hypercar: [2500000, 5000000],
  supercar: [300000, 650000],
  rollsroyce: [450000, 700000],
  bentley: [250000, 450000],
  astonmartin: [200000, 400000],
  performance: [110000, 250000],
  luxury: [55000, 140000],
  mainstream: [32000, 75000],
  budget: [22000, 45000],
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
  return h / 4294967296;
}

function roundNicely(n) {
  const step = n >= 1000000 ? 10000 : n >= 100000 ? 1000 : 500;
  return Math.round(n / step) * step;
}

function carValue(car) {
  const [low, high] = PRICE_BANDS[BRAND_TIER[car.brand] || 'mainstream'];
  const position = Math.min(1, hash01(car.id || car.title || '') * 0.75 + (BODY_NUDGE[car.bodyType] || 0));
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

// Lets the server import this file and use the same numbers.
globalThis.CarValue = { carValue, formatCAD, PRICE_BANDS, BRAND_TIER };
