// Talks to the AutoLarp server; vehicles and profile live in MongoDB per account.
const DB = (() => {
  async function api(method, path, body) {
    const res = await fetch(`/api${path}`, {
      method,
      headers: body ? { 'Content-Type': 'application/json' } : {},
      body: body ? JSON.stringify(body) : undefined,
      credentials: 'same-origin',
    });
    const data = await res.json().catch(() => ({}));
    if (res.status === 401 && !location.pathname.startsWith('/login')) {
      location.replace('login.html');
      return new Promise(() => {}); // page is leaving; never resolve
    }
    if (!res.ok) throw new Error(data.error || 'Something went wrong');
    return data;
  }

  return {
    api,
    getCars: () => api('GET', '/cars'),
    getCarSummaries: () => api('GET', '/cars?summary=1'), // no photos
    getCar: (id) => api('GET', `/cars/${encodeURIComponent(id)}`).catch(() => null),
    saveCar: (car) => (car.id
      ? api('PUT', `/cars/${encodeURIComponent(car.id)}`, car)
      : api('POST', '/cars', car)),
    deleteCar: (id) => api('DELETE', `/cars/${encodeURIComponent(id)}`),
    getProfile: () => api('GET', '/me'),
    saveProfile: (changes) => api('PATCH', '/me', changes), // { name } and/or { avatar }
    async resetAll() {
      await api('DELETE', '/data');
      sessionStorage.clear();
    },
    async logout() {
      await api('POST', '/logout');
      sessionStorage.clear();
    },
  };
})();

const NAME_MAX = 24;

// First name, capitalized: "john smith" -> "John" for "Welcome back, John".
// ALL-CAPS input is normalized too ("JOHN" -> "John"), but mixed-case names
// like "McDonald" are kept as written.
function firstName(name) {
  let first = String(name || '').split(' ')[0];
  if (first && first === first.toUpperCase()) first = first.toLowerCase();
  return first.charAt(0).toUpperCase() + first.slice(1);
}

// Profile picture if set, otherwise the name's initials.
function avatarHtml(profile) {
  return profile.avatar ? `<img src="${profile.avatar}" alt="">` : escapeHtml(initials(profile.name));
}

// Used when a car has no location set (UofT Sandford Fleming Building).
const DEFAULT_LOCATION = "10 King's College Rd";

const POWERTRAINS = { electric: 'Electric', gas: 'Gas' };

// Cars saved before powertrains existed were all shown as electric;
// hybrids (no longer offered) have an engine, so they become gas.
function powertrainOf(car) {
  if (car.powertrain === 'hybrid') return 'gas';
  return POWERTRAINS[car.powertrain] ? car.powertrain : 'electric';
}

const BODY_TYPES = { sedan: 'Sedan', coupe: 'Coupe', suv: 'SUV', truck: 'Truck' };

function bodyTypeOf(car) {
  return BODY_TYPES[car.bodyType] ? car.bodyType : 'sedan';
}

// On/off state of each control (lock, climate, …) for this session, so changes —
// including ones made by the assistant — carry over between pages.
function controlState(carId) {
  return JSON.parse(sessionStorage.getItem(`ctl:${carId}`) || '{}');
}
function saveControlState(carId, control, on) {
  sessionStorage.setItem(`ctl:${carId}`, JSON.stringify({ ...controlState(carId), [control]: on }));
}

const rand = (min, max) => Math.round(min + Math.random() * (max - min));

// Gauge readings, re-rolled within realistic ranges each time the app is opened,
// then kept for the session so every page shows the same numbers.
// pct = battery %, km = estimated electric range (null for gas), fuel = estimated fuel %,
// oil = oil life %, psi = tire pressures [FL, FR, RL, RR],
// updatedAt = when the car last "reported in" (sometime in the past 24 hours).
function vehicleStats(car) {
  const key = `stats:${car.id}:${powertrainOf(car)}`;
  const cached = sessionStorage.getItem(key);
  if (cached) return JSON.parse(cached);

  const electric = powertrainOf(car) === 'electric';
  const pct = rand(30, 92);
  const kmPerPct = 4.2 + Math.random() * 1.4; // 420–560 km on a full charge
  const basePsi = electric ? 42 : 35;
  const stats = {
    pct,
    km: electric ? Math.round(pct * kmPerPct) : null,
    fuel: rand(20, 95),
    oil: rand(35, 95),
    psi: [0, 1, 2, 3].map(() => basePsi + rand(-2, 1)),
    updatedAt: Date.now() - rand(60e3, 24 * 3600e3),
  };
  sessionStorage.setItem(key, JSON.stringify(stats));
  return stats;
}

// "Updated 3 h 12 min ago"
function timeAgo(ts) {
  const min = Math.max(1, Math.round((Date.now() - ts) / 60e3));
  if (min < 60) return `${min} min ago`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `${h} h ${m} min ago` : `${h} h ago`;
}

function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
