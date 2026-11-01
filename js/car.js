(async function () {
  const app = document.getElementById('app');
  const id = new URLSearchParams(location.search).get('id');
  const car = id && (await DB.getCar(id));
  if (!car) { location.replace('index.html'); return; }

  document.title = car.title;
  const type = powertrainOf(car);
  const { pct, fuel, oil, km } = fakeRange(car);
  const place = car.location || 'Home';

  // [key, label, icon, onText, offText (null = one-shot), startsOn]
  const ALL = {
    lock: ['Lock', 'lock', 'Locked', 'Unlocked', true],
    climate: ['Climate', 'fan', 'Climate on', 'Climate off'],
    charge: ['Charge Port', 'bolt', 'Charge port opened', 'Charge port closed'],
    frunk: ['Frunk', 'frunk', 'Frunk opened', 'Frunk closed'],
    start: ['Remote Start', 'power', 'Engine started', 'Engine stopped'],
    trunk: ['Trunk', 'trunk', 'Trunk opened', 'Trunk closed'],
    defrost: ['Defrost', 'defrost', 'Defrost on', 'Defrost off'],
    seat: ['Seat Heat', 'seat', 'Seat heaters on', 'Seat heaters off'],
    wheel: ['Wheel Heat', 'wheel', 'Steering wheel heater on', 'Steering wheel heater off'],
    vent: ['Vent Windows', 'window', 'Windows vented', 'Windows closed'],
    horn: ['Honk Horn', 'horn', 'Honked horn', null],
    flash: ['Flash Lights', 'lights', 'Flashed lights', null],
    homelink: ['HomeLink', 'home', 'HomeLink triggered', null],
    valet: ['Valet', 'valet', 'Valet Mode on', 'Valet Mode off'],
    mirrors: ['Fold Mirrors', 'mirror', 'Mirrors folded', 'Mirrors unfolded'],
    sentry: ['Sentry', 'eye', 'Sentry Mode on', 'Sentry Mode off'],
    summon: ['Summon', 'summon', 'Summon ready', 'Summon cancelled'],
    keep: ['Keep Climate', 'snow', 'Keep Climate on', 'Keep Climate off'],
    dog: ['Dog Mode', 'dog', 'Dog Mode on', 'Dog Mode off'],
    precond: ['Precondition', 'thermo', 'Battery preconditioning', 'Preconditioning off'],
    fueldoor: ['Fuel Door', 'fuel', 'Fuel door unlocked', 'Fuel door locked'],
    panic: ['Panic Alarm', 'alarm', 'Panic alarm sounding', 'Panic alarm off'],
    sunroof: ['Sunroof', 'sunroof', 'Sunroof opened', 'Sunroof closed'],
    evmode: ['EV Mode', 'leaf', 'EV Mode on', 'EV Mode off'],
  };

  const LAYOUT = {
    electric: {
      quick: ['lock', 'climate', 'charge', 'frunk'],
      grid: ['defrost', 'seat', 'wheel', 'vent', 'trunk', 'precond', 'sentry', 'summon', 'keep',
             'dog', 'horn', 'flash', 'homelink', 'valet', 'mirrors'],
    },
    gas: {
      quick: ['lock', 'start', 'climate', 'trunk'],
      grid: ['defrost', 'seat', 'wheel', 'vent', 'sunroof', 'fueldoor', 'horn', 'flash', 'panic',
             'homelink', 'valet', 'mirrors'],
    },
    hybrid: {
      quick: ['lock', 'start', 'climate', 'charge'],
      grid: ['evmode', 'precond', 'fueldoor', 'defrost', 'seat', 'wheel', 'vent', 'trunk', 'sunroof',
             'horn', 'flash', 'panic', 'homelink', 'valet', 'mirrors'],
    },
  }[type];

  const VITALS = {
    electric: [['Battery', `${pct}%`], ['Charge Limit', '80%'], ['Tires', 'OK']],
    gas: [['Fuel', `${fuel}%`], ['Oil Life', `${oil}%`], ['Tires', 'OK']],
    hybrid: [['Battery', `${pct}%`], ['Fuel', `${fuel}%`], ['Tires', 'OK']],
  }[type];

  const battery = (p) => `<span class="battery"><i style="width:${p}%"></i></span>`;
  const gauge = {
    electric: `${battery(pct)}${km} km`,
    gas: `<span class="gauge-ico">${ICONS.fuel}</span>${km} km`,
    hybrid: `${battery(pct)}<span class="gauge-ico">${ICONS.fuel}</span>${km} km`,
  }[type];

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
