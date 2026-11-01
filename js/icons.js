// Inline SVG icons (stroke = currentColor).
const svg = (body, fill = false) =>
  `<svg viewBox="0 0 24 24" fill="${fill ? 'currentColor' : 'none'}" stroke="${fill ? 'none' : 'currentColor'}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`;

const ICONS = {
  back: svg('<path d="M15 5l-7 7 7 7"/>'),
  chev: svg('<path d="M9 5l7 7-7 7"/>'),
  plus: svg('<path d="M12 5v14M5 12h14"/>'),
  pencil: svg('<path d="M4 20h4L19 9l-4-4L4 16v4z"/><path d="M13.5 6.5l4 4"/>'),
  user: svg('<circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/>'),
  car: svg('<path d="M3 16v-3l2-5a2 2 0 012-1h10a2 2 0 012 1l2 5v3"/><path d="M3 13h18M3 16h18v2a1 1 0 01-1 1h-2a1 1 0 01-1-1v-1H7v1a1 1 0 01-1 1H4a1 1 0 01-1-1z"/><circle cx="7" cy="14.5" r=".6"/><circle cx="17" cy="14.5" r=".6"/>'),
  camera: svg('<path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="4"/>'),
  card: svg('<rect x="3" y="6" width="18" height="13" rx="2"/><path d="M3 10h18M7 15h3"/>'),
  bell: svg('<path d="M6 16V11a6 6 0 0112 0v5l2 2H4z"/><path d="M10 20a2 2 0 004 0"/>'),
  shield: svg('<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/>'),
  key: svg('<circle cx="8" cy="15" r="4"/><path d="M11 12l9-9M17 6l3 3M15 8l2 2"/>'),
  help: svg('<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 015 0c0 2-2.5 2-2.5 4M12 17h.01"/>'),

  // controls
  lock: svg('<rect x="5" y="11" width="14" height="10" rx="2" fill="currentColor" stroke="none"/><path d="M8 11V8a4 4 0 018 0v3"/>'),
  unlock: svg('<rect x="5" y="11" width="14" height="10" rx="2" fill="currentColor" stroke="none"/><path d="M8 11V8a4 4 0 017.5-2"/>'),
  fan: svg('<circle cx="12" cy="12" r="1.6"/><path d="M12 10.4C11 7 12 4 14.5 4S17 7.5 13.5 11M13.6 12c3.4-1 6.4 0 6.4 2.5S16.5 17 13 13.5M12 13.6c1 3.4 0 6.4-2.5 6.4S7 16.5 10.5 13M10.4 12C7 13 4 12 4 9.5S7.5 7 11 10.5"/>'),
  bolt: svg('<path d="M13 2L5 14h6l-1 8 8-12h-6z" fill="currentColor"/>'),
  power: svg('<path d="M12 3v8"/><path d="M6.5 6.5a8 8 0 1011 0"/>'),
  defrost: svg('<path d="M5 6c5-2 9-2 14 0M4 11c5-2 11-2 16 0"/><path d="M8 14v6M12 14v6M16 14v6"/>'),
  seat: svg('<path d="M8 3c-1 4-1 9 1 12h7l1 3"/><path d="M9 15l-1 6M14 3c-.5 1-.5 2 0 3s.5 2 0 3M17 3c-.5 1-.5 2 0 3s.5 2 0 3"/>'),
  wheel: svg('<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="2.5"/><path d="M3.5 10h6M14.5 10h6M12 14.5V21"/>'),
  window: svg('<path d="M4 18V9l6-5h10v14z"/><path d="M4 12h16"/><path d="M8 15h4" />'),
  trunk: svg('<path d="M3 17l2-6 3-2h8l3 2 2 6"/><path d="M16 9l2-4M3 17h18"/><circle cx="8" cy="17" r="2"/><circle cx="16" cy="17" r="2"/>'),
  plug: svg('<path d="M9 3v5M15 3v5M6 8h12v3a6 6 0 01-12 0zM12 17v4"/>'),
  horn: svg('<path d="M4 10v4h3l7 5V5L7 10z"/><path d="M17 9a4 4 0 010 6M19.5 6.5a8 8 0 010 11"/>'),
  lights: svg('<path d="M10 6c-4 0-6 2.5-6 6s2 6 6 6c1.5 0 2-1 2-6s-.5-6-2-6z"/><path d="M15 8h6M15 12h6M15 16h6"/>'),
  home: svg('<path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10"/><path d="M9 20v-5h6v5"/>'),
  valet: svg('<circle cx="12" cy="7" r="3"/><path d="M5 21v-2a7 7 0 0114 0v2"/><path d="M12 13v8"/>'),
  snow: svg('<path d="M12 2v20M4 7l16 10M20 7L4 17"/><path d="M9 3l3 2 3-2M9 21l3-2 3 2"/>'),
  fuel: svg('<path d="M5 21V5a2 2 0 012-2h6a2 2 0 012 2v16M3 21h14M7 8h6"/><path d="M15 10h2a1 1 0 011 1v5a1.5 1.5 0 003 0V8l-3-3"/>'),
  alarm: svg('<path d="M12 3L2 20h20z"/><path d="M12 10v4M12 17h.01"/>'),
  sunroof: svg('<rect x="4" y="4" width="16" height="16" rx="3"/><rect x="7.5" y="7.5" width="9" height="6" rx="1"/>'),
  thermo: svg('<path d="M10 4a2 2 0 014 0v10a4 4 0 11-4 0z"/><path d="M12 10v6"/>'),
  carTop: '<svg viewBox="0 0 40 80" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="6" y="3" width="28" height="74" rx="12"/><path d="M10 26c6-4 14-4 20 0l-2 10H12zM12 58h16l2 8c-6 3-14 3-20 0z"/><rect x="2" y="14" width="4" height="12" rx="1.5" fill="currentColor"/><rect x="34" y="14" width="4" height="12" rx="1.5" fill="currentColor"/><rect x="2" y="54" width="4" height="12" rx="1.5" fill="currentColor"/><rect x="34" y="54" width="4" height="12" rx="1.5" fill="currentColor"/></svg>',
  clock: svg('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>'),
  location: svg('<path d="M12 21s-7-6-7-11a7 7 0 0114 0c0 5-7 11-7 11z"/><circle cx="12" cy="10" r="2.5"/>'),
};
