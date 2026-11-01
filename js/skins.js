// Appearance themes for the whole app. Loaded in <head> on every page so the
// chosen palette is in place before the first paint.
const SKIN_KEY = 'garage:skin';

const SKINS = [
  {
    id: 'midnight', name: 'Midnight', blurb: 'Graphite & electric blue', mode: 'dark',
    vars: {
      '--bg': '#17181b', '--sheet': '#1c1d20', '--surface': '#222327', '--surface-2': '#2c2d32',
      '--line': '#303136', '--text': '#ffffff', '--text-2': '#c7c7cc', '--muted': '#8e8e93',
      '--accent': '#3e6ae1', '--accent-text': '#ffffff', '--radius': '24px', '--glow': 'none',
    },
  },
  {
    id: 'neon', name: 'Neon', blurb: 'Ultraviolet after dark', mode: 'dark',
    vars: {
      '--bg': '#0d0716', '--sheet': '#150b23', '--surface': '#1e1130', '--surface-2': '#2a1744',
      '--line': '#36204f', '--text': '#f7f0ff', '--text-2': '#d8c8ec', '--muted': '#a291bd',
      '--accent': '#b06bff', '--accent-text': '#14061f', '--radius': '26px',
      '--glow': 'radial-gradient(120% 60% at 50% -10%, rgba(150,80,255,.4), rgba(13,7,22,0) 60%), radial-gradient(90% 55% at 100% 105%, rgba(40,190,255,.18), transparent 65%)',
    },
  },
  {
    id: 'verdant', name: 'Verdant', blurb: 'Deep forest & jade', mode: 'dark',
    vars: {
      '--bg': '#04140f', '--sheet': '#071b14', '--surface': '#0c261d', '--surface-2': '#123428',
      '--line': '#1b4434', '--text': '#effcf6', '--text-2': '#bfe3d6', '--muted': '#7fa79a',
      '--accent': '#2ad39a', '--accent-text': '#03251c', '--radius': '20px',
      '--glow': 'radial-gradient(110% 55% at 15% -5%, rgba(42,211,154,.22), transparent 60%), radial-gradient(80% 50% at 100% 100%, rgba(0,120,90,.25), transparent 70%)',
    },
  },
  {
    id: 'dusk', name: 'Dusk', blurb: 'Navy sky & sunset amber', mode: 'dark',
    vars: {
      '--bg': '#06111f', '--sheet': '#081624', '--surface': '#0d2036', '--surface-2': '#142c47',
      '--line': '#1e3b5b', '--text': '#f2f7ff', '--text-2': '#c3d6ea', '--muted': '#8ba3bd',
      '--accent': '#ff9146', '--accent-text': '#211005', '--radius': '24px',
      '--glow': 'radial-gradient(120% 65% at 85% -10%, rgba(255,145,70,.32), transparent 60%), radial-gradient(90% 60% at 0% 100%, rgba(40,130,255,.22), transparent 70%)',
    },
  },
  {
    id: 'ember', name: 'Ember', blurb: 'Warm porcelain & burnt orange', mode: 'light',
    vars: {
      '--bg': '#f8f1ea', '--sheet': '#fffaf5', '--surface': '#ffffff', '--surface-2': '#f3e7db',
      '--line': '#e6d6c6', '--text': '#231711', '--text-2': '#6d574a', '--muted': '#967e6f',
      '--accent': '#d9501f', '--accent-text': '#ffffff', '--radius': '26px',
      '--glow': 'radial-gradient(100% 55% at 100% 0%, rgba(255,132,64,.2), transparent 60%), radial-gradient(90% 50% at 0% 10%, rgba(255,196,120,.25), transparent 70%)',
    },
  },
  {
    id: 'frost', name: 'Frost', blurb: 'Cool daylight & cobalt', mode: 'light',
    vars: {
      '--bg': '#edf2f7', '--sheet': '#ffffff', '--surface': '#ffffff', '--surface-2': '#e4ebf2',
      '--line': '#d3dee9', '--text': '#101c28', '--text-2': '#4d6072', '--muted': '#77899b',
      '--accent': '#0f6fe6', '--accent-text': '#ffffff', '--radius': '22px',
      '--glow': 'radial-gradient(100% 55% at 100% 0%, rgba(15,123,255,.14), transparent 60%), radial-gradient(80% 50% at 0% 100%, rgba(120,200,255,.2), transparent 70%)',
    },
  },
];

const DEFAULT_SKIN = 'midnight';

function skinById(id) {
  return SKINS.find((s) => s.id === id) || SKINS[0];
}

function getSkinId() {
  try {
    const id = localStorage.getItem(SKIN_KEY);
    return id && SKINS.some((s) => s.id === id) ? id : DEFAULT_SKIN;
  } catch {
    return DEFAULT_SKIN;
  }
}

function applySkin(id) {
  const skin = skinById(id);
  const root = document.documentElement;
  Object.entries(skin.vars).forEach(([key, value]) => root.style.setProperty(key, value));
  root.dataset.skin = skin.id;
  root.dataset.mode = skin.mode;
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', skin.vars['--bg']);
  return skin;
}

function setSkin(id) {
  const skin = skinById(id);
  try { localStorage.setItem(SKIN_KEY, skin.id); } catch { /* storage may be blocked */ }
  return applySkin(skin.id);
}

function resetSkin() {
  try { localStorage.removeItem(SKIN_KEY); } catch { /* storage may be blocked */ }
  applySkin(DEFAULT_SKIN);
}

applySkin(getSkinId());
