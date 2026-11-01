// Full-screen photo cropper: drag to position, pinch / slider / wheel to zoom.
// cropPhoto(file, { width, height, round }) resolves to a JPEG data URL of exactly
// width×height (default 1600×900), or null if cancelled. round shows a circular guide.
const Cropper = (() => {
  const MAX_FILE_MB = 30;
  const WORK_MAX = 4096; // huge photos are scaled down to this before cropping
  const MIN_SIDE = 320;
  const MAX_ZOOM = 4;

  // Decodes the file and returns a canvas no bigger than WORK_MAX on its long side.
  async function loadWorking(file) {
    let src = null;
    if ('createImageBitmap' in window) {
      try { src = await createImageBitmap(file); } catch { src = null; }
    }
    if (!src) {
      const url = URL.createObjectURL(file);
      try {
        src = await new Promise((resolve, reject) => {
          const img = new Image();
          img.onload = () => resolve(img);
          img.onerror = reject;
          img.src = url;
        });
      } finally {
        URL.revokeObjectURL(url);
      }
    }
    const scale = Math.min(1, WORK_MAX / Math.max(src.width, src.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(src.width * scale);
    canvas.height = Math.round(src.height * scale);
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(src, 0, 0, canvas.width, canvas.height);
    src.close?.();
    return canvas;
  }

  async function cropPhoto(file, { width = 1600, height = 900, round = false } = {}) {
    if (!file.type.startsWith('image/')) throw new Error('That file is not an image.');
    if (file.size > MAX_FILE_MB * 1024 * 1024) throw new Error(`Photo is too large. Please choose one under ${MAX_FILE_MB} MB.`);
    const work = await loadWorking(file);
    if (Math.min(work.width, work.height) < MIN_SIDE) throw new Error('Photo is too small. Please choose a larger one.');
    return openEditor(work, width, height, round);
  }

  function openEditor(work, OUT_W, OUT_H, round) {
    const el = document.createElement('div');
    el.className = 'cropper';
    el.innerHTML = `
      <div class="cropper-head">
        <button type="button" class="crop-cancel">Cancel</button>
        <h2>Move and Scale</h2>
        <button type="button" class="crop-done">Use Photo</button>
      </div>
      <div class="crop-stage"><div class="crop-frame"></div></div>
      <div class="crop-tools">
        <input type="range" class="crop-zoom" min="1" max="${MAX_ZOOM}" step="0.01" value="1" aria-label="Zoom">
        <p>Drag to position · pinch or slide to zoom</p>
      </div>`;
    document.body.appendChild(el);
    const frame = el.querySelector('.crop-frame');
    frame.style.aspectRatio = `${OUT_W} / ${OUT_H}`;
    frame.classList.toggle('round', round);
    const slider = el.querySelector('.crop-zoom');
    frame.appendChild(work);

    const fw = frame.clientWidth;
    const fh = frame.clientHeight;
    const base = Math.max(fw / work.width, fh / work.height); // smallest scale that fills the frame
    let s = base;
    let x = (fw - work.width * s) / 2;
    let y = (fh - work.height * s) / 2;

    function render() {
      x = Math.min(0, Math.max(fw - work.width * s, x));
      y = Math.min(0, Math.max(fh - work.height * s, y));
      work.style.width = `${work.width * s}px`;
      work.style.height = `${work.height * s}px`;
      work.style.transform = `translate(${x}px, ${y}px)`;
      slider.value = s / base;
    }

    // Zoom to a new scale keeping the point (cx, cy) in the frame fixed.
    function zoomTo(next, cx = fw / 2, cy = fh / 2) {
      next = Math.min(base * MAX_ZOOM, Math.max(base, next));
      x = cx - (cx - x) * (next / s);
      y = cy - (cy - y) * (next / s);
      s = next;
      render();
    }

    const pointers = new Map();
    let pinch = null;
    const local = (e) => {
      const r = frame.getBoundingClientRect();
      return { x: e.clientX - r.left, y: e.clientY - r.top };
    };
    function pinchInfo() {
      const [a, b] = [...pointers.values()];
      return { dist: Math.hypot(a.x - b.x, a.y - b.y), mx: (a.x + b.x) / 2, my: (a.y + b.y) / 2 };
    }

    frame.addEventListener('pointerdown', (e) => {
      frame.setPointerCapture(e.pointerId);
      pointers.set(e.pointerId, local(e));
      pinch = pointers.size === 2 ? pinchInfo() : null;
    });
    frame.addEventListener('pointermove', (e) => {
      const prev = pointers.get(e.pointerId);
      if (!prev) return;
      const cur = local(e);
      pointers.set(e.pointerId, cur);
      if (pointers.size === 1) {
        x += cur.x - prev.x;
        y += cur.y - prev.y;
        render();
      } else if (pinch) {
        const now = pinchInfo();
        x += now.mx - pinch.mx;
        y += now.my - pinch.my;
        zoomTo(s * (now.dist / pinch.dist), now.mx, now.my);
        pinch = now;
      }
    });
    const release = (e) => {
      pointers.delete(e.pointerId);
      pinch = pointers.size === 2 ? pinchInfo() : null;
    };
    frame.addEventListener('pointerup', release);
    frame.addEventListener('pointercancel', release);
    frame.addEventListener('wheel', (e) => {
      e.preventDefault();
      const p = local(e);
      zoomTo(s * Math.exp(-e.deltaY / 400), p.x, p.y);
    }, { passive: false });
    slider.addEventListener('input', () => zoomTo(base * Number(slider.value)));

    render();
    requestAnimationFrame(() => el.classList.add('open'));

    return new Promise((resolve) => {
      function close(result) {
        el.remove();
        resolve(result);
      }
      el.querySelector('.crop-cancel').onclick = () => close(null);
      el.querySelector('.crop-done').onclick = () => {
        const out = document.createElement('canvas');
        out.width = OUT_W;
        out.height = OUT_H;
        const ctx = out.getContext('2d');
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(work, -x / s, -y / s, fw / s, fh / s, 0, 0, OUT_W, OUT_H);
        close(out.toDataURL('image/jpeg', 0.85));
      };
    });
  }

  return { cropPhoto };
})();
