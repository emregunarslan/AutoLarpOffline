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
    location.replace('./');
  };

  $('signout').onclick = async () => {
    await DB.logout();
    location.replace('login.html');
  };
})();
