// Tiny IndexedDB wrapper. All data stays on the device.
const DB = (() => {
  const NAME = 'autolarp';
  const VERSION = 1;
  let dbPromise;

  function open() {
    if (!dbPromise) {
      dbPromise = new Promise((resolve, reject) => {
        const req = indexedDB.open(NAME, VERSION);
        req.onupgradeneeded = () => {
          const db = req.result;
          if (!db.objectStoreNames.contains('cars')) db.createObjectStore('cars', { keyPath: 'id' });
          if (!db.objectStoreNames.contains('meta')) db.createObjectStore('meta');
        };
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      });
    }
    return dbPromise;
  }

  async function run(store, mode, fn) {
    const db = await open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(store, mode);
      const req = fn(tx.objectStore(store));
      tx.oncomplete = () => resolve(req && req.result);
      tx.onerror = () => reject(tx.error);
    });
  }

  return {
    async getCars() {
      const cars = await run('cars', 'readonly', (s) => s.getAll());
      return (cars || []).sort((a, b) => a.createdAt - b.createdAt);
    },
    getCar: (id) => run('cars', 'readonly', (s) => s.get(id)),
    saveCar(car) {
      if (!car.id) car.id = Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
      if (!car.createdAt) car.createdAt = Date.now();
      return run('cars', 'readwrite', (s) => s.put(car)).then(() => car);
    },
    deleteCar: (id) => run('cars', 'readwrite', (s) => s.delete(id)),
    async resetAll() {
      await run('cars', 'readwrite', (s) => s.clear());
      await run('meta', 'readwrite', (s) => s.clear());
      sessionStorage.clear();
    },
    async getProfile() {
      const p = await run('meta', 'readonly', (s) => s.get('profile'));
      if (p) return p;
      const fresh = { name: 'Owner', memberSince: Date.now() };
      await run('meta', 'readwrite', (s) => s.put(fresh, 'profile'));
      return fresh;
    },
    saveProfile: (p) => run('meta', 'readwrite', (s) => s.put(p, 'profile')),
  };
})();

// Used when a car has no location set (UofT Sandford Fleming Building).
const DEFAULT_LOCATION = "10 King's College Rd";

const POWERTRAINS = { electric: 'Electric', gas: 'Gas' };

// Cars saved before powertrains existed were all shown as electric;
// hybrids (no longer offered) have an engine, so they become gas.
function powertrainOf(car) {
  if (car.powertrain === 'hybrid') return 'gas';
  return POWERTRAINS[car.powertrain] ? car.powertrain : 'electric';
}

const BODY_TYPES = { sedan: 'Sedan', suv: 'SUV', truck: 'Truck' };

function bodyTypeOf(car) {
  return BODY_TYPES[car.bodyType] ? car.bodyType : 'sedan';
}

// What the rear opening is called for each body type.
function trunkName(car) {
  return { suv: 'Liftgate', truck: 'Tailgate' }[bodyTypeOf(car)] || 'Trunk';
}

const rand = (min, max) => Math.round(min + Math.random() * (max - min));

// Gauge readings, re-rolled within realistic ranges each time the app is opened,
// then kept for the session so every page shows the same numbers.
// pct = battery %, km = electric range (null for gas), fuelBand = estimated fuel [low, high] %,
// oil = oil life %, psi = tire pressures [FL, FR, RL, RR].
function vehicleStats(car) {
  const key = `stats:${car.id}:${powertrainOf(car)}`;
  const cached = sessionStorage.getItem(key);
  if (cached) return JSON.parse(cached);

  const electric = powertrainOf(car) === 'electric';
  const pct = rand(30, 92);
  const kmPerPct = 4.2 + Math.random() * 1.4; // 420–560 km on a full charge
  const fuel = rand(20, 95);
  const low = Math.min(80, Math.floor(fuel / 20) * 20);
  const basePsi = electric ? 42 : 35;
  const stats = {
    pct,
    km: electric ? Math.round(pct * kmPerPct) : null,
    fuelBand: [low, low + 20],
    oil: rand(35, 95),
    psi: [0, 1, 2, 3].map(() => basePsi + rand(-2, 1)),
  };
  sessionStorage.setItem(key, JSON.stringify(stats));
  return stats;
}

function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
