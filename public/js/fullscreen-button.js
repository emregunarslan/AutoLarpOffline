// Fullscreen toggle for the garage list page only. It only changes fullscreen when
// tapped (nothing automatic). Hidden where the browser can't do fullscreen,
// e.g. iPhone Safari (there, "Add to Home Screen" gives the full-screen app).
(function () {
  const btn = document.getElementById('fullscreenBtn');
  const root = document.documentElement;
  const enter = root.requestFullscreen || root.webkitRequestFullscreen;
  const exit = document.exitFullscreen || document.webkitExitFullscreen;
  if (!btn || !enter || !exit) return;

  const isFull = () => Boolean(document.fullscreenElement || document.webkitFullscreenElement);

  function render() {
    const on = isFull();
    btn.innerHTML = on ? ICONS.compress : ICONS.expand;
    btn.setAttribute('aria-label', on ? 'Exit full screen' : 'Full screen');
    btn.setAttribute('aria-pressed', String(on));
  }

  btn.hidden = false;
  render();
  btn.onclick = () => {
    const action = isFull() ? exit.call(document) : enter.call(root);
    Promise.resolve(action).catch(() => {}).finally(render);
  };
  // Also catches leaving fullscreen with Esc or the system back gesture.
  document.addEventListener('fullscreenchange', render);
  document.addEventListener('webkitfullscreenchange', render);
})();
