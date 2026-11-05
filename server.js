// AutoLarp server: serves the site from public/ and stores accounts + cars in a local JSON file.
import express from 'express';
import crypto from 'node:crypto';
import path from 'node:path';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';
import './public/js/brands.js';
import { openStore } from './store.js';
import { assistantRoutes } from './assistant.js';
import { ttsRoutes } from './tts.js';
import { geocodeRoutes } from './geocode.js';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT) || 8080;
const SESSION_DAYS = 30;
const scrypt = promisify(crypto.scrypt);

// ---------- Local storage: everything lives in data/autolarp.json ----------

// Optional API keys are read from .env only — nothing asks for them at startup.
for (const [name, feature] of [
  ['GEMINI_API_KEY', 'the AI assistant'],
  ['ELEVENLABS_API_KEY', "the assistant's voice replies"],
]) {
  if (!process.env[name]) console.log(`Optional: add ${name} to .env to enable ${feature} (see .env.example).`);
}

const store = await openStore(path.join(ROOT, 'data', 'autolarp.json'));

const users = store.collection('users');
const sessions = store.collection('sessions');
const cars = store.collection('cars');
await users.createIndex({ username: 1 }, { unique: true });
await sessions.createIndex({ tokenHash: 1 }, { unique: true });
await sessions.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
await cars.createIndex({ userId: 1, createdAt: 1 });

// ---------- Helpers ----------

const sha256 = (s) => crypto.createHash('sha256').update(s).digest('hex');

async function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
  const hash = (await scrypt(password, salt, 64)).toString('hex');
  return { salt, hash };
}

function parseCookies(req) {
  return Object.fromEntries((req.headers.cookie || '').split(';').map((c) => {
    const i = c.indexOf('=');
    return [c.slice(0, i).trim(), decodeURIComponent(c.slice(i + 1).trim())];
  }).filter(([k]) => k));
}

function setSessionCookie(req, res, token, maxAgeSec) {
  const secure = req.headers['x-forwarded-proto'] === 'https' ? '; Secure' : '';
  res.setHeader('Set-Cookie', `sid=${token}; HttpOnly; Path=/; Max-Age=${maxAgeSec}; SameSite=Lax${secure}`);
}

async function startSession(req, res, userId) {
  const token = crypto.randomBytes(32).toString('hex');
  await sessions.insertOne({
    tokenHash: sha256(token),
    userId,
    expiresAt: new Date(Date.now() + SESSION_DAYS * 864e5),
  });
  setSessionCookie(req, res, token, SESSION_DAYS * 86400);
}

// Simple in-memory brake on password guessing: 10 failures per 15 minutes.
const failures = new Map();
function tooManyFailures(key) {
  const f = failures.get(key);
  return f && f.count >= 10 && Date.now() - f.first < 15 * 60e3;
}
function recordFailure(key) {
  const f = failures.get(key);
  if (!f || Date.now() - f.first > 15 * 60e3) failures.set(key, { count: 1, first: Date.now() });
  else f.count++;
}

const USERNAME_RE = /^[a-zA-Z0-9_.]{3,20}$/;
const NAME_MAX = 24;
// Allowed brands = the picker's list in public/js/brands.js (one source of truth).
const BRANDS = new Set(globalThis.CarBrands.BRANDS.map((b) => b.slug));

// Returns a clean car object, or a string describing what's wrong.
// GPS position from "Use my current location", or null.
function validCoords(c) {
  const lat = Number(c?.lat), lon = Number(c?.lon);
  return c && Math.abs(lat) <= 90 && Math.abs(lon) <= 180 ? { lat: +lat.toFixed(6), lon: +lon.toFixed(6) } : null;
}

function validateCar(body) {
  const str = (v, max) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
  const car = {
    title: str(body.title, 40),
    description: str(body.description, 140),
    location: str(body.location, 80),
    coords: validCoords(body.coords),
    brand: str(body.brand, 30),
    powertrain: body.powertrain === 'gas' ? 'gas' : 'electric',
    bodyType: ['sedan', 'coupe', 'suv', 'truck'].includes(body.bodyType) ? body.bodyType : null,
    photo: typeof body.photo === 'string' ? body.photo : '',
  };
  if (!BRANDS.has(car.brand)) return 'Choose your car brand';
  if (!/^data:image\/jpeg;base64,/.test(car.photo)) return 'Add a photo of your vehicle';
  if (car.photo.length > 3_000_000) return 'Photo is too large';
  if (!car.bodyType) return 'Choose a body type';
  if (!car.title) return 'Give your vehicle a name';
  if (!car.location) return 'Enter where your vehicle is parked';
  return car;
}

const publicUser = ({ username, name, avatar }) => ({ username, name, avatar: avatar || null });
const publicCar = ({ _id, userId, ...car }) => car;

// ---------- App ----------

const app = express();
app.disable('x-powered-by');
app.use(express.json({ limit: '4mb' }));
app.use((req, res, next) => { req.body ??= {}; next(); });

// Wrap async handlers so errors become a 500 instead of crashing.
const route = (fn) => (req, res, next) => fn(req, res, next).catch(next);

// Login is deactivated: every request is signed in automatically as the single
// local user ("owner"), so the app works offline with no account screens.
let localUser;
async function requireUser(req, res, next) {
  const token = parseCookies(req).sid;
  const session = token && await sessions.findOne({ tokenHash: sha256(token), expiresAt: { $gt: new Date() } });
  const user = (session && await users.findOne({ _id: session.userId })) ?? (localUser ??= await getOrCreateLocalUser());
  if (!session) await startSession(req, res, user._id);
  req.user = user;
  next();
}

// The one local account, created on first use with an unguessable password so
// it can't be logged into by hand (the /api/login route stays but is unused).
async function getOrCreateLocalUser() {
  const salt = crypto.randomBytes(16).toString('hex');
  const existing = await users.findOne({ username: 'owner' });
  if (existing) return existing;
  const { hash } = await hashPassword(crypto.randomBytes(32).toString('hex'), salt);
  await users.insertOne({ username: 'owner', name: 'Owner', salt, hash, createdAt: new Date() });
  return users.findOne({ username: 'owner' });
}

app.post('/api/signup', route(async (req, res) => {
  const username = String(req.body.username || '').trim();
  const password = String(req.body.password || '');
  if (!USERNAME_RE.test(username)) return res.status(400).json({ error: 'Username must be 3–20 letters, numbers, _ or .' });
  if (password.length < 6 || password.length > 100) return res.status(400).json({ error: 'Password must be at least 6 characters' });
  const { salt, hash } = await hashPassword(password);
  try {
    const { insertedId } = await users.insertOne({
      username: username.toLowerCase(),
      name: username.slice(0, NAME_MAX),
      salt, hash,
      createdAt: new Date(),
    });
    await startSession(req, res, insertedId);
    res.json({ username: username.toLowerCase(), name: username.slice(0, NAME_MAX) });
  } catch (e) {
    if (e.code === 11000) return res.status(409).json({ error: 'That username is taken' });
    throw e;
  }
}));

app.post('/api/login', route(async (req, res) => {
  const username = String(req.body.username || '').trim().toLowerCase();
  const password = String(req.body.password || '');
  const key = `${req.ip}:${username}`;
  if (tooManyFailures(key)) return res.status(429).json({ error: 'Too many attempts. Try again in 15 minutes.' });
  const user = await users.findOne({ username });
  const ok = user && crypto.timingSafeEqual(
    Buffer.from((await hashPassword(password, user.salt)).hash, 'hex'),
    Buffer.from(user.hash, 'hex'),
  );
  if (!ok) {
    recordFailure(key);
    return res.status(401).json({ error: 'Wrong username or password' });
  }
  failures.delete(key);
  await startSession(req, res, user._id);
  res.json(publicUser(user));
}));

app.post('/api/logout', route(async (req, res) => {
  const token = parseCookies(req).sid;
  if (token) await sessions.deleteOne({ tokenHash: sha256(token) });
  setSessionCookie(req, res, '', 0);
  res.json({ ok: true });
}));

app.get('/api/me', requireUser, (req, res) => res.json(publicUser(req.user)));

// Updates the display name and/or profile picture (avatar: JPEG data URL, or null to remove).
app.patch('/api/me', requireUser, route(async (req, res) => {
  const set = {};
  if ('name' in req.body) set.name = String(req.body.name || '').trim().slice(0, NAME_MAX) || req.user.username;
  if ('avatar' in req.body) {
    const avatar = req.body.avatar;
    if (avatar !== null && !(typeof avatar === 'string' && /^data:image\/jpeg;base64,/.test(avatar))) {
      return res.status(400).json({ error: 'Profile picture must be a photo' });
    }
    if (avatar && avatar.length > 500_000) return res.status(400).json({ error: 'Profile picture is too large' });
    set.avatar = avatar;
  }
  await users.updateOne({ _id: req.user._id }, { $set: set });
  res.json(publicUser({ ...req.user, ...set }));
}));

// ?summary=1 leaves out photos (used by the assistant, which only needs the details).
app.get('/api/cars', requireUser, route(async (req, res) => {
  const projection = req.query.summary ? { photo: 0 } : {};
  const list = await cars.find({ userId: req.user._id }, { projection }).sort({ createdAt: 1 }).toArray();
  res.json(list.map(publicCar));
}));

app.get('/api/cars/:id', requireUser, route(async (req, res) => {
  const car = await cars.findOne({ userId: req.user._id, id: req.params.id });
  if (!car) return res.status(404).json({ error: 'Vehicle not found' });
  res.json(publicCar(car));
}));

app.post('/api/cars', requireUser, route(async (req, res) => {
  const car = validateCar(req.body);
  if (typeof car === 'string') return res.status(400).json({ error: car });
  const doc = { ...car, id: crypto.randomUUID(), userId: req.user._id, createdAt: Date.now() };
  await cars.insertOne(doc);
  res.json(publicCar(doc));
}));

// Find Vehicle: updates just the car's location (address + GPS) without resending the photo.
app.patch('/api/cars/:id/location', requireUser, route(async (req, res) => {
  const location = typeof req.body.location === 'string' ? req.body.location.trim().slice(0, 80) : '';
  const coords = validCoords(req.body.coords);
  if (!location || !coords) return res.status(400).json({ error: 'Send a location and coordinates' });
  const updated = await cars.findOneAndUpdate(
    { userId: req.user._id, id: req.params.id },
    { $set: { location, coords } },
    { returnDocument: 'after', projection: { photo: 0 } },
  );
  if (!updated) return res.status(404).json({ error: 'Vehicle not found' });
  res.json(publicCar(updated));
}));

app.put('/api/cars/:id', requireUser, route(async (req, res) => {
  const car = validateCar(req.body);
  if (typeof car === 'string') return res.status(400).json({ error: car });
  const updated = await cars.findOneAndUpdate(
    { userId: req.user._id, id: req.params.id },
    { $set: car },
    { returnDocument: 'after' },
  );
  if (!updated) return res.status(404).json({ error: 'Vehicle not found' });
  res.json(publicCar(updated));
}));

app.delete('/api/cars/:id', requireUser, route(async (req, res) => {
  await cars.deleteOne({ userId: req.user._id, id: req.params.id });
  res.json({ ok: true });
}));

// Reset All Data: removes the account's vehicles, profile picture and display name.
app.delete('/api/data', requireUser, route(async (req, res) => {
  await cars.deleteMany({ userId: req.user._id });
  await users.updateOne({ _id: req.user._id }, { $set: { name: req.user.username, avatar: null } });
  res.json({ ok: true });
}));

assistantRoutes(app, { requireUser, cars });
ttsRoutes(app, { requireUser });
geocodeRoutes(app, { requireUser });

app.use('/api', (req, res) => res.status(404).json({ error: 'Not found' }));
app.use(express.static(path.join(ROOT, 'public'), { extensions: ['html'] }));

app.use((err, req, res, next) => {
  if (err.type === 'entity.too.large') return res.status(413).json({ error: 'Photo is too large' });
  console.error(err);
  res.status(500).json({ error: 'Something went wrong' });
});

app.listen(PORT, (err) => {
  if (err) {
    console.error(err.code === 'EADDRINUSE'
      ? `Port ${PORT} is already in use by another program (an old "python3 -m http.server"?). Stop it and run npm start again.`
      : err);
    process.exit(1);
  }
  console.log(`AutoLarp running on http://localhost:${PORT}`);
});
