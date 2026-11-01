(async function () {
  const list = document.getElementById('list');
  const avatar = document.getElementById('avatar');

  const [cars, profile] = await Promise.all([DB.getCars(), DB.getProfile()]);
  const hasName = profile.name && profile.name !== 'Owner';
  avatar.innerHTML = hasName || profile.avatar ? avatarHtml(profile) : ICONS.user;
  document.getElementById('greeting').textContent = hasName ? `Hello ${profile.name.split(' ')[0]}` : 'Hello';

  if (!cars.length) {
    list.innerHTML = `<div class="empty">${ICONS.car}<div>No vehicles linked to this account</div></div>`;
    return;
  }

  list.innerHTML = cars.map((car, i) => {
    const { pct, km, fuel } = vehicleStats(car);
    const electric = powertrainOf(car) === 'electric';
    const gauge = electric
      ? `<span class="battery"><i style="width:${pct}%"></i></span>${pct}%`
      : `<span class="gauge-ico">${ICONS.fuel}</span>${fuel}%`;
    return `
      <a class="car-card" href="car.html?id=${encodeURIComponent(car.id)}"
         style="background-image:url('${car.photo}');animation-delay:${i * 60}ms">
        <div class="inner">
          <div class="title-row">${logoHtml(car.brand)}<span class="title">${escapeHtml(car.title)}</span></div>
          <div class="stat">${electric ? `${km}<small>km</small>` : `${fuel}<small>%</small>`}</div>
          <div class="status">${escapeHtml(car.location || DEFAULT_LOCATION)}</div>
          <div class="desc">${escapeHtml(car.description || brandBySlug(car.brand).name)}</div>
          <div class="batt">${gauge}</div>
        </div>
      </a>`;
  }).join('');
})();
