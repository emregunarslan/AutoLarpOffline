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
          <div class="s">${POWERTRAINS[powertrainOf(c)]} · ${escapeHtml(c.description || brandBySlug(c.brand).name)}</div>
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
  const state = { id: null, photo: null, brand: null, powertrain: 'electric' };

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
    if (!$('title').value.trim()) return ['Give your vehicle a name', $('title')];
    return null;
  }

  // Clears error highlights as the user fills fields in.
  function validate() {
    [$('brands'), $('drop'), $('title')].forEach((el) => el.classList.remove('missing'));
    $('formError').textContent = '';
  }

  function openSheet(car) {
    state.id = car ? car.id : null;
    state.brand = car ? car.brand : null;
    setPhoto(car ? car.photo : null);
    $('title').value = car ? car.title : '';
    $('desc').value = car ? car.description || '' : '';
    $('location').value = car ? car.location || DEFAULT_LOCATION : DEFAULT_LOCATION;
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
})();
