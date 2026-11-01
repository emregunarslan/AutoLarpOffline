(async function () {
  const app = document.getElementById('app');
  const id = new URLSearchParams(location.search).get('id');
  const car = id && (await DB.getCar(id));
  if (!car) { location.replace('./'); return; }

  document.title = car.title;
  const type = powertrainOf(car);
  const { pct, km, fuel, oil, psi, updatedAt } = vehicleStats(car);
  const rear = trunkName(car);
  const place = car.location || DEFAULT_LOCATION;

  // [key, label, icon, onText, offText (null = one-shot), startsOn]
  const ALL = {
    lock: ['Lock', 'lock', 'Locked', 'Unlocked', true],
    climate: ['Climate', 'fan', 'Climate on', 'Climate off'],
    start: ['Remote Start', 'power', 'Engine started', 'Engine stopped'],
    trunk: [rear, 'trunk', `${rear} opened`, `${rear} closed`],
    charge: ['Charge Port', 'bolt', 'Charge port opened', 'Charge port closed'],
    charging: ['Charging', 'plug', 'Charging started', 'Charging stopped'],
    timer: ['Charge Timer', 'clock', 'Charge timer set', 'Charge timer off'],
    precond: ['Precondition', 'thermo', 'Preconditioning on', 'Preconditioning off'],
    defrost: ['Defrost', 'defrost', 'Defrost on', 'Defrost off'],
    seat: ['Heated Seats', 'seat', 'Heated seats on', 'Heated seats off'],
    seatcool: ['Cooled Seats', 'snow', 'Ventilated seats on', 'Ventilated seats off'],
    wheel: ['Heated Wheel', 'wheel', 'Heated steering wheel on', 'Heated steering wheel off'],
    windows: ['Windows', 'window', 'Windows opened', 'Windows closed'],
    sunroof: ['Sunroof', 'sunroof', 'Sunroof opened', 'Sunroof closed'],
    horn: ['Horn', 'horn', 'Horn sounded', null],
    flash: ['Lights', 'lights', 'Lights flashed', null],
    panic: ['Alarm', 'alarm', 'Alarm sounding', 'Alarm off'],
    locate: ['Find Vehicle', 'location', 'Vehicle location updated', null],
    garage: ['Garage Door', 'home', 'Garage door signal sent', null],
    valet: ['Valet Mode', 'valet', 'Valet Mode on', 'Valet Mode off'],
    ...SIGNATURE_FEATURES,
  };

  const theme = brandTheme(car.brand);
  const brandName = brandBySlug(car.brand).name;
  document.body.style.setProperty('--accent', theme.accent);

  // Buttons that move something physical; they lock out briefly after each press.
  const COOLDOWN_MS = 4000;
  const COOLDOWN = new Set(['lock', 'start', 'trunk', 'charge', 'windows', 'sunroof', ...SIGNATURE_COOLDOWN]);

  // Features shared by most luxury-brand apps, plus powertrain-specific ones.
  // Brand signature features lead; trucks swap the sunroof for bed lights.
  const COMMON = ['defrost', 'seat', 'seatcool', 'wheel', 'windows',
                  bodyTypeOf(car) === 'truck' ? 'bedlights' : 'sunroof',
                  'horn', 'flash', 'panic', 'locate', 'garage', 'valet'];
  const LAYOUT = {
    electric: { quick: ['lock', 'climate', 'charge', 'trunk'], grid: [...theme.features, 'charging', 'timer', 'precond', ...COMMON] },
    gas: { quick: ['lock', 'start', 'climate', 'trunk'], grid: [...theme.features, ...COMMON] },
  }[type];

  // Everything the car reports lives in one status card.
  const battery = (p) => `<span class="battery"><i style="width:${p}%"></i></span>`;
  const headline = type === 'electric'
    ? { icon: battery(pct), label: 'Estimated range', value: `${km} km` }
    : { icon: `<span class="gauge-ico">${ICONS.fuel}</span>`, label: 'Estimated fuel', value: `${fuel}%` };
  const ROWS = type === 'electric'
    ? [['Battery', `${pct}%`], ['Charge target', '80%']]
    : [['Oil life', `${oil}%`]];
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
        `<button class="quick-btn${ALL[k][4] ? ' on' : ''}" data-k="${k}" aria-label="${ALL[k][0]}">${ICONS[ALL[k][1]]}</button>`).join('')}
    </div>

    <section class="status-card">
      <div class="status-head"><span>Vehicle Status</span><span>Last updated ${timeAgo(updatedAt)}</span></div>
      <div class="status-main">
        <div class="status-ico">${headline.icon}</div>
        <div><div class="l">${headline.label}</div><div class="v">${headline.value}</div></div>
      </div>
      <div class="status-rows">
        ${ROWS.map(([l, v]) => row(l, v)).join('')}
        ${row('Status', '', 'status')}
        ${row('Location', escapeHtml(place))}
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
  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove('show'), 1600);
  }

  // Fills the button with colour that fades out; presses are ignored until it's gone.
  function startCooldown(btn) {
    btn.style.setProperty('--cooldown', `${COOLDOWN_MS}ms`);
    btn.classList.add('cooling');
    setTimeout(() => btn.classList.remove('cooling'), COOLDOWN_MS);
  }

  // What to say if a button is pressed again during its cooldown.
  function busyText(k, label, on) {
    if (k === 'lock') return on ? 'Locking… please wait' : 'Unlocking… please wait';
    if (k === 'start') return on ? 'Starting engine… please wait' : 'Stopping engine… please wait';
    return `${label} is still moving…`;
  }

  const statusEl = document.getElementById('status');
  const state = { lock: true, start: false };
  function renderStatus() {
    statusEl.textContent = `${state.start ? 'Engine running' : 'Parked'} · ${state.lock ? 'Locked' : 'Unlocked'}`;
  }
  renderStatus();

  app.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-k]');
    if (!btn) return;
    const k = btn.dataset.k;
    const [label, , onText, offText] = ALL[k];
    if (btn.classList.contains('cooling')) { toast(busyText(k, label, btn.classList.contains('on'))); return; }
    if (navigator.vibrate) navigator.vibrate(10);
    if (COOLDOWN.has(k)) startCooldown(btn);

    // One-shot actions flash briefly instead of staying on.
    if (offText === null) {
      btn.classList.add('on');
      setTimeout(() => btn.classList.remove('on'), 500);
      toast(onText);
      return;
    }
    const on = btn.classList.toggle('on');
    toast(on ? onText : offText);
    state[k] = on;

    if (k === 'lock') btn.innerHTML = on ? ICONS.lock : ICONS.unlock;
    if (k === 'lock' || k === 'start') renderStatus();
    if (k === 'climate') document.getElementById('climateLabel').textContent = `Interior · Climate ${on ? 'On' : 'Off'}`;
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
