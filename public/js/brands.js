// Brand list, alphabetical. Logos come from the Simple Icons CDN as white
// monochrome SVGs; brands the CDN doesn't have are drawn inline (see
// CUSTOM_LOGOS), also white to match the theme. If any logo can't load we
// fall back to the brand's initials.
const BRANDS = [
  { name: 'Acura', slug: 'acura' },
  { name: 'Alfa Romeo', slug: 'alfaromeo' },
  { name: 'Aston Martin', slug: 'astonmartin' },
  { name: 'Audi', slug: 'audi' },
  { name: 'Bentley', slug: 'bentley' },
  { name: 'BMW', slug: 'bmw' },
  { name: 'Bugatti', slug: 'bugatti' },
  { name: 'Buick', slug: 'buick' },
  { name: 'BYD', slug: 'byd' },
  { name: 'Cadillac', slug: 'cadillac' },
  { name: 'Chevrolet', slug: 'chevrolet' },
  { name: 'Chrysler', slug: 'chrysler' },
  { name: 'Dacia', slug: 'dacia' },
  { name: 'Dodge', slug: 'dodge' },
  { name: 'DS Automobiles', slug: 'dsautomobiles' },
  { name: 'Ferrari', slug: 'ferrari' },
  { name: 'Fiat', slug: 'fiat' },
  { name: 'Ford', slug: 'ford' },
  { name: 'Genesis', slug: 'genesis' },
  { name: 'GMC', slug: 'gmc' },
  { name: 'Honda', slug: 'honda' },
  { name: 'Hyundai', slug: 'hyundai' },
  { name: 'Infiniti', slug: 'infiniti' },
  { name: 'Jaguar', slug: 'jaguar' },
  { name: 'Jeep', slug: 'jeep' },
  { name: 'Kia', slug: 'kia' },
  { name: 'Koenigsegg', slug: 'koenigsegg' },
  { name: 'Lamborghini', slug: 'lamborghini' },
  { name: 'Land Rover', slug: 'landrover' },
  { name: 'Lexus', slug: 'lexus' },
  { name: 'Lincoln', slug: 'lincoln' },
  { name: 'Lotus', slug: 'lotus' },
  { name: 'Lucid', slug: 'lucid' },
  { name: 'Maserati', slug: 'maserati' },
  { name: 'Mazda', slug: 'mazda' },
  { name: 'McLaren', slug: 'mclaren' },
  { name: 'Mercedes', slug: 'mercedes' },
  { name: 'MG', slug: 'mg' },
  { name: 'Mini', slug: 'mini' },
  { name: 'Mitsubishi', slug: 'mitsubishi' },
  { name: 'Nissan', slug: 'nissan' },
  { name: 'NIO', slug: 'nio' },
  { name: 'Opel', slug: 'opel' },
  { name: 'Pagani', slug: 'pagani' },
  { name: 'Peugeot', slug: 'peugeot' },
  { name: 'Polestar', slug: 'polestar' },
  { name: 'Porsche', slug: 'porsche' },
  { name: 'Ram', slug: 'ram' },
  { name: 'Renault', slug: 'renault' },
  { name: 'Rimac', slug: 'rimacautomobili' },
  { name: 'Rivian', slug: 'rivian' },
  { name: 'Rolls-Royce', slug: 'rollsroyce' },
  { name: 'SEAT', slug: 'seat' },
  { name: 'Škoda', slug: 'skoda' },
  { name: 'Smart', slug: 'smart' },
  { name: 'Subaru', slug: 'subaru' },
  { name: 'Suzuki', slug: 'suzuki' },
  { name: 'Tesla', slug: 'tesla' },
  { name: 'Toyota', slug: 'toyota' },
  { name: 'Vauxhall', slug: 'vauxhall' },
  { name: 'VinFast', slug: 'vinfast' },
  { name: 'Volkswagen', slug: 'volkswagen' },
  { name: 'Volvo', slug: 'volvo' },
  { name: 'Xiaomi', slug: 'xiaomi' },
  { name: 'XPeng', slug: 'xpeng' },
  { name: 'Zeekr', slug: 'zeekr' },
].sort((a, b) => a.name.localeCompare(b.name, 'en', { sensitivity: 'base' }));

function brandBySlug(slug) {
  return BRANDS.find((b) => b.slug === slug) || { name: slug || '', slug: slug || '' };
}

// Logos not on the Simple Icons CDN, drawn inline in white to match the theme.
const CUSTOM_LOGOS = {
  mercedes: '<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="1.4"><circle cx="12" cy="12" r="10.3"/><path d="M12 1.7L13.4 11.2 21 17.2 12 13.6 3 17.2 10.6 11.2z" fill="#fff" stroke="none"/></svg>',
  dodge: '<svg viewBox="0 0 64 24"><text x="1" y="17.5" fill="#fff" font-size="15" font-weight="900" font-style="italic" textLength="42" lengthAdjust="spacingAndGlyphs">DODGE</text><path d="M51 5h4.5l-5 14H46zM57.5 5H62l-5 14h-4.5z" fill="#e0262e"/></svg>',
  landrover: '<svg viewBox="0 0 48 24"><ellipse cx="24" cy="12" rx="22.5" ry="10.5" fill="none" stroke="#fff" stroke-width="1.6"/><ellipse cx="24" cy="12" rx="19.5" ry="8" fill="none" stroke="#fff" stroke-width=".7"/><text x="24" y="14.3" fill="#fff" font-size="6.4" font-weight="800" text-anchor="middle" textLength="32" lengthAdjust="spacingAndGlyphs">LAND ROVER</text></svg>',
  genesis: '<svg viewBox="0 0 64 24" fill="none" stroke="#fff" stroke-width="1.6" stroke-linecap="round"><path d="M27.5 6h9l-1 8-3.5 4-3.5-4z" fill="#fff" stroke="none"/><path d="M25 7H3M25 10.5H7M25 14H12M39 7h22M39 10.5h18M39 14h13"/></svg>',
  lexus: '<svg viewBox="0 0 40 24" fill="none" stroke="#fff"><ellipse cx="20" cy="12" rx="18.5" ry="10.5" stroke-width="1.6"/><path d="M19 3.8L12.5 17.6H31" stroke-width="2.4" stroke-linejoin="round"/></svg>',
  rivian: '<svg viewBox="0 0 64 24"><text x="32" y="16.5" fill="#fff" font-size="13" font-weight="700" text-anchor="middle" textLength="60" lengthAdjust="spacing">RIVIAN</text></svg>',
  jaguar: '<svg viewBox="0 0 64 24"><text x="32" y="16.5" fill="#fff" font-size="13" font-weight="600" text-anchor="middle" textLength="60" lengthAdjust="spacing">JAGUAR</text></svg>',
  alfaromeo: '<svg viewBox="0 0 64 24"><text x="32" y="16.5" fill="#fff" font-size="11" font-weight="800" text-anchor="middle" textLength="60" lengthAdjust="spacing">ALFA ROMEO</text></svg>',
  buick: '<svg viewBox="0 0 64 24"><text x="32" y="16.5" fill="#fff" font-size="14" font-weight="700" text-anchor="middle" textLength="60" lengthAdjust="spacing">BUICK</text></svg>',
  gmc: '<svg viewBox="0 0 64 24"><text x="32" y="16.5" fill="#fff" font-size="14" font-weight="900" text-anchor="middle" textLength="40" lengthAdjust="spacing">GMC</text></svg>',
  lincoln: '<svg viewBox="0 0 64 24"><text x="32" y="16.5" fill="#fff" font-size="11" font-weight="600" text-anchor="middle" textLength="60" lengthAdjust="spacing">LINCOLN</text></svg>',
  lotus: '<svg viewBox="0 0 64 24"><text x="32" y="16.5" fill="#fff" font-size="13" font-weight="800" font-style="italic" text-anchor="middle" textLength="60" lengthAdjust="spacing">LOTUS</text></svg>',
  pagani: '<svg viewBox="0 0 64 24"><text x="32" y="16.5" fill="#fff" font-size="12" font-weight="600" text-anchor="middle" textLength="60" lengthAdjust="spacing">PAGANI</text></svg>',
  byd: '<svg viewBox="0 0 64 24"><text x="32" y="16.5" fill="#fff" font-size="14" font-weight="900" text-anchor="middle" textLength="40" lengthAdjust="spacing">BYD</text></svg>',
  nio: '<svg viewBox="0 0 64 24"><text x="32" y="16.5" fill="#fff" font-size="15" font-weight="800" text-anchor="middle" textLength="36" lengthAdjust="spacing">NIO</text></svg>',
  xpeng: '<svg viewBox="0 0 64 24"><text x="32" y="16.5" fill="#fff" font-size="14" font-weight="700" text-anchor="middle" textLength="54" lengthAdjust="spacing">XPENG</text></svg>',
  zeekr: '<svg viewBox="0 0 64 24"><text x="32" y="16.5" fill="#fff" font-size="13" font-weight="900" text-anchor="middle" textLength="50" lengthAdjust="spacing">ZEEKR</text></svg>',
  vinfast: '<svg viewBox="0 0 64 24"><text x="32" y="16.5" fill="#fff" font-size="11" font-weight="800" font-style="italic" text-anchor="middle" textLength="58" lengthAdjust="spacing">VINFAST</text></svg>',
};

function logoUrl(slug) {
  return `https://cdn.simpleicons.org/${slug}/ffffff`;
}

function initials(name) {
  return name.split(/[\s-]+/).map((w) => w[0]).join('').slice(0, 2).toUpperCase();
}

// Returns HTML for a brand logo; swaps to initials if the image fails.
function logoHtml(slug, cls = 'logo') {
  const b = brandBySlug(slug);
  const custom = CUSTOM_LOGOS[b.slug];
  if (custom) return `<span class="${cls}${custom.includes('0 0 24 24') ? '' : ' wide'}">${custom}</span>`;
  return `<span class="${cls}"><img src="${logoUrl(b.slug)}" alt="${escapeHtml(b.name)}" loading="lazy"
    onerror="this.replaceWith(Object.assign(document.createElement('b'),{className:'fallback',textContent:'${initials(b.name)}'}))"></span>`;
}
