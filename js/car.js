(async function () {
  const app = document.getElementById('app');
  const id = new URLSearchParams(location.search).get('id');
  const car = id && (await DB.getCar(id));
  if (!car) { location.replace('index.html'); return; }

  document.title = car.title;
  const type = powertrainOf(car);
  const { pct, fuel, oil, km, psi } = fakeRange(car);
  const place = car.location || DEFAULT_LOCATION;

  // [key, label, icon, onText, offText (null = one-shot), startsOn]
  const ALL = {
    lock: ['Lock', 'lock', 'Locked', 'Unlocked', true],
    climate: ['Climate', 'fan', 'Climate on', 'Climate off'],
    start: ['Remote Start', 'power', 'Engine started', 'Engine stopped'],
    trunk: ['Trunk', 'trunk', 'Trunk opened', 'Trunk closed'],
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
  };

  // Features shared by most luxury-brand apps, plus powertrain-specific ones.
  const COMMON = ['defrost', 'seat', 'seatcool', 'wheel', 'windows', 'sunroof',
                  'horn', 'flash', 'panic', 'locate', 'garage', 'valet'];
  const LAYOUT = {
    electric: { quick: ['lock', 'climate', 'charge', 'trunk'], grid: ['charging', 'timer', 'precond', ...COMMON] },
    gas: { quick: ['lock', 'start', 'climate', 'trunk'], grid: COMMON },
  }[type];

  const VITALS = {
    electric: [['Battery', `${pct}%`], ['Charge Target', '80%']],
    gas: [['Fuel', `${fuel}%`], ['Oil Life', `${oil}%`]],
  }[type];

  // Only the electric side gets a range estimate; fuel is shown as a percentage.
  const battery = (p) => `<span class="battery"><i style="width:${p}%"></i></span>`;
  const fuelGauge = `<span class="gauge-ico">${ICONS.fuel}</span>${fuel}%`;
  const gauge = {
    electric: `${battery(pct)}${km} km`,
    gas: fuelGauge,
  }[type];

  const tire = (label, val) => `<div class="tire ${label.endsWith('Left') ? 'left' : 'right'}"><div class="v">${val}<small>psi</small></div><div class="l">${label}</div></div>`;

  app.innerHTML = `
    <a class="icon-btn back-btn" href="index.html" aria-label="Back">${ICONS.back}</a>
    <div class="car-head">
      <h1>${logoHtml(car.brand)}<span class="name">${escapeHtml(car.title)}</span></h1>
    </div>
    <div class="car-meta">
      <div class="range">${gauge}</div>
      <div class="sub" id="status"></div>
    </div>

    <div class="car-hero"><img src="${car.photo}" alt=""></div>
    ${car.description ? `<p class="desc-line">${escapeHtml(car.description)}</p>` : ''}

    <div class="quick-row">
      ${LAYOUT.quick.map((k) =>
        `<button class="quick-btn${ALL[k][4] ? ' on' : ''}" data-k="${k}" aria-label="${ALL[k][0]}">${ICONS[ALL[k][1]]}</button>`).join('')}
    </div>

    <div class="vitals">
      ${VITALS.map(([label, val]) => `<div class="vital"><div class="v">${val}</div><div class="l">${label}</div></div>`).join('')}
    </div>

    <div class="tires">
      <div class="tires-title">Tire Pressure</div>
      <div class="tires-grid">
        ${tire('Front Left', psi[0])}
        <div class="tires-car">${ICONS.carTop}</div>
        ${tire('Front Right', psi[1])}
        ${tire('Rear Left', psi[2])}
        ${tire('Rear Right', psi[3])}
      </div>
    </div>

    <div class="temp-card">
      <div><div class="label" id="climateLabel">Interior · Climate Off</div><div class="val"><span id="temp">21</span>°</div></div>
      <div class="steps"><button id="tdown" aria-label="Cooler">−</button><button id="tup" aria-label="Warmer">+</button></div>
    </div>

    <div class="section-label">Controls</div>
    <div class="control-grid">
      ${LAYOUT.grid.map((k) =>
        `<button class="ctrl" data-k="${k}">${ICONS[ALL[k][1]]}<span>${ALL[k][0]}</span></button>`).join('')}
    </div>

    <div class="section-label">Location</div>
    <div class="group"><div class="row"><span class="ico">${ICONS.location}</span>
      <div class="txt"><div class="t"><span>${escapeHtml(place)}</span></div><div class="s">Parked · updated just now</div></div></div></div>
  `;

  const toastEl = document.getElementById('toast');
  let toastTimer;
  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove('show'), 1600);
  }

  const statusEl = document.getElementById('status');
  const state = { lock: true, start: false };
  function renderStatus() {
    const running = state.start ? '<span class="dot"></span>Engine Running' : '<span class="dot"></span>Parked';
    statusEl.innerHTML = `${running} · ${state.lock ? 'Locked' : 'Unlocked'}`;
  }
  renderStatus();

  app.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-k]');
    if (!btn) return;
    const k = btn.dataset.k;
    const [, , onText, offText] = ALL[k];
    if (navigator.vibrate) navigator.vibrate(10);

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
