// One-off: erase the baked-in "C F FROST" cardholder print from
// public/amexplat.png (1536x969, 8-bit indexed PNG) so the app can draw the
// user's name in that spot instead. Patches dark pixels with clean metal from
// just above, then re-encodes the PNG. Prints the text bbox in card %.
import { readFileSync, writeFileSync } from 'node:fs';
import { inflateSync, deflateSync, crc32 } from 'node:zlib';

const PATH_IN = 'public/amexplat.png';
const PATH_OUT = PATH_IN;
const buf = readFileSync(PATH_IN);

// ---- parse chunks ----
let off = 8;
const chunks = [];
while (off < buf.length) {
  const len = buf.readUInt32BE(off);
  const type = buf.toString('latin1', off + 4, off + 8);
  const data = buf.subarray(off + 8, off + 8 + len);
  chunks.push({ type, len, data });
  off += 12 + len;
}
const ihdr = chunks.find((c) => c.type === 'IHDR').data;
const w = ihdr.readUInt32BE(0), h = ihdr.readUInt32BE(4);
const bitDepth = ihdr[8], colorType = ihdr[9], interlace = ihdr[12];
if (bitDepth !== 8 || colorType !== 3 || interlace !== 0) throw new Error(`Unsupported PNG: ${bitDepth}/${colorType}/${interlace}`);
console.log(`input: ${w}x${h} indexed`);

const plte = chunks.find((c) => c.type === 'PLTE').data;
const palette = [];
for (let i = 0; i < plte.length; i += 3) palette.push([plte[i], plte[i + 1], plte[i + 2]]);

// ---- decode ----
const idat = Buffer.concat(chunks.filter((c) => c.type === 'IDAT').map((c) => c.data));
const raw = inflateSync(idat);
const stride = w; // 1 byte per pixel for 8-bit indexed
if (raw.length !== (stride + 1) * h) throw new Error(`unexpected raw size ${raw.length}`);
const rows = [];
for (let y = 0; y < h; y++) rows.push(raw.subarray(y * (stride + 1), (y + 1) * (stride + 1)));
const px = Buffer.alloc(w * h);
const recon = Buffer.alloc(stride + 1); // scratch row per reconstruction
const prevRow = Buffer.alloc(stride);
for (let y = 0; y < h; y++) {
  recon[0] = 0; // we'll write filter 0 out
  const ft = rows[y][0];
  for (let x = 0; x < stride; x++) {
    const a = x ? recon[x] : 0;
    const b = prevRow[x];
    const c = x ? prevRow[x - 1] : 0;
    let v = rows[y][x + 1];
    if (ft === 1) v += a;
    else if (ft === 2) v += b;
    else if (ft === 3) v += (a + b) >> 1;
    else if (ft === 4) {
      const p = a + b - c, pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c);
      v += pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
    }
    recon[x] = v;
  }
  px.set(recon.subarray(0, stride), y * stride);
  prevRow.set(recon.subarray(0, stride));
}

const luma = (x, y) => {
  const [r, g, b] = palette[px[y * w + x]];
  return 0.299 * r + 0.587 * g + 0.114 * b;
};

// ---- find the dark cardholder print in the bottom-left quadrant ----
const RX0 = 100, RX1 = 800, RY0 = 740, RY1 = 930; // region of the card with the cardholder name
let x0 = w, y0 = h, x1 = 0, y1 = 0, found = 0;
for (let y = RY0; y <= RY1; y++) {
  for (let x = RX0; x <= RX1; x++) {
    if (luma(x, y) < 128) { found++; if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  }
}
if (!found) throw new Error('no cardholder print found in the region');
x0 = Math.max(1, x0 - 4); x1 = Math.min(w - 2, x1 + 4);
y0 = Math.max(1, y0 - 4); y1 = Math.min(h - 2, y1 + 4);
console.log(`print bbox: x ${x0}..${x1} y ${y0}..${y1} (${found} dark px)`);

// ---- patch: copy a clean band of metal from directly above the print ----
const ph = y1 - y0 + 1;
const srcY0 = y1 - ph - 8; // band above, clear of the text
if (srcY0 < 0) throw new Error('no clean band above');
for (let y = y0; y <= y1; y++) {
  const sy = y - ph - 8;
  for (let x = x0; x <= x1; x++) {
    // only where either the print (or its antialiased edge) sits
    if (luma(x, y) < 210) px[y * w + x] = px[sy * w + x];
  }
}

// ---- re-encode (all rows filter type 0) ----
const out = Buffer.alloc(h * (stride + 1));
for (let y = 0; y < h; y++) {
  out[y * (stride + 1)] = 0;
  px.copy(out, y * (stride + 1) + 1, y * stride, (y + 1) * stride);
}
const newIdat = deflateSync(out.subarray(0, h * (stride + 1)), { level: 9 });

const sig = buf.subarray(0, 8);
const parts = [sig];
for (const c of chunks) {
  if (c.type === 'IDAT' || c.type === 'IEND') continue;
  const head = Buffer.alloc(8);
  head.writeUInt32BE(c.len, 0);
  head.write(c.type, 4, 'latin1');
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([Buffer.from(c.type, 'latin1'), c.data])) >>> 0, 0);
  parts.push(head, c.data, crc);
}
const idatHead = Buffer.alloc(8);
idatHead.writeUInt32BE(newIdat.length, 0);
idatHead.write('IDAT', 4, 'latin1');
const idatCrc = Buffer.alloc(4);
idatCrc.writeUInt32BE(crc32(Buffer.concat([Buffer.from('IDAT', 'latin1'), newIdat])) >>> 0, 0);
parts.push(idatHead, newIdat, idatCrc, Buffer.from([0, 0, 0, 0]) /* IEND: len 0 */);
parts.push(Buffer.from('IEND', 'latin1'), Buffer.alloc(4));
writeFileSync(PATH_OUT, Buffer.concat(parts));
console.log(`written: ${Buffer.concat(parts).length} bytes`);

// ---- verify: reload and confirm the region is clean ----
const check = readFileSync(PATH_OUT);
let o = 8; const idats = []; let wid, hgt;
while (o < check.length) {
  const len = check.readUInt32BE(o);
  const type = check.toString('latin1', o + 4, o + 8);
  if (type === 'IHDR') { wid = check.readUInt32BE(o + 8); hgt = check.readUInt32BE(o + 12); }
  if (type === 'IDAT') idats.push(check.subarray(o + 8, o + 8 + len));
  o += 12 + len;
}
const raw2 = inflateSync(Buffer.concat(idats));
if (raw2.length !== (wid + 1) * hgt) throw new Error('verify: raw size mismatch');
const pr = Buffer.alloc(wid * hgt);
const prPrev = Buffer.alloc(wid);
for (let y = 0; y < hgt; y++) {
  const ft = raw2[y * (wid + 1)];
  for (let x = 0; x < wid; x++) {
    const a = x ? pr[y * wid + x - 1] : 0;
    const b = y ? prPrev[x] : 0;
    const c = x && y ? prPrev[x - 1] : 0;
    let v = raw2[y * (wid + 1) + 1 + x];
    if (ft === 1) v += a;
    else if (ft === 2) v += b;
    else if (ft === 3) v += (a + b) >> 1;
    else if (ft === 4) {
      const pp = a + b - c, pa = Math.abs(pp - a), pb = Math.abs(pp - b), pc = Math.abs(pp - c);
      v += pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
    }
    pr[y * wid + x] = v;
  }
  prPrev.set(pr.subarray(y * wid, (y + 1) * wid));
}
const lad = (x, y) => {
  const [r, g, b] = palette[pr[y * wid + x]];
  return 0.299 * r + 0.587 * g + 0.114 * b;
};
let residue = 0;
for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) if (lad(x, y) < 200) residue++;
console.log(`verify: image ${wid}x${hgt}, dark residue in patched area: ${residue}`);

// ---- CSS-friendly position of where the printed name was ----
const cardH = 1536 / 1.586; // aspect-ratio: 1.586 card
console.log(`name spot in % -> left: ${(x0 / wid * 100).toFixed(1)}%, bottom: ${((1 - y1 / hgt) * 100).toFixed(1)}% to bottom ${((1 - y0 / hgt) * 100).toFixed(1)}%, height ${(ph / hgt * 100).toFixed(1)}%`);
