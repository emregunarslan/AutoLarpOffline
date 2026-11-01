// One-off analysis: locate the dark cardholder print in the pristine card PNG.
import { readFileSync } from 'node:fs';
import { inflateSync } from 'node:zlib';

const buf = readFileSync('amexplat.png');
let off = 8;
const idat = [];
let palette = [];
let w, h;
while (off < buf.length) {
  const len = buf.readUInt32BE(off);
  const type = buf.toString('latin1', off + 4, off + 8);
  const data = buf.subarray(off + 8, off + 8 + len);
  if (type === 'IHDR') { w = data.readUInt32BE(0); h = data.readUInt32BE(4); }
  if (type === 'PLTE') {
    for (let i = 0; i < data.length; i += 3) palette.push([data[i], data[i + 1], data[i + 2]]);
  }
  if (type === 'IDAT') idat.push(data);
  off += 12 + len;
}
console.log(`${w}x${h}, palette entries: ${palette.length}`);
const raw = inflateSync(Buffer.concat(idat));
const stride = w;
const rows = [];
for (let y = 0; y < h; y++) rows.push(raw.subarray(y * (stride + 1), (y + 1) * (stride + 1)));
const px = Buffer.alloc(w * h);
const recon = Buffer.alloc(stride);
const prev = Buffer.alloc(stride);
for (let y = 0; y < h; y++) {
  const ft = rows[y][0];
  for (let x = 0; x < stride; x++) {
    const a = x ? recon[x - 1] : 0;
    const b = prev[x];
    const c = x ? prev[x - 1] : 0;
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
  px.set(recon, y * stride);
  prev.set(recon);
}
const L = (x, y) => {
  const [r, g, b] = palette[px[y * w + x]];
  return 0.299 * r + 0.587 * g + 0.114 * b;
};

// ASCII map: rows 640..968 (bottom-left third), luma buckets
for (let y = 640; y < h; y += 6) {
  let line = '';
  for (let x = 60; x < 1000; x += 10) {
    const l = L(x, y);
    line += l < 120 ? '#' : l < 170 ? '+' : l < 210 ? '.' : ' ';
  }
  if (line.trim()) console.log(String(y).padStart(4), line);
}

// histogram of luma in the candidate name area
let n = 0, minL = 255, maxL = 0, sum = 0;
for (let y = 780; y < 900; y++) for (let x = 100; x < 620; x++) {
  const l = L(x, y); n++; sum += l; if (l < minL) minL = l; if (l > maxL) maxL = l;
}
console.log(`area x100-620 y780-900: n=${n} min=${minL.toFixed(0)} max=${maxL.toFixed(0)} avg=${(sum / n).toFixed(1)}`);
