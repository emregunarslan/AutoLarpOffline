(async function () {
  const list = document.getElementById('list');
  const avatar = document.getElementById('avatar');

  const [cars, profile] = await Promise.all([DB.getCars(), DB.getProfile()]);
  const hasName = profile.name && profile.name !== 'Owner';
  avatar.innerHTML = hasName || profile.avatar ? avatarHtml(profile) : ICONS.user;
  document.getElementById('greeting').textContent = hasName ? `Welcome back, ${firstName(profile.name)}` : 'Hello';

  if (!cars.length) {
    list.innerHTML = `<div class="empty">${ICONS.car}<div>No vehicles linked to this account</div></div>`;
    return;
  }

  const garageValue = document.getElementById('garageValue');
  const total = cars.reduce((sum, car) => sum + carValue(car), 0);
  garageValue.innerHTML = `Garage value <b>${formatCADRange(valueRange(total), { compact: true })}</b>`;
  garageValue.hidden = false;

  list.innerHTML = cars.map((car, i) => {
    const { pct, km, fuel } = vehicleStats(car);
    const electric = powertrainOf(car) === 'electric';
    // One reading per card, bottom right: battery icon + estimated range for
    // electric, pump icon + estimated fuel for gas.
    const gauge = electric
      ? `<span class="battery"><i style="width:${pct}%"></i></span>${km}<small>km</small>`
      : `<span class="gauge-ico">${ICONS.fuel}</span>${fuel}<small>%</small>`;
    return `
      <a class="car-card" href="car.html?id=${encodeURIComponent(car.id)}"
         style="background-image:url('${car.photo}');animation-delay:${i * 60}ms">
        <div class="inner">
          <div class="title-row">${logoHtml(car.brand)}<span class="title">${escapeHtml(car.title)}</span></div>
          <div class="status">${escapeHtml(car.location || DEFAULT_LOCATION)}</div>
          <div class="desc">${escapeHtml(car.description || brandBySlug(car.brand).name)}</div>
          <div class="batt">${gauge}</div>
        </div>
      </a>`;
  }).join('');
})();
