// Forced fullscreen: the app stays fullscreen. Most browsers only allow
// fullscreen changes from a user gesture, so the attempt on load is best-effort;
// from then on, any tap (re)enters fullscreen. Every page loads this file.
// Fullscreen is per-page, so following a link to another screen drops out of it;
// the next tap on the new screen snaps it back. (iPhone Safari has no way to
// hide its bars at all — installing the app from the share sheet is the only
// true fullscreen there.)
(function () {
  const root = document.documentElement;
  const request = root.requestFullscreen || root.webkitRequestFullscreen;
  if (!request) return; // e.g. iPhone Safari has no document fullscreen at all

  function fsElement() {
    return document.fullscreenElement || document.webkitFullscreenElement;
  }
  function enter() {
    if (fsElement()) return;
    Promise.resolve(request.call(root)).catch(() => {
      // Chrome refuses a request made while a fullscreen transition is still
      // settling; one quick retry inside the same tap's activation window.
      setTimeout(() => { if (!fsElement()) Promise.resolve(request.call(root)).catch(() => {}); }, 250);
    });
  }

  enter(); // best-effort: some browsers/webviews allow it without a gesture
  for (const evt of ['pointerdown', 'touchend']) window.addEventListener(evt, enter, true);
})();
