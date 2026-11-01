(async function () {
  const $ = (id) => document.getElementById(id);
  $('back').innerHTML = ICONS.back;
  $('dropHint').innerHTML = `${ICONS.camera}Upload a photo of your vehicle`;

  // ---------- Profile header ----------
  let profile = await DB.getProfile();
  function renderProfile() {
    $('bigAvatar').innerHTML = profile.name === 'Owner' ? ICONS.user : escapeHtml(initials(profile.name));
    $('bigAvatar').querySelector('svg')?.setAttribute('style', 'width:40px;height:40px;color:#8e8e93');
    $('pname').innerHTML = `${escapeHtml(profile.name)}${ICONS.pencil}`;
    const year = new Date(profile.memberSince).getFullYear();
    $('since').textContent = `Owner since ${year}`;
  }
  renderProfile();
  $('pname').onclick = async () => {
    const name = prompt('Your name', profile.name === 'Owner' ? '' : profile.name);
    if (name === null) return;
    profile.name = name.trim() || 'Owner';
    await DB.saveProfile(profile);
    renderProfile();
  };

  // ---------- Decorative account rows ----------
  $('extras').innerHTML = [
    ['card', 'Payment Methods'],
    ['key', 'Keys & Drivers'],
    ['bell', 'Notifications'],
    ['shield', 'Privacy & Security'],
    ['help', 'Support'],
  ].map(([icon, label]) => `
    <button class="row"><span class="ico">${ICONS[icon]}</span>
      <div class="txt"><div class="t"><span>${label}</span></div></div>
      <span class="chev">${ICONS.chev}</span></button>`).join('');

  // ---------- Vehicle list ----------
  let cars = [];
  async function renderVehicles() {
    cars = await DB.getCars();
    $('vehicles').innerHTML = cars.map((c) => `
      <button class="row" data-id="${escapeHtml(c.id)}">
        <span class="thumb" style="background-image:url('${c.photo}')"></span>
        <div class="txt">
          <div class="t">${logoHtml(c.brand)}<span>${escapeHtml(c.title)}</span></div>
          <div class="s">${POWERTRAINS[powertrainOf(c)]} · ${BODY_TYPES[bodyTypeOf(c)]} · ${escapeHtml(c.description || brandBySlug(c.brand).name)}</div>
        </div>
        <span class="chev">${ICONS.chev}</span>
      </button>`).join('') + `
      <button class="row add" id="addRow"><span class="ico">${ICONS.plus}</span>
        <div class="txt"><div class="t"><span>Add Vehicle</span></div></div></button>`;
  }
  await renderVehicles();

  $('vehicles').addEventListener('click', (e) => {
    const row = e.target.closest('.row');
    if (!row) return;
    openSheet(row.id === 'addRow' ? null : cars.find((c) => c.id === row.dataset.id));
  });

  // ---------- Appearance themes ----------
  $('themesIco').innerHTML = ICONS.palette;
  $('themesChev').innerHTML = ICONS.chev;
  $('themesSub').textContent = skinById(getSkinId()).name;

  const THEME_FILTERS = [['all', 'All Themes'], ['dark', 'Dark'], ['light', 'Light']];
  let themeFilter = 'all';

  // Samples keep the previews looking like a garage even before a car is added.
  function previewCars() {
    if (cars.length) {
      return cars.slice(0, 2).map((c) => {
        const { km, fuelBand } = vehicleStats(c);
        return {
          title: c.title,
          sub: c.description || brandBySlug(c.brand).name,
          photo: c.photo,
          stat: km === null ? `${fuelBand[0]}%` : `${km}km`,
        };
      });
    }
    return [
      { title: 'Grand Tourer', sub: 'Your dream garage', photo: null, stat: '86%' },
      { title: 'Weekend Car', sub: 'Ready for a drive', photo: null, stat: '64%' },
    ];
  }

  // A miniature of the real homepage. Car photos go through one shared CSS
  // rule so the same image data isn't repeated in all six previews.
  function miniHome() {
    const named = profile.name && profile.name !== 'Owner';
    const greeting = named ? `Hello ${escapeHtml(profile.name.split(' ')[0])}` : 'Hello';
    const avatar = named ? escapeHtml(initials(profile.name)) : ICONS.user;
    const cards = previewCars();
    const photoCss = cards.map((c, i) => c.photo ? `.mini-photo-${i} { background-image: url('${c.photo}'); }` : '').join('\n');
    const cardsHtml = cards.map((c, i) => `
      <div class="mini-card${c.photo ? ` photo mini-photo-${i}` : ''}">
        <div class="mini-inner">
          <div class="mini-title">${escapeHtml(c.title)}</div>
          <div class="mini-stat">${escapeHtml(c.stat)}</div>
          <div class="mini-sub">${escapeHtml(c.sub)}</div>
        </div>
      </div>`).join('');
    return {
      photoCss,
      html: `
      <div class="mini-status"><span>9:41</span><span class="mini-sig"><i></i><i></i><i></i><b></b></span></div>
      <div class="mini-head"><div class="mini-greeting">${greeting}</div><div class="mini-avatar">${avatar}</div></div>
      <div class="mini-list">${cardsHtml}</div>`,
    };
  }

  function renderThemeChips() {
    $('themeChips').innerHTML = THEME_FILTERS.map(([id, label]) =>
      `<button class="theme-chip${id === themeFilter ? ' sel' : ''}" data-filter="${id}">${label}</button>`).join('');
  }

  function renderThemeGrid() {
    const active = getSkinId();
    const skins = SKINS.filter((s) => themeFilter === 'all' || s.mode === themeFilter);
    const preview = miniHome();
    $('themePhotoCss').textContent = preview.photoCss;
    $('themeGrid').innerHTML = skins.map((skin) => {
      const vars = Object.entries(skin.vars).map(([k, v]) => `${k}:${v}`).join(';');
      const on = skin.id === active;
      return `
        <button class="theme-card${on ? ' active' : ''}" data-id="${skin.id}" aria-pressed="${on}" aria-label="Apply ${escapeHtml(skin.name)} theme">
          <div class="mini-frame" style="${vars}"><div class="mini">${preview.html}</div></div>
          <div class="theme-meta">
            <div class="theme-info">
              <div class="theme-name">${escapeHtml(skin.name)}</div>
              <div class="theme-blurb">${escapeHtml(skin.blurb)}</div>
            </div>
            <span class="theme-check">${ICONS.check}</span>
          </div>
        </button>`;
    }).join('');
  }

  function openThemes() {
    renderThemeChips();
    renderThemeGrid();
    document.body.classList.add('theme-open');
  }
  $('themesRow').onclick = openThemes;
  $('themeClose').onclick = () => document.body.classList.remove('theme-open');
  $('themeBackdrop').onclick = () => document.body.classList.remove('theme-open');

  $('themeChips').addEventListener('click', (e) => {
    const chip = e.target.closest('[data-filter]');
    if (!chip) return;
    themeFilter = chip.dataset.filter;
    renderThemeChips();
    renderThemeGrid();
  });

  $('themeGrid').addEventListener('click', (e) => {
    const card = e.target.closest('.theme-card');
    if (!card || $('themeGrid').dataset.busy) return;
    $('themeGrid').dataset.busy = '1';
    const skin = setSkin(card.dataset.id);
    $('themesSub').textContent = skin.name;
    $('themeGrid').querySelectorAll('.theme-card').forEach((c) => {
      const on = c.dataset.id === skin.id;
      c.classList.toggle('active', on);
      c.setAttribute('aria-pressed', String(on));
    });
    card.classList.add('applying');
    setTimeout(() => location.assign('./'), 420);
  });

  // ---------- Add / edit sheet ----------
  const state = { id: null, photo: null, brand: null, powertrain: 'electric', bodyType: null };

  $('bodyType').innerHTML = Object.entries(BODY_TYPES)
    .map(([v, label]) => `<button type="button" class="chip" data-v="${v}">${label}</button>`).join('');
  $('bodyType').addEventListener('click', (e) => {
    const chip = e.target.closest('[data-v]');
    if (!chip) return;
    state.bodyType = chip.dataset.v;
    syncBodyType();
    validate();
  });
  function syncBodyType() {
    $('bodyType').querySelectorAll('[data-v]').forEach((b) => b.classList.toggle('sel', b.dataset.v === state.bodyType));
  }

  // Any text is accepted as a location; this just offers the default as a one-tap fill.
  $('suggestLoc').innerHTML = `${ICONS.location}<span>Use ${escapeHtml(DEFAULT_LOCATION)}</span>`;
  $('suggestLoc').onclick = () => { $('location').value = DEFAULT_LOCATION; validate(); };
  $('location').addEventListener('input', validate);

  $('powertrain').addEventListener('click', (e) => {
    const seg = e.target.closest('[data-v]');
    if (!seg) return;
    state.powertrain = seg.dataset.v;
    syncPowertrain();
  });

  function syncPowertrain() {
    $('powertrain').querySelectorAll('[data-v]').forEach((b) => b.classList.toggle('sel', b.dataset.v === state.powertrain));
  }

  $('brands').innerHTML = BRANDS.map((b) => `
    <button type="button" class="brand-tile" data-slug="${b.slug}">${logoHtml(b.slug)}<span>${b.name}</span></button>`).join('');

  $('brands').addEventListener('click', (e) => {
    const tile = e.target.closest('.brand-tile');
    if (!tile) return;
    state.brand = tile.dataset.slug;
    syncBrand();
    validate();
  });

  function syncBrand() {
    document.querySelectorAll('.brand-tile').forEach((t) => t.classList.toggle('sel', t.dataset.slug === state.brand));
  }

  function setPhoto(dataUrl) {
    state.photo = dataUrl;
    $('drop').style.backgroundImage = dataUrl ? `url('${dataUrl}')` : '';
    $('drop').classList.toggle('has', !!dataUrl);
  }

  // Returns [message, element] for the first missing required field, or null.
  function missingField() {
    if (!state.brand) return ['Choose your car brand', $('brands')];
    if (!state.photo) return ['Add a photo of your vehicle', $('drop')];
    if (!state.bodyType) return ['Choose a body type', $('bodyType')];
    if (!$('title').value.trim()) return ['Give your vehicle a name', $('title')];
    if (!$('location').value.trim()) return ['Enter where your vehicle is parked', $('location')];
    return null;
  }

  // Clears error highlights as the user fills fields in.
  function validate() {
    [$('brands'), $('drop'), $('bodyType'), $('title'), $('location')].forEach((el) => el.classList.remove('missing'));
    $('formError').textContent = '';
  }

  function openSheet(car) {
    state.id = car ? car.id : null;
    state.brand = car ? car.brand : null;
    setPhoto(car ? car.photo : null);
    $('title').value = car ? car.title : '';
    $('desc').value = car ? car.description || '' : '';
    $('location').value = car ? car.location || '' : '';
    state.bodyType = car && BODY_TYPES[car.bodyType] ? car.bodyType : null;
    syncBodyType();
    state.powertrain = car ? powertrainOf(car) : 'electric';
    syncPowertrain();
    $('photo').value = '';
    $('sheetTitle').textContent = car ? 'Edit Vehicle' : 'Add Vehicle';
    $('remove').hidden = !car;
    syncBrand();
    validate();
    $('form').scrollTop = 0;
    document.body.classList.add('sheet-open');
    if (car) document.querySelector('.brand-tile.sel')?.scrollIntoView({ block: 'nearest' });
  }

  function closeSheet() {
    document.activeElement?.blur();
    document.body.classList.remove('sheet-open');
  }
  $('cancel').onclick = closeSheet;
  $('backdrop').onclick = closeSheet;
  $('title').addEventListener('input', validate);

  $('photo').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      setPhoto(await resizeImage(file, 1400));
    } catch {
      alert('Could not read that image. Try another photo.');
    }
    validate();
  });

  $('form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const missing = missingField();
    if (missing) {
      const [msg, el] = missing;
      $('formError').textContent = msg;
      el.classList.add('missing');
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    const existing = cars.find((c) => c.id === state.id);
    await DB.saveCar({
      ...(existing || {}),
      id: state.id || undefined,
      title: $('title').value.trim(),
      description: $('desc').value.trim(),
      location: $('location').value.trim(),
      powertrain: state.powertrain,
      bodyType: state.bodyType,
      brand: state.brand,
      photo: state.photo,
    });
    closeSheet();
    renderVehicles();
  });

  $('remove').onclick = async () => {
    if (!confirm('Remove this vehicle from your account?')) return;
    await DB.deleteCar(state.id);
    closeSheet();
    renderVehicles();
  };

  // Downscale the uploaded photo so storage stays small.
  function resizeImage(file, maxSide) {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
        URL.revokeObjectURL(url);
        resolve(canvas.toDataURL('image/jpeg', 0.85));
      };
      img.onerror = () => { URL.revokeObjectURL(url); reject(); };
      img.src = url;
    });
  }

  // ---------- Reset ----------
  $('reset').onclick = async () => {
    if (!confirm('Reset all data? This removes every vehicle and your profile from this device.')) return;
    await DB.resetAll();
    resetSkin();
    location.replace('./');
  };
})();
