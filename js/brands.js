// Brand list. Logos come from the Simple Icons CDN as white monochrome SVGs;
// if a logo can't load we fall back to the brand's initials.
const BRANDS = [
  { name: 'Tesla', slug: 'tesla' },
  { name: 'Porsche', slug: 'porsche' },
  { name: 'Ferrari', slug: 'ferrari' },
  { name: 'Lamborghini', slug: 'lamborghini' },
  { name: 'McLaren', slug: 'mclaren' },
  { name: 'Rolls-Royce', slug: 'rollsroyce' },
  { name: 'Bentley', slug: 'bentley' },
  { name: 'Aston Martin', slug: 'astonmartin' },
  { name: 'Bugatti', slug: 'bugatti' },
  { name: 'Maserati', slug: 'maserati' },
  { name: 'Mercedes', slug: 'mercedes' },
  { name: 'BMW', slug: 'bmw' },
  { name: 'Audi', slug: 'audi' },
  { name: 'Lexus', slug: 'lexus' },
  { name: 'Cadillac', slug: 'cadillac' },
  { name: 'Lucid', slug: 'lucid' },
  { name: 'Rivian', slug: 'rivian' },
  { name: 'Polestar', slug: 'polestar' },
  { name: 'Land Rover', slug: 'landrover' },
  { name: 'Jaguar', slug: 'jaguar' },
  { name: 'Volvo', slug: 'volvo' },
  { name: 'Genesis', slug: 'genesis' },
  { name: 'Toyota', slug: 'toyota' },
  { name: 'Honda', slug: 'honda' },
  { name: 'Ford', slug: 'ford' },
  { name: 'Chevrolet', slug: 'chevrolet' },
  { name: 'Dodge', slug: 'dodge' },
  { name: 'Jeep', slug: 'jeep' },
  { name: 'Nissan', slug: 'nissan' },
  { name: 'Hyundai', slug: 'hyundai' },
  { name: 'Kia', slug: 'kia' },
  { name: 'Mazda', slug: 'mazda' },
  { name: 'Subaru', slug: 'subaru' },
  { name: 'Volkswagen', slug: 'volkswagen' },
];

function brandBySlug(slug) {
  return BRANDS.find((b) => b.slug === slug) || { name: slug || '', slug: slug || '' };
}

// Logos not on Simple Icons, drawn inline.
const CUSTOM_LOGOS = {
  mercedes: '<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="1.4"><circle cx="12" cy="12" r="10.3"/><path d="M12 1.7L13.4 11.2 21 17.2 12 13.6 3 17.2 10.6 11.2z" fill="#fff" stroke="none"/></svg>',
  dodge: '<svg viewBox="0 0 64 24"><text x="1" y="17.5" fill="#fff" font-size="15" font-weight="900" font-style="italic" textLength="42" lengthAdjust="spacingAndGlyphs">DODGE</text><path d="M51 5h4.5l-5 14H46zM57.5 5H62l-5 14h-4.5z" fill="#e0262e"/></svg>',
  landrover: '<svg viewBox="0 0 48 24"><ellipse cx="24" cy="12" rx="22.5" ry="10.5" fill="none" stroke="#fff" stroke-width="1.6"/><ellipse cx="24" cy="12" rx="19.5" ry="8" fill="none" stroke="#fff" stroke-width=".7"/><text x="24" y="14.3" fill="#fff" font-size="6.4" font-weight="800" text-anchor="middle" textLength="32" lengthAdjust="spacingAndGlyphs">LAND ROVER</text></svg>',
  genesis: '<svg viewBox="0 0 64 24" fill="none" stroke="#fff" stroke-width="1.6" stroke-linecap="round"><path d="M27.5 6h9l-1 8-3.5 4-3.5-4z" fill="#fff" stroke="none"/><path d="M25 7H3M25 10.5H7M25 14H12M39 7h22M39 10.5h18M39 14h13"/></svg>',
  lexus: '<svg viewBox="0 0 40 24" fill="none" stroke="#fff"><ellipse cx="20" cy="12" rx="18.5" ry="10.5" stroke-width="1.6"/><path d="M19 3.8L12.5 17.6H31" stroke-width="2.4" stroke-linejoin="round"/></svg>',
  rivian: '<svg viewBox="0 0 64 24"><text x="32" y="16.5" fill="#fff" font-size="13" font-weight="700" text-anchor="middle" textLength="60" lengthAdjust="spacing">RIVIAN</text></svg>',
  jaguar: '<svg viewBox="0 0 64 24"><text x="32" y="16.5" fill="#fff" font-size="13" font-weight="600" text-anchor="middle" textLength="60" lengthAdjust="spacing">JAGUAR</text></svg>',
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
