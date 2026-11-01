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
  if (CUSTOM_LOGOS[b.slug]) return `<span class="${cls}">${CUSTOM_LOGOS[b.slug]}</span>`;
  return `<span class="${cls}"><img src="${logoUrl(b.slug)}" alt="${escapeHtml(b.name)}" loading="lazy"
    onerror="this.replaceWith(Object.assign(document.createElement('b'),{className:'fallback',textContent:'${initials(b.name)}'}))"></span>`;
}
