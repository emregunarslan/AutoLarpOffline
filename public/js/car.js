(async function () {
  const app = document.getElementById('app');
  const id = new URLSearchParams(location.search).get('id');
  const car = id && (await DB.getCar(id));
  if (!car) { location.replace('./'); return; }

  document.title = car.title;
  document.body.dataset.vehicleId = car.id;
  const type = powertrainOf(car);
  const { pct, km, fuel, oil, psi, updatedAt } = vehicleStats(car);
  const place = car.location || DEFAULT_LOCATION;

  const ALL = controlDefs(car);

  const theme = brandTheme(car.brand);
  const brandName = brandBySlug(car.brand).name;
  document.body.style.setProperty('--accent', theme.accent);
  // Brand colours always take white control labels, whatever the theme's accent is.
  document.body.style.setProperty('--accent-text', '#ffffff');

  // Buttons that move something physical lock out briefly after each press.
  const COOLDOWN_MS = 4000;
  const COOLDOWN = new Set(COOLDOWN_CONTROLS);
  const LAYOUT = controlLayout(car);

  // Everything the car reports lives in one status card.
  const battery = (p) => `<span class="battery"><i style="width:${p}%"></i></span>`;
  const headline = type === 'electric'
    ? { icon: battery(pct), label: 'Estimated range', value: `${km} km` }
    : { icon: `<span class="gauge-ico">${ICONS.fuel}</span>`, label: 'Estimated fuel', value: `${fuel}%` };
  const ROWS = [
    ...(type === 'electric' ? [['Battery', `${pct}%`], ['Charge target', '80%']] : [['Oil life', `${oil}%`]]),
    ['Estimated value', formatCAD(carValue(car))],
  ];
  const row = (label, value, id = '') => `<div class="srow"><span>${label}</span><b${id ? ` id="${id}"` : ''}>${value}</b></div>`;

  const tire = (label, val) => `<div class="tire ${label.endsWith('Left') ? 'left' : 'right'}"><div class="v">${val}<small>psi</small></div><div class="l">${label}</div></div>`;

  app.innerHTML = `
    <a class="icon-btn back-btn" href="./" aria-label="Back">${ICONS.back}</a>
    <div class="car-head">
      <h1>${logoHtml(car.brand)}<span class="name">${escapeHtml(car.title)}</span></h1>
    </div>

    <div class="car-hero"><img src="${car.photo}" alt=""></div>
    <p class="desc-line">${[BODY_TYPES[bodyTypeOf(car)], car.description].filter(Boolean).map(escapeHtml).join(' · ')}</p>

    <div class="quick-row">
      ${LAYOUT.quick.map((k) =>
        `<button class="quick-btn" data-k="${k}" aria-label="${ALL[k][0]}">${ICONS[ALL[k][1]]}</button>`).join('')}
    </div>

    <section class="status-card">
      <div class="status-head"><span>Vehicle Status</span><span id="updatedAgo">Last updated ${timeAgo(updatedAt)}</span></div>
      <div class="status-main">
        <div class="status-ico">${headline.icon}</div>
        <div><div class="l">${headline.label}</div><div class="v">${headline.value}</div></div>
      </div>
      <div class="status-rows">
        ${ROWS.map(([l, v]) => row(l, v)).join('')}
        ${row('Status', '', 'status')}
        ${row('Location', escapeHtml(place), 'locationValue')}
      </div>
      <div class="tires-title">Tire Pressure</div>
      <div class="tires-grid">
        ${tire('Front Left', psi[0])}
        <div class="tires-car">${ICONS.carTop}</div>
        ${tire('Front Right', psi[1])}
        ${tire('Rear Left', psi[2])}
        ${tire('Rear Right', psi[3])}
      </div>
    </section>

    <div class="temp-card">
      <div><div class="label" id="climateLabel">Interior · Climate Off</div><div class="val"><span id="temp">21</span>°</div></div>
      <div class="steps"><button id="tdown" aria-label="Cooler">−</button><button id="tup" aria-label="Warmer">+</button></div>
    </div>

    <div class="brand-head">${logoHtml(car.brand)}<span>${escapeHtml(brandName)} Controls</span></div>
    <div class="control-wrap">
    <div class="brand-watermark" aria-hidden="true">${logoHtml(car.brand)}</div>
    <div class="control-grid">
      ${LAYOUT.grid.map((k) =>
        `<button class="ctrl" data-k="${k}">${ICONS[ALL[k][1]]}<span>${ALL[k][0]}</span></button>`).join('')}
    </div>
    </div>

  `;

  const toastEl = document.getElementById('toast');
  let toastTimer;
  function toast(msg, ms = 1600) {
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove('show'), ms);
  }

  // Fills the button with colour that fades out; presses are ignored until it's gone.
  function startCooldown(btn) {
    btn.style.setProperty('--cooldown', `${COOLDOWN_MS}ms`);
    btn.classList.add('cooling');
    setTimeout(() => btn.classList.remove('cooling'), COOLDOWN_MS);
  }

  // Find Vehicle: uses the phone's current position as the car's location —
  // looks up the street address, saves it, and updates the status card.
  function findVehicle(btn) {
    if (!navigator.geolocation) return toast('Location isn\'t available in this browser.', 3000);
    if (btn.classList.contains('on')) return; // already looking
    btn.classList.add('on');
    toast('Locating vehicle…', 15000);
    navigator.geolocation.getCurrentPosition(async ({ coords }) => {
      const lat = coords.latitude, lon = coords.longitude;
      let address = `${lat.toFixed(5)}, ${lon.toFixed(5)}`; // shown if the address lookup fails
      try {
        address = (await DB.api('GET', `/geocode?lat=${lat}&lon=${lon}`)).address || address;
      } catch { /* keep the coordinates */ }
      try {
        await DB.api('PATCH', `/cars/${encodeURIComponent(car.id)}/location`, { location: address, coords: { lat, lon } });
        car.location = address;
        document.getElementById('locationValue').textContent = address;
        document.getElementById('updatedAgo').textContent = 'Last updated just now';
        toast(`Vehicle located: ${address}`, 3500);
      } catch (err) {
        toast(err.message || 'Couldn\'t save the new location.', 3000);
      }
      btn.classList.remove('on');
    }, (err) => {
      btn.classList.remove('on');
      toast(err.code === err.PERMISSION_DENIED
        ? 'Location access is blocked. Allow it in your browser\'s site settings.'
        : 'Couldn\'t get your location. Try again.', 3500);
    }, { enableHighAccuracy: true, timeout: 15000, maximumAge: 30000 });
  }

  // What to say if a button is pressed again during its cooldown.
  function busyText(k, label, on) {
    if (k === 'lock') return on ? 'Locking… please wait' : 'Unlocking… please wait';
    if (k === 'start') return on ? 'Starting engine… please wait' : 'Stopping engine… please wait';
    return `${label} is still moving…`;
  }

  const statusEl = document.getElementById('status');
  const state = { lock: true, start: false, ...controlState(car.id) };
  function renderStatus() {
    statusEl.textContent = `${state.start ? 'Engine running' : 'Parked'} · ${state.lock ? 'Locked' : 'Unlocked'}`;
  }

  // Shows a control as on or off, plus anything that depends on it.
  function show(btn, k, on) {
    btn.classList.toggle('on', on);
    if (k === 'lock') btn.innerHTML = on ? ICONS.lock : ICONS.unlock;
    if (k === 'climate') document.getElementById('climateLabel').textContent = `Interior · Climate ${on ? 'On' : 'Off'}`;
  }

  // Runs a control: one-shot actions flash; others switch on/off and are remembered.
  function runControl(btn, k, on) {
    const [, , onText, offText] = ALL[k];
    if (COOLDOWN.has(k)) startCooldown(btn);
    if (k === 'locate') return findVehicle(btn);
    if (offText === null) {
      btn.classList.add('on');
      setTimeout(() => btn.classList.remove('on'), 500);
      toast(onText);
      return;
    }
    if (k === 'lock') window.SFX?.play();
    show(btn, k, on);
    toast(on ? onText : offText);
    state[k] = on;
    saveControlState(car.id, k, on);
    if (k === 'lock' || k === 'start') renderStatus();
  }

  // Restore what was switched on earlier this session.
  for (const btn of app.querySelectorAll('[data-k]')) {
    if (btn.dataset.k in state) show(btn, btn.dataset.k, state[btn.dataset.k]);
  }
  renderStatus();

  app.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-k]');
    if (!btn) return;
    const k = btn.dataset.k;
    if (btn.classList.contains('cooling')) { toast(busyText(k, ALL[k][0], btn.classList.contains('on'))); return; }
    if (navigator.vibrate) navigator.vibrate(10);
    runControl(btn, k, !btn.classList.contains('on'));
  });

  // Commands from the assistant for this car play out on the buttons.
  window.addEventListener('car-command', (e) => {
    const { vehicleId, control, on } = e.detail;
    const btn = vehicleId === car.id && app.querySelector(`[data-k="${control}"]`);
    if (btn) runControl(btn, control, on);
  });

  let temp = 21;
  const tempEl = document.getElementById('temp');
  const setTemp = (d) => {
    temp = Math.min(28, Math.max(15, temp + d));
    tempEl.textContent = temp;
  };
  document.getElementById('tdown').onclick = () => setTemp(-1);
  document.getElementById('tup').onclick = () => setTemp(1);
})();
