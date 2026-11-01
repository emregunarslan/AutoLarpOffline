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

// Deterministic gauges per car so the numbers look real but stay stable.
// pct = battery %, fuel = fuel tank %, km = electric-only range (null for gas),
// psi = tire pressures [FL, FR, RL, RR].
function fakeRange(car) {
  let h = 0;
  for (const c of car.id) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  const type = powertrainOf(car);
  const pct = 55 + (h % 41);          // 55–95%
  const fuel = 40 + ((h >>> 7) % 56); // 40–95%
  const oil = 60 + ((h >>> 13) % 38); // 60–97%
  const km = { electric: Math.round(pct * 5.1), gas: null }[type];
  const basePsi = { electric: 42, gas: 35 }[type];
  const psi = [0, 1, 2, 3].map((i) => basePsi + ((h >>> (17 + i * 2)) % 3) - 1);
  return { pct, fuel, oil, km, psi };
}

function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
