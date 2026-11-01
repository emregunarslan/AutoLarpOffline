// Turns the phone's GPS coordinates into a street address for the car's location,
// using OpenStreetMap's free Nominatim service. Its usage policy asks for an
// identifying User-Agent, at most one request per second, and caching.
const NOMINATIM = 'https://nominatim.openstreetmap.org/reverse';
const USER_AGENT = 'AutoLarp/1.0 (https://github.com/zainaleem906/AutoLarp)';

const cache = new Map(); // "lat,lon" rounded to ~10 m -> address
let nextSlot = 0; // time the next request to Nominatim may go out

async function politeTurn() {
  const now = Date.now();
  const wait = Math.max(0, nextSlot - now);
  nextSlot = Math.max(now, nextSlot) + 1000;
  if (wait) await new Promise((r) => setTimeout(r, wait));
}

// "35 St. George Street, Toronto" — short enough for the 80-character location field.
function shortAddress(a = {}) {
  const street = [a.house_number, a.road || a.pedestrian || a.footway].filter(Boolean).join(' ');
  const place = a.city || a.town || a.village || a.suburb || a.county;
  return [street || a.neighbourhood || a.building, place].filter(Boolean).join(', ').slice(0, 80);
}

export function geocodeRoutes(app, { requireUser }) {
  app.get('/api/geocode', requireUser, async (req, res, next) => {
    try {
      const lat = Number(req.query.lat);
      const lon = Number(req.query.lon);
      if (!(Math.abs(lat) <= 90 && Math.abs(lon) <= 180)) return res.status(400).json({ error: 'Invalid coordinates' });

      const key = `${lat.toFixed(4)},${lon.toFixed(4)}`;
      if (!cache.has(key)) {
        await politeTurn();
        const url = `${NOMINATIM}?format=jsonv2&zoom=18&addressdetails=1&lat=${lat}&lon=${lon}`;
        const upstream = await fetch(url, {
          headers: { 'User-Agent': USER_AGENT, 'Accept-Language': req.get('accept-language') || 'en' },
          signal: AbortSignal.timeout(8000),
        });
        if (!upstream.ok) {
          console.error('Geocoding failed:', upstream.status);
          return res.status(502).json({ error: 'Couldn\'t look up that address' });
        }
        if (cache.size > 500) cache.delete(cache.keys().next().value);
        cache.set(key, shortAddress((await upstream.json()).address));
      }
      res.json({ address: cache.get(key) });
    } catch (err) {
      if (err.name === 'TimeoutError') return res.status(504).json({ error: 'Address lookup timed out' });
      next(err);
    }
  });
}
