// Custom garage gradient. Loaded in <head> on every page so the saved
// primary/secondary colours are applied before the first paint.
const COLORS_KEY = 'garage:colors';
const DEFAULT_COLORS = { primary: '#3e6ae1', secondary: '#8b5cf6' };
const GRADIENT_BASE = '#0c0d12';

const HEX_COLOR = /^#[0-9a-f]{6}$/i;

function colorRgb(color) {
  const n = parseInt(color.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function colorHex(rgb) {
  return '#' + rgb.map((c) => Math.max(0, Math.min(255, Math.round(c))).toString(16).padStart(2, '0')).join('');
}

function mixColor(a, b, weight) {
  const A = colorRgb(a);
  const B = colorRgb(b);
  return colorHex(A.map((c, i) => c * (1 - weight) + B[i] * weight));
}

function colorLuminance(color) {
  const channels = colorRgb(color).map((value) => {
    const c = value / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
}

// Keep the wallpaper dark enough for white text, whatever colours are picked.
function gradientEnd(color) {
  let out = mixColor(GRADIENT_BASE, color, 0.55);
  for (let i = 0; i < 8 && colorLuminance(out) > 0.18; i++) out = mixColor(out, GRADIENT_BASE, 0.38);
  return out;
}

// Very dark picks need a lighter accent so controls stay visible.
function readableAccent(color) {
  let out = color;
  for (let i = 0; i < 6 && colorLuminance(out) < 0.08; i++) out = mixColor(out, '#ffffff', 0.25);
  return out;
}

function normalizeColor(value, fallback) {
  const v = String(value ?? '').trim();
  return HEX_COLOR.test(v) ? v.toLowerCase() : fallback;
}

function getColors() {
  const fallback = { ...DEFAULT_COLORS };
  try {
    const saved = JSON.parse(localStorage.getItem(COLORS_KEY) || 'null');
    if (!saved || typeof saved !== 'object') return fallback;
    return {
      primary: normalizeColor(saved.primary, fallback.primary),
      secondary: normalizeColor(saved.secondary, fallback.secondary),
    };
  } catch {
    return fallback;
  }
}

// One pair of colours becomes the whole app palette, with a dark gradient
// built from the two picks.
function colorVars(colors) {
  const primary = normalizeColor(colors.primary, DEFAULT_COLORS.primary);
  const secondary = normalizeColor(colors.secondary, DEFAULT_COLORS.secondary);
  const accent = readableAccent(primary);
  return {
    '--bg': mixColor(GRADIENT_BASE, primary, 0.06),
    '--sheet': mixColor('#14151b', primary, 0.05),
    '--surface': mixColor('#1b1c23', primary, 0.07),
    '--surface-2': mixColor('#282932', secondary, 0.07),
    '--line': mixColor('#353640', secondary, 0.06),
    '--text': '#ffffff',
    '--text-2': '#c7c7cc',
    '--muted': '#9295a0',
    '--accent': accent,
    '--accent-text': colorLuminance(accent) > 0.45 ? '#0b0c10' : '#ffffff',
    '--radius': '24px',
    '--glow': `linear-gradient(155deg, ${gradientEnd(primary)} 0%, ${gradientEnd(secondary)} 100%)`,
  };
}

function applyColors(colors) {
  const primary = normalizeColor(colors.primary, DEFAULT_COLORS.primary);
  const secondary = normalizeColor(colors.secondary, DEFAULT_COLORS.secondary);
  const vars = colorVars({ primary, secondary });
  const root = document.documentElement;
  Object.entries(vars).forEach(([key, value]) => root.style.setProperty(key, value));
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', gradientEnd(primary));
  return { primary, secondary };
}

function saveColors(colors) {
  const saved = {
    primary: normalizeColor(colors.primary, DEFAULT_COLORS.primary),
    secondary: normalizeColor(colors.secondary, DEFAULT_COLORS.secondary),
  };
  try { localStorage.setItem(COLORS_KEY, JSON.stringify(saved)); } catch { /* storage can be blocked */ }
  applyColors(saved);
  return saved;
}

function resetColors() {
  try { localStorage.removeItem(COLORS_KEY); } catch { /* storage can be blocked */ }
  applyColors(DEFAULT_COLORS);
}

applyColors(getColors());
