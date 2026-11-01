(async function () {
  const list = document.getElementById('list');
  const avatar = document.getElementById('avatar');

  const [cars, profile] = await Promise.all([DB.getCars(), DB.getProfile()]);
  avatar.innerHTML = profile.name && profile.name !== 'Owner' ? escapeHtml(initials(profile.name)) : ICONS.user;

  if (!cars.length) {
    list.innerHTML = `<div class="empty">${ICONS.car}<div>No vehicles linked to this account</div></div>`;
    return;
  }

  list.innerHTML = cars.map((car, i) => {
    const { pct, fuel, km } = fakeRange(car);
    const battery = `<span class="battery"><i style="width:${pct}%"></i></span>`;
    const fuelIco = `<span class="gauge-ico">${ICONS.fuel}</span>`;
    const gauge = {
      electric: `${pct}%${battery}`,
      gas: `${fuel}%${fuelIco}`,
      hybrid: `${pct}%${battery}${fuel}%${fuelIco}`,
    }[powertrainOf(car)];
    return `
      <a class="car-card" href="car.html?id=${encodeURIComponent(car.id)}"
         style="background-image:url('${car.photo}');animation-delay:${i * 60}ms">
        <div class="inner">
          <div class="title-row">${logoHtml(car.brand)}<span class="title">${escapeHtml(car.title)}</span></div>
          <div class="stat">${km}<small>km</small></div>
          <div class="status">${escapeHtml(car.location || 'Parked')}</div>
          <div class="desc">${escapeHtml(car.description || brandBySlug(car.brand).name)}</div>
          <div class="batt">${gauge}</div>
        </div>
      </a>`;
  }).join('');
})();
