// Lock/unlock sound for the car page. The clip is bundled in public/sfx, so it
// needs no API. Web Audio is used so a lock triggered later by the assistant can
// play after the first tap has unlocked audio on the page.
(() => {
  const SETTINGS_KEY = 'account:settings'; // shared with Profile → Preferences
  const CLIP = 'sfx/lock.mp3';
  const VOLUME = 0.5;
  let dataPromise = null;
  let bufferPromise = null;
  let source = null;
  let ctx = null;

  function enabled() {
    try {
      return JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}').sfx !== false;
    } catch {
      return true; // blocked storage should not silence the car
    }
  }

  function ensureContext() {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return null;
    if (!ctx) ctx = new Ctx();
    if (ctx.state === 'suspended') ctx.resume().catch(() => {});
    return ctx;
  }

  function fetchClip() {
    dataPromise ??= fetch(CLIP)
      .then((res) => (res.ok ? res.arrayBuffer() : null))
      .catch(() => null);
    return dataPromise;
  }

  function decode() {
    bufferPromise ??= fetchClip().then((data) => {
      if (!data) return null;
      const audio = ensureContext();
      return audio ? audio.decodeAudioData(data).catch(() => null) : null;
    });
    return bufferPromise;
  }

  // Browsers only start audio after a gesture. The first tap also loads the clip
  // so assistant-triggered locks can play later without another tap.
  function unlock() {
    if (!ensureContext()) return;
    decode();
  }

  function play() {
    if (!enabled()) return;
    const audio = ensureContext();
    if (!audio) return;

    decode().then((buffer) => {
      if (!buffer || !enabled()) return;
      const start = () => {
        try { source?.stop(); } catch { /* already ended */ }
        const next = audio.createBufferSource();
        const gain = audio.createGain();
        next.buffer = buffer;
        gain.gain.value = VOLUME;
        next.connect(gain).connect(audio.destination);
        next.onended = () => {
          if (source === next) source = null;
        };
        source = next;
        next.start();
      };
      if (audio.state === 'suspended') audio.resume().then(start).catch(() => {});
      else start();
    });
  }

  window.addEventListener('pointerdown', unlock, { once: true });
  window.addEventListener('keydown', unlock, { once: true });
  window.SFX = { play };

  // Prefetch the clip in the background; nothing plays until the lock is used.
  const warm = () => fetchClip();
  if ('requestIdleCallback' in window) requestIdleCallback(warm);
  else setTimeout(warm, 1200);
})();
