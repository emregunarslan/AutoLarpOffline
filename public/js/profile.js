(async function () {
  const $ = (id) => document.getElementById(id);
  $('back').innerHTML = ICONS.back;
  $('dropHint').innerHTML = `${ICONS.camera}Upload a photo of your vehicle<small>Up to 30 MB · you can crop it next</small>`;

  // ---------- Profile header ----------
  let profile = await DB.getProfile();
  function renderProfile() {
    $('bigAvatar').innerHTML = avatarHtml(profile);
    $('removeAvatar').hidden = !profile.avatar;
    $('pname').innerHTML = `${escapeHtml(profile.name)}${ICONS.pencil}`;
  }
  renderProfile();

  // Tap the avatar to pick, crop and save a profile picture.
  $('avatarBadge').innerHTML = ICONS.camera;
  $('avatarFile').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    e.target.value = '';
    if (!file) return;
    try {
      const avatar = await Cropper.cropPhoto(file, { width: 512, height: 512, round: true });
      if (!avatar) return;
      profile = await DB.saveProfile({ avatar });
      renderProfile();
    } catch (err) {
      alert(err.message || 'Could not use that photo. Try another one.');
    }
  });
  $('removeAvatar').onclick = async () => {
    if (!confirm('Remove your profile picture?')) return;
    profile = await DB.saveProfile({ avatar: null });
    renderProfile();
  };

  // Tap the name to edit it in place (max NAME_MAX characters).
  const pnameButton = $('pname');
  pnameButton.onclick = () => {
    const input = document.createElement('input');
    input.className = 'name-input';
    input.maxLength = NAME_MAX;
    input.value = profile.name;
    input.setAttribute('aria-label', 'Your name');
    pnameButton.replaceWith(input);
    input.focus();
    input.select();
    let done = false;
    async function finish(save) {
      if (done) return;
      done = true;
      const name = input.value.trim().slice(0, NAME_MAX);
      if (save && name && name !== profile.name) profile = await DB.saveProfile({ name });
      input.replaceWith(pnameButton);
      renderProfile();
    }
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') finish(true);
      if (e.key === 'Escape') finish(false);
    });
    input.addEventListener('blur', () => finish(true));
  };

  // ---------- Account rows (each opens a screen from subpages.js) ----------
  $('extras').innerHTML = [
    ['payment', 'card', 'Payment Methods'],
    ['notifications', 'bell', 'Notifications'],
    ['privacy', 'shield', 'Privacy & Security'],
    ['support', 'help', 'Support'],
  ].map(([page, icon, label]) => `
    <button class="row" data-page="${page}"><span class="ico">${ICONS[icon]}</span>
      <div class="txt"><div class="t"><span>${label}</span></div></div>
      <span class="chev">${ICONS.chev}</span></button>`).join('');
  $('extras').addEventListener('click', (e) => {
    const row = e.target.closest('[data-page]');
    if (row) Subpages.open(row.dataset.page, profile);
  });

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

  // ---------- Custom gradient ----------
  $('themesIco').innerHTML = ICONS.palette;
  $('themesChev').innerHTML = ICONS.chev;
  $('customIco').innerHTML = ICONS.palette;

  // Luxury paint names make the picker read like a car configurator.
  const COLOR_PRESETS = [
    { hex: '#0d0d10', name: 'Obsidian' },
    { hex: '#7b1e2b', name: 'Bordeaux' },
    { hex: '#c1121f', name: 'Rosso' },
    { hex: '#c6a664', name: 'Champagne' },
    { hex: '#8a5a2b', name: 'Cognac' },
    { hex: '#1c4b3b', name: 'Racing Green' },
    { hex: '#1f3a68', name: 'Sapphire' },
    { hex: '#b9bdc4', name: 'Platinum' },
    { hex: '#f2efe9', name: 'Pearl' },
  ];

  // Presets are inserted before the static custom-color swatch.
  $('palette').insertAdjacentHTML('afterbegin', COLOR_PRESETS.map((preset) => `
    <button type="button" class="swatch" data-color="${preset.hex}" data-name="${escapeHtml(preset.name)}" style="--swatch:${preset.hex}"
      title="${escapeHtml(preset.name)}" aria-label="${escapeHtml(preset.name)} ${preset.hex.toUpperCase()}" aria-pressed="false"></button>`).join(''));

  // One-tap themes: each sets both gradient colours at once.
  const THEME_PRESETS = [
    { name: 'Midnight', primary: '#1f3a68', secondary: '#c6a664' },
    { name: 'Rosso Corsa', primary: '#c1121f', secondary: '#c6a664' },
    { name: 'British Racing', primary: '#1c4b3b', secondary: '#c6a664' },
    { name: 'Obsidian', primary: '#0d0d10', secondary: '#b9bdc4' },
    { name: 'Bordeaux', primary: '#7b1e2b', secondary: '#8a5a2b' },
    { name: 'Arctic', primary: '#b9bdc4', secondary: '#1f3a68' },
    { name: 'Cognac', primary: '#8a5a2b', secondary: '#f2efe9' },
    { name: 'Monaco', primary: '#1f3a68', secondary: '#c1121f' },
    { name: 'Emerald Night', primary: '#0d0d10', secondary: '#1c4b3b' },
    { name: 'Pearl', primary: '#f2efe9', secondary: '#c6a664' },
  ];
  $('themePresets').innerHTML = THEME_PRESETS.map((t) => `
    <button type="button" class="swatch" data-primary="${t.primary}" data-secondary="${t.secondary}" data-name="${escapeHtml(t.name)}"
      style="--swatch:linear-gradient(135deg, ${t.primary} 50%, ${t.secondary} 50%)"
      title="${escapeHtml(t.name)}" aria-label="${escapeHtml(t.name)} theme" aria-pressed="false"></button>`).join('');

  function renderPresetSelection() {
    let note = '';
    $('themePresets').querySelectorAll('[data-primary]').forEach((swatch) => {
      const on = swatch.dataset.primary === draft.primary.toLowerCase()
        && swatch.dataset.secondary === draft.secondary.toLowerCase();
      swatch.classList.toggle('sel', on);
      swatch.setAttribute('aria-pressed', String(on));
      if (on) note = swatch.dataset.name;
    });
    $('presetNote').textContent = note;
  }

  function colorSubtitle(colors) {
    return `${colors.primary.toUpperCase()} · ${colors.secondary.toUpperCase()}`;
  }
  $('themesSub').textContent = colorSubtitle(getColors());
  let draft = getColors();
  let activeTarget = 'primary';
  const picker = { h: 0, s: 0, v: 0 };
  const clamp01 = (n) => Math.min(1, Math.max(0, n));

  // Samples keep the preview looking like a garage even before a car is added.
  function previewCars() {
    if (cars.length) {
      return cars.slice(0, 2).map((c) => {
        const { km, fuel } = vehicleStats(c);
        return {
          title: c.title,
          sub: c.description || brandBySlug(c.brand).name,
          photo: c.photo,
        };
      });
    }
    return [
      { title: 'Grand Tourer', sub: 'Your dream garage', photo: null },
      { title: 'Weekend Car', sub: 'Ready for a drive', photo: null },
    ];
  }

  // A miniature of the real homepage, rebuilt whenever the sheet opens.
  function miniHome() {
    const named = profile.name && profile.name !== 'Owner';
    const greeting = named ? `Welcome back, ${escapeHtml(firstName(profile.name))}` : 'Hello';
    const avatar = named ? escapeHtml(initials(profile.name)) : ICONS.user;
    const cards = previewCars().map((c) => `
      <div class="mini-card${c.photo ? ' photo' : ''}"${c.photo ? ` style="background-image:url('${c.photo}')"` : ''}>
        <div class="mini-inner">
          <div class="mini-title">${escapeHtml(c.title)}</div>
          <div class="mini-sub">${escapeHtml(c.sub)}</div>
        </div>
      </div>`).join('');
    return `
      <div class="mini-status"><span>9:41</span><span class="mini-sig"><i></i><i></i><i></i><b></b></span></div>
      <div class="mini-head"><div class="mini-greeting">${greeting}</div><div class="mini-avatar">${avatar}</div></div>
      <div class="mini-list">${cards}</div>`;
  }

  function renderTargets() {
    document.querySelectorAll('.color-target').forEach((btn) => {
      const on = btn.dataset.target === activeTarget;
      btn.classList.toggle('active', on);
      btn.setAttribute('aria-pressed', String(on));
    });
    $('paletteTitle').textContent = `${activeTarget === 'primary' ? 'Primary' : 'Secondary'} palette`;
  }

  function renderPaletteSelection() {
    let custom = true;
    let note = 'Custom color';
    const current = draft[activeTarget].toLowerCase();
    $('palette').querySelectorAll('[data-color]').forEach((swatch) => {
      const on = swatch.dataset.color === current;
      swatch.classList.toggle('sel', on);
      swatch.setAttribute('aria-pressed', String(on));
      if (on) {
        custom = false;
        note = swatch.dataset.name;
      }
    });
    $('customSwatch').classList.toggle('sel', custom);
    $('paletteNote').textContent = note;
  }

  function paintPreview() {
    const vars = colorVars(draft);
    const frame = $('themePreviewFrame');
    Object.entries(vars).forEach(([key, value]) => frame.style.setProperty(key, value));
    $('gradientStrip').style.background = `linear-gradient(135deg, ${draft.primary}, ${draft.secondary})`;
    $('primaryDot').style.background = draft.primary;
    $('secondaryDot').style.background = draft.secondary;
    $('primaryHex').textContent = draft.primary.toUpperCase();
    $('secondaryHex').textContent = draft.secondary.toUpperCase();
    renderTargets();
    renderPaletteSelection();
    renderPresetSelection();
  }

  function setPickerFromColor(hex) {
    const hsv = colorToHsv(hex);
    picker.h = hsv.h;
    picker.s = hsv.s;
    picker.v = hsv.v;
  }

  function renderPicker() {
    const hex = hsvToColor(picker.h, picker.s, picker.v);
    $('svArea').style.setProperty('--hue-color', hsvToColor(picker.h, 1, 1));
    $('svHandle').style.left = `${picker.s * 100}%`;
    $('svHandle').style.top = `${(1 - picker.v) * 100}%`;
    $('svHandle').style.setProperty('--picked', hex);
    $('hueHandle').style.left = `${(picker.h / 360) * 100}%`;
    $('hueHandle').style.background = hsvToColor(picker.h, 1, 1);
    $('pickerPreview').style.background = hex;
    if (document.activeElement !== $('hexInput')) $('hexInput').value = hex.toUpperCase();
    $('pickerTitle').textContent = `Custom ${activeTarget}`;
  }

  function applyPicker() {
    const hex = hsvToColor(picker.h, picker.s, picker.v);
    draft = { ...draft, [activeTarget]: hex };
    paintPreview();
    renderPicker();
  }

  function openCustomPicker() {
    setPickerFromColor(draft[activeTarget]);
    $('presetHead').hidden = true;
    $('themePresets').hidden = true;
    $('paletteHead').hidden = true;
    $('palette').hidden = true;
    $('themeHint').hidden = true;
    $('customPicker').hidden = false;
    $('customSwatch').setAttribute('aria-expanded', 'true');
    renderPicker();
    $('hexInput').value = hsvToColor(picker.h, picker.s, picker.v).toUpperCase();
    $('customPicker').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  function closeCustomPicker() {
    $('customPicker').hidden = true;
    $('presetHead').hidden = false;
    $('themePresets').hidden = false;
    $('paletteHead').hidden = false;
    $('palette').hidden = false;
    $('themeHint').hidden = false;
    $('customSwatch').setAttribute('aria-expanded', 'false');
  }

  function setActiveTarget(target) {
    activeTarget = target;
    renderTargets();
    renderPaletteSelection();
    if (!$('customPicker').hidden) {
      setPickerFromColor(draft[target]);
      renderPicker();
    }
  }

  function openThemes() {
    closeCustomPicker();
    draft = getColors();
    activeTarget = 'primary';
    $('themePreview').innerHTML = miniHome();
    paintPreview();
    document.body.classList.add('theme-open');
  }
  $('themesRow').onclick = openThemes;
  $('themeClose').onclick = () => document.body.classList.remove('theme-open');
  $('themeBackdrop').onclick = () => document.body.classList.remove('theme-open');

  document.querySelectorAll('.color-target').forEach((btn) => {
    btn.addEventListener('click', () => setActiveTarget(btn.dataset.target));
  });

  $('palette').addEventListener('click', (e) => {
    const swatch = e.target.closest('[data-color]');
    if (!swatch) return;
    draft = { ...draft, [activeTarget]: swatch.dataset.color };
    paintPreview();
  });

  $('themePresets').addEventListener('click', (e) => {
    const swatch = e.target.closest('[data-primary]');
    if (!swatch) return;
    draft = { primary: swatch.dataset.primary, secondary: swatch.dataset.secondary };
    paintPreview();
  });

  $('customSwatch').addEventListener('click', openCustomPicker);
  $('pickerDone').addEventListener('click', closeCustomPicker);

  function bindPickerDrag(el, onMove) {
    let dragging = false;
    el.addEventListener('pointerdown', (e) => {
      dragging = true;
      el.setPointerCapture(e.pointerId);
      onMove(e);
    });
    el.addEventListener('pointermove', (e) => {
      if (dragging) onMove(e);
    });
    const stop = () => { dragging = false; };
    el.addEventListener('pointerup', stop);
    el.addEventListener('pointercancel', stop);
  }

  bindPickerDrag($('svArea'), (e) => {
    const rect = $('svArea').getBoundingClientRect();
    picker.s = clamp01((e.clientX - rect.left) / rect.width);
    picker.v = 1 - clamp01((e.clientY - rect.top) / rect.height);
    applyPicker();
  });

  bindPickerDrag($('hueBar'), (e) => {
    const rect = $('hueBar').getBoundingClientRect();
    picker.h = clamp01((e.clientX - rect.left) / rect.width) * 359.999;
    applyPicker();
  });

  $('svArea').addEventListener('keydown', (e) => {
    const step = 0.02;
    if (e.key === 'ArrowLeft') picker.s = clamp01(picker.s - step);
    else if (e.key === 'ArrowRight') picker.s = clamp01(picker.s + step);
    else if (e.key === 'ArrowUp') picker.v = clamp01(picker.v + step);
    else if (e.key === 'ArrowDown') picker.v = clamp01(picker.v - step);
    else return;
    e.preventDefault();
    applyPicker();
  });

  $('hueBar').addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') picker.h = (picker.h + 358) % 360;
    else if (e.key === 'ArrowRight' || e.key === 'ArrowUp') picker.h = (picker.h + 2) % 360;
    else return;
    e.preventDefault();
    applyPicker();
  });

  $('hexInput').addEventListener('input', (e) => {
    const raw = e.target.value.trim();
    if (!/^#?[0-9a-f]{6}$/i.test(raw)) return;
    const hex = raw.startsWith('#') ? raw : `#${raw}`;
    setPickerFromColor(hex);
    draft = { ...draft, [activeTarget]: hex.toLowerCase() };
    paintPreview();
    renderPicker();
  });
  $('hexInput').addEventListener('blur', () => {
    $('hexInput').value = hsvToColor(picker.h, picker.s, picker.v).toUpperCase();
  });
  $('hexInput').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); e.target.blur(); }
  });
  $('hexInput').addEventListener('focus', (e) => e.target.select());

  $('applyTheme').onclick = () => {
    const saved = saveColors(draft);
    $('themesSub').textContent = colorSubtitle(saved);
    document.body.classList.remove('theme-open');
    location.assign('./');
  };

  // ---------- Add / edit sheet ----------
  const state = { id: null, photo: null, brand: null, powertrain: 'electric', bodyType: null, coords: null };

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

  // Any text is accepted as a location.
  $('location').addEventListener('input', () => { state.coords = null; validate(); }); // typed by hand: no GPS

  // "Use my current location": GPS position -> street address (looked up by the server).
  const TRACK_LABEL = `${ICONS.location}<span>Use my current location</span>`;
  $('trackLoc').innerHTML = TRACK_LABEL;
  $('trackLoc').onclick = () => {
    if (!navigator.geolocation) {
      $('formError').textContent = 'Location isn\'t available in this browser.';
      return;
    }
    $('trackLoc').disabled = true;
    $('trackLoc').innerHTML = `${ICONS.location}<span>Finding you…</span>`;
    const done = () => { $('trackLoc').disabled = false; $('trackLoc').innerHTML = TRACK_LABEL; };
    navigator.geolocation.getCurrentPosition(async ({ coords }) => {
      const lat = coords.latitude, lon = coords.longitude;
      let address = `${lat.toFixed(5)}, ${lon.toFixed(5)}`; // shown if the address lookup fails
      try {
        address = (await DB.api('GET', `/geocode?lat=${lat}&lon=${lon}`)).address || address;
      } catch { /* keep the coordinates */ }
      $('location').value = address;
      state.coords = { lat, lon };
      validate();
      done();
    }, (err) => {
      $('formError').textContent = err.code === err.PERMISSION_DENIED
        ? 'Location access is blocked. Allow it in your browser\'s site settings, or type the address.'
        : 'Couldn\'t get your location. Try again or type the address.';
      done();
    }, { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 });
  };

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
    state.coords = car?.coords || null;
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
    $('photo').value = ''; // lets the same file be picked again
    try {
      const cropped = await Cropper.cropPhoto(file);
      if (cropped) setPhoto(cropped);
    } catch (err) {
      alert(err.message || 'Could not read that image. Try another photo.');
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
    $('save').disabled = true;
    $('save').textContent = 'Saving…';
    try {
      await DB.saveCar({
        id: state.id || undefined,
        title: $('title').value.trim(),
        description: $('desc').value.trim(),
        location: $('location').value.trim(),
        coords: state.coords,
        powertrain: state.powertrain,
        bodyType: state.bodyType,
        brand: state.brand,
        photo: state.photo,
      });
      closeSheet();
      renderVehicles();
    } catch (err) {
      $('formError').textContent = err.message;
    } finally {
      $('save').disabled = false;
      $('save').textContent = 'Save';
    }
  });

  $('remove').onclick = async () => {
    if (!confirm('Remove this vehicle from your account?')) return;
    await DB.deleteCar(state.id);
    closeSheet();
    renderVehicles();
  };

  // ---------- Reset ----------
  $('reset').onclick = async () => {
    if (!confirm('Reset all data? This removes every vehicle from your account and resets your name.')) return;
    await DB.resetAll();
    resetColors();
    location.replace('./');
  };

  $('signout').onclick = async () => {
    await DB.logout();
    location.replace('login.html');
  };
})();
