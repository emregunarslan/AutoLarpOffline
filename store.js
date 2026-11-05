// Local stand-in for MongoDB: stores the users, sessions and cars collections
// as JSON in a single file, so the whole app runs without any online database.
// Implements just the parts of the MongoDB API this server uses.
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

// "2026-11-04T12:00:00.000Z" and Date objects both become a comparable number.
const asTime = (v) => {
  if (v instanceof Date) return v.getTime();
  if (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(v)) return Date.parse(v);
  return v;
};

function matches(doc, query) {
  return Object.entries(query ?? {}).every(([key, want]) => {
    if (want && typeof want === 'object' && !Array.isArray(want)) {
      // Only operator used by the app: { expiresAt: { $gt: new Date() } }.
      return asTime(doc[key]) != null && asTime(want.$gt) < asTime(doc[key]);
    }
    return doc[key] !== undefined && String(doc[key]) === String(want);
  });
}

// Only projection form used by the app: { photo: 0 } leaves out listed fields.
function project(doc, projection) {
  const out = {};
  for (const key of Object.keys(doc)) {
    if (!projection || projection[key] !== 0) out[key] = doc[key];
  }
  return out;
}

export async function openStore(file) {
  fs.mkdirSync(path.dirname(file), { recursive: true });

  const docs = { users: [], sessions: [], cars: [] };
  const uniques = {}; // collection name -> unique field names
  const collections = {};

  try {
    Object.assign(docs, JSON.parse(fs.readFileSync(file, 'utf8')));
    for (const name of Object.keys(docs)) if (!Array.isArray(docs[name])) docs[name] = [];
  } catch (err) {
    if (err.code !== 'ENOENT') throw new Error(`Could not read ${file}: ${err.message}`);
  }

  // The sessions TTL index is emulated at load: expired sessions drop on restart.
  const now = Date.now();
  for (const name of Object.keys(docs)) {
    docs[name] = docs[name].filter((d) => d.expiresAt === undefined || asTime(d.expiresAt) > now);
  }

  function save() {
    fs.writeFileSync(file, JSON.stringify(docs, null, 1));
  }

  function assertUnique(name, doc, exceptId) {
    for (const field of uniques[name] ?? []) {
      if (!(field in doc)) continue;
      if ((docs[name] ?? []).some((d) => d._id !== exceptId && String(d[field]) === String(doc[field]))) {
        const e = new Error(`Duplicate ${field}`);
        e.code = 11000; // Mongo's duplicate-key code; the signup route checks for it
        throw e;
      }
    }
  }

  function collection(name) {
    const all = () => (docs[name] ??= []);

    return {
      async createIndex(spec, opts) {
        if (opts?.unique) uniques[name] ??= [];
        if (opts?.unique) uniques[name].unshift(Object.keys(spec)[0]);
      },
      async insertOne(doc) {
        doc = { ...doc, _id: doc._id ?? crypto.randomBytes(12).toString('hex') };
        assertUnique(name, doc);
        all().push(doc);
        save();
        return { insertedId: doc._id };
      },
      findOne(query, { projection } = {}) {
        const doc = all().find((d) => matches(d, query));
        return doc ? project(doc, projection) : null;
      },
      updateOne(query, { $set }) {
        const doc = all().find((d) => matches(d, query));
        if (!doc) return { matchedCount: 0 };
        Object.assign(doc, $set);
        assertUnique(name, doc, doc._id);
        save();
        return { matchedCount: 1 };
      },
      find(query, { projection } = {}) {
        return {
          sort() {
            return {
              toArray: () => all().filter((d) => matches(d, query))
                .sort((a, b) => asTime(a.createdAt) - asTime(b.createdAt))
                .map((d) => project(d, projection)),
            };
          },
        };
      },
      findOneAndUpdate(query, { $set }, { returnDocument, projection } = {}) {
        const doc = all().find((d) => matches(d, query));
        if (!doc) return null;
        const before = { ...doc };
        Object.assign(doc, $set);
        assertUnique(name, doc, doc._id);
        save();
        return project(returnDocument === 'after' ? doc : before, projection);
      },
      async deleteOne(query) {
        const before = all().length;
        docs[name] = all().filter((d) => !matches(d, query));
        if (docs[name].length !== before) save();
        return { deletedCount: before - docs[name].length };
      },
      async deleteMany(query) {
        const before = all().length;
        docs[name] = all().filter((d) => !matches(d, query));
        if (docs[name].length !== before) save();
        return { deletedCount: before - docs[name].length };
      },
    };
  }

  return { collection: (n) => (collections[n] ??= collection(n)) };
}
