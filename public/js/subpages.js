// Account screens (Payment Methods, Notifications, ...). They look real but are
// for show: switches remember their position on this device, and actions just
// confirm with a message.
const Subpages = (() => {
  const SETTINGS_KEY = 'account:settings';
  const settings = JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}');
  const isOn = (key, fallback) => (key in settings ? settings[key] : fallback);

  const row = (icon, title, sub = '', { action = '', chev = true, extra = '' } = {}) => `
    <button class="row"${action ? ` data-action="${action}"` : ''}>
      ${icon ? `<span class="ico">${ICONS[icon]}</span>` : ''}
      <div class="txt"><div class="t"><span>${title}</span></div>${sub ? `<div class="s">${sub}</div>` : ''}</div>
      ${extra}${chev ? `<span class="chev">${ICONS.chev}</span>` : ''}
    </button>`;

  const toggle = (key, title, sub, fallback) => `
    <label class="row switch-row">
      <div class="txt"><div class="t"><span>${title}</span></div>${sub ? `<div class="s">${sub}</div>` : ''}</div>
      <input type="checkbox" class="switch" data-setting="${key}"${isOn(key, fallback) ? ' checked' : ''}>
    </label>`;

  const group = (label, rows) => `${label ? `<div class="section-label">${label}</div>` : ''}<div class="group">${rows}</div>`;
  const dot = '<span class="status-dot"></span>';

  // What each action button "does".
  const ACTIONS = {
    addCard: 'Card scanner isn\'t available right now. Please try again later.',
    autopay: 'Auto-pay settings saved.',
    password: 'A password reset link has been sent to your email.',
    devices: 'You\'re only signed in on this device.',
    download: 'We\'re preparing your data. You\'ll get an email when it\'s ready.',
    roadside: 'Roadside assistance requested. An agent will call you shortly.',
    service: 'Service request sent. Your service centre will confirm a time.',
    chat: 'A support specialist will reply within a few minutes.',
    call: 'Connecting you to Owner Support…',
    help: 'Help Center is opening in a moment.',
  };

  const PAGES = {
    payment: {
      title: 'Payment Methods',
      // The card face shows the current profile name; it re-renders each time
      // the screen opens, so a name change shows up on the card right away.
      render: ({ name }) => `
        <div class="pay-card platinum"></div>
        ${group('Cards', row('card', 'Amex Platinum ending 1005', 'Default · Expires 11/30', { chev: false, extra: '<span class="pill">Default</span>' }) +
          row('plus', 'Add Payment Method', '', { action: 'addCard' }))}
        ${group('Billing', row('location', 'Billing Address', escapeHtml(DEFAULT_LOCATION), { action: 'autopay' }) +
          toggle('autopay', 'Auto-pay', 'Charging, fuel and service charges', true))}`,
    },
    notifications: {
      title: 'Notifications',
      render: () => `
        ${group('Vehicle', toggle('n_security', 'Security Alerts', 'Alarm, doors left open, unexpected movement', true) +
          toggle('n_status', 'Vehicle Status', 'Locked, unlocked, climate ready', true) +
          toggle('n_energy', 'Charging & Fuel', 'Charge complete, low range', true) +
          toggle('n_service', 'Service Reminders', 'Maintenance and inspections', true))}
        ${group('Account', toggle('n_updates', 'Software Updates', 'When a new update is ready to install', true) +
          toggle('n_offers', 'News & Offers', 'Events, accessories and promotions', false))}`,
    },
    preferences: {
      title: 'Preferences',
      render: () => `
        ${group('Sound', toggle('sfx', 'Sound Effects', 'Lock and unlock sounds', true))}`,
    },
    privacy: {
      title: 'Privacy & Security',
      render: () => `
        ${group('Security', toggle('p_2fa', 'Two-Factor Authentication', 'Ask for a code when signing in on a new device', true) +
          row('lock', 'Change Password', '', { action: 'password' }) +
          row('shield', 'Signed-In Devices', '1 device', { action: 'devices' }))}
        ${group('Privacy', toggle('p_location', 'Location Sharing', 'Needed for Find Vehicle and roadside help', true) +
          toggle('p_driving', 'Share Driving Data', 'Help improve vehicle features', false) +
          toggle('p_analytics', 'App Analytics', 'Anonymous usage statistics', false) +
          row('help', 'Download My Data', '', { action: 'download' }))}`,
    },
    support: {
      title: 'Support',
      render: () => `
        ${group('Get Help', row('alarm', 'Roadside Assistance', 'Available 24/7', { action: 'roadside' }) +
          row('wheel', 'Schedule Service', 'Book a visit or mobile service', { action: 'service' }) +
          row('bell', 'Chat with Support', 'Typically replies in minutes', { action: 'chat' }) +
          row('help', 'Call Owner Support', '', { action: 'call' }))}
        ${group('Learn', row('help', 'Help Center', 'Guides, videos and FAQs', { action: 'help' }))}
        <p class="app-version">Version 2.4.1</p>`,
    },
  };

  // The sliding screen is built once and reused.
  const el = document.createElement('section');
  el.className = 'subpage';
  el.setAttribute('role', 'dialog');
  el.innerHTML = `
    <div class="subpage-head">
      <button class="icon-btn back-btn" aria-label="Back">${ICONS.back}</button>
      <h2></h2><span></span>
    </div>
    <div class="subpage-body"></div>
    <div class="toast subpage-toast"></div>`;
  document.body.appendChild(el);
  const body = el.querySelector('.subpage-body');
  const toastEl = el.querySelector('.subpage-toast');
  let toastTimer;

  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove('show'), 2600);
  }

  function open(id, profile) {
    const page = PAGES[id];
    if (!page) return;
    el.querySelector('h2').textContent = page.title;
    body.innerHTML = page.render(profile);
    body.scrollTop = 0;
    toastEl.classList.remove('show');
    document.body.classList.add('subpage-open');
  }
  function close() {
    toastEl.classList.remove('show');
    document.body.classList.remove('subpage-open');
  }

  el.querySelector('.back-btn').onclick = close;
  body.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-action]');
    if (btn) toast(ACTIONS[btn.dataset.action]);
  });
  body.addEventListener('change', (e) => {
    const sw = e.target.closest('[data-setting]');
    if (!sw) return;
    settings[sw.dataset.setting] = sw.checked;
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  });

  return { open, PAGES };
})();
