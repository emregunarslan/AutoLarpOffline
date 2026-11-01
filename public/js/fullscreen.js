// Fullscreen toggle: a small icon shown at the bottom of the screen only while
// the page is not in fullscreen. Tapping it fills the screen (and it hides
// itself until you leave again). Hidden entirely on browsers without the
// Fullscreen API, e.g. iPhone Safari.
(function () {
  const root = document.documentElement;
  const request = root.requestFullscreen || root.webkitRequestFullscreen;
  if (!request) return; // no fullscreen support on this browser

  const btn = document.createElement('button');
  btn.className = 'fullscreen-btn';
  btn.type = 'button';
  btn.innerHTML = ICONS.expand;
  btn.onclick = () => {
    if (fsElement()) {
      (document.exitFullscreen || document.webkitExitFullscreen).call(document);
    } else {
      Promise.resolve(request.call(root)).catch(() => {});
    }
  };
  document.body.appendChild(btn);

  function fsElement() {
    return document.fullscreenElement || document.webkitFullscreenElement;
  }
  function update() {
    const hidden = !!fsElement();
    btn.classList.toggle('off', hidden);
    btn.setAttribute('aria-label', hidden ? 'Exit fullscreen' : 'Enter fullscreen');
  }
  document.addEventListener('fullscreenchange', update);
  document.addEventListener('webkitfullscreenchange', update);
  update();
})();
