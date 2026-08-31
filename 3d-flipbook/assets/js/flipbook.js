(() => {
  'use strict';

  const app = document.getElementById('flipbookApp');
  if (!app) return;

  const pdfUrl = app.dataset.pdfUrl || '';
  if (!pdfUrl) return;

  const els = {
    loadingPanel: document.getElementById('loadingPanel'),
    loadingText: document.getElementById('loadingText'),
    loadingBar: document.getElementById('loadingBar'),
    bookWrap: document.getElementById('bookWrap'),
    book: document.getElementById('book'),
    leftPage: document.getElementById('leftPage'),
    rightPage: document.getElementById('rightPage'),
    turnLayer: document.getElementById('pageTurnLayer'),
    prevBtn: document.getElementById('prevBtn'),
    nextBtn: document.getElementById('nextBtn'),
    pageInput: document.getElementById('pageInput'),
    totalPages: document.getElementById('totalPages'),
    zoomInBtn: document.getElementById('zoomInBtn'),
    zoomOutBtn: document.getElementById('zoomOutBtn'),
    zoomResetBtn: document.getElementById('zoomResetBtn'),
    fullscreenBtn: document.getElementById('fullscreenBtn'),
    mobileFullscreenBtn: document.getElementById('mobileFullscreenBtn'),
    soundBtn: document.getElementById('soundBtn'),
    thumbBtn: document.getElementById('thumbBtn'),
    mobileThumbBtn: document.getElementById('mobileThumbBtn'),
    closeThumbBtn: document.getElementById('closeThumbBtn'),
    thumbnailPanel: document.getElementById('thumbnailPanel'),
    thumbnailList: document.getElementById('thumbnailList'),
    thumbCount: document.getElementById('thumbCount'),
    hotspotLeft: document.getElementById('pageHotspotLeft'),
    hotspotRight: document.getElementById('pageHotspotRight'),
    viewport: document.getElementById('bookViewport'),
    gestureHint: document.getElementById('gestureHint'),
    toast: document.getElementById('toast'),
  };

  const state = {
    pdf: null,
    total: 0,
    spread: 0,
    maxSpread: 0,
    images: [],
    ratios: [],
    animating: false,
    zoom: 1,
    sound: app.dataset.sound !== '0',
    audioContext: null,
    pointerStartX: null,
    pointerStartY: null,
    hintShown: false,
  };

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const TURN_MS = reducedMotion ? 1 : 920;

  pdfjsLib.GlobalWorkerOptions.workerSrc = 'assets/vendor/pdfjs/pdf.worker.min.js';

  async function boot() {
    try {
      setProgress(4, 'Opening PDF…');
      const task = pdfjsLib.getDocument({ url: pdfUrl });
      state.pdf = await task.promise;
      state.total = state.pdf.numPages;
      state.maxSpread = Math.ceil((state.total - 1) / 2);
      els.totalPages.textContent = state.total;
      els.thumbCount.textContent = `${state.total} page${state.total === 1 ? '' : 's'}`;

      setProgress(10, `Rendering ${state.total} pages…`);
      await renderPages();
      setPageRatio();
      buildThumbnails();
      renderSpread();
      setProgress(100, 'Ready');

      setTimeout(() => {
        els.loadingPanel.hidden = true;
        els.bookWrap.hidden = false;
        els.gestureHint.hidden = false;
        setTimeout(() => { els.gestureHint.hidden = true; }, 4500);
      }, reducedMotion ? 0 : 260);
    } catch (error) {
      console.error(error);
      showLoadError(error);
    }
  }

  async function renderPages() {
    state.images = new Array(state.total + 1);
    state.ratios = new Array(state.total + 1);
    const maxRenderHeight = window.innerWidth < 700 ? 1180 : 1500;

    for (let pageNum = 1; pageNum <= state.total; pageNum++) {
      const page = await state.pdf.getPage(pageNum);
      const base = page.getViewport({ scale: 1 });
      const renderScale = Math.min(2.25, Math.max(1, maxRenderHeight / base.height));
      const viewport = page.getViewport({ scale: renderScale });
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d', { alpha: false, willReadFrequently: false });
      canvas.width = Math.ceil(viewport.width);
      canvas.height = Math.ceil(viewport.height);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      await page.render({ canvasContext: ctx, viewport, intent: 'display' }).promise;

      state.ratios[pageNum] = viewport.width / viewport.height;
      state.images[pageNum] = await canvasToObjectUrl(canvas);
      canvas.width = 1;
      canvas.height = 1;
      page.cleanup();

      const pct = 10 + Math.round((pageNum / state.total) * 86);
      setProgress(pct, `Rendered page ${pageNum} of ${state.total}`);
      await nextFrame();
    }
  }

  function canvasToObjectUrl(canvas) {
    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        if (blob) {
          resolve(URL.createObjectURL(blob));
        } else {
          resolve(canvas.toDataURL('image/jpeg', 0.94));
        }
      }, 'image/webp', 0.94);
    });
  }

  function nextFrame() {
    return new Promise((resolve) => requestAnimationFrame(resolve));
  }

  function setPageRatio() {
    const ratio = state.ratios[1] || 0.707;
    els.book.style.setProperty('--page-ratio', String(ratio));
  }

  function setProgress(percent, message) {
    if (els.loadingBar) els.loadingBar.style.width = `${Math.max(0, Math.min(100, percent))}%`;
    if (els.loadingText) els.loadingText.textContent = message;
  }

  function showLoadError(error) {
    const message = error && error.message ? error.message : 'Unknown PDF error';
    els.loadingPanel.innerHTML = `
      <div class="empty-icon"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3l9 16H3L12 3z"/><path d="M12 9v4M12 17h.01"/></svg></div>
      <h1>Could not open this PDF</h1>
      <p>${escapeHtml(message)}</p>
      <p style="margin-top:12px">Check that the PDF exists inside <code>/pdf</code> and is not password-protected.</p>`;
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>'"]/g, (char) => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#039;','"':'&quot;'}[char]));
  }

  function spreadPages(spread = state.spread) {
    if (spread <= 0) return { left: null, right: state.total >= 1 ? 1 : null };
    const left = spread * 2;
    const right = left + 1;
    return {
      left: left <= state.total ? left : null,
      right: right <= state.total ? right : null,
    };
  }

  function renderSpread() {
    const pages = spreadPages();
    setBasePage(els.leftPage, pages.left);
    setBasePage(els.rightPage, pages.right);
    updateUi();
  }

  function setBasePage(el, pageNum) {
    el.replaceChildren();
    el.classList.toggle('is-blank', !pageNum);
    if (!pageNum) return;
    const img = document.createElement('img');
    img.src = state.images[pageNum];
    img.alt = `Page ${pageNum}`;
    img.draggable = false;
    el.appendChild(img);
  }

  function makeTurnFace(className, pageNum) {
    const face = document.createElement('div');
    face.className = `turn-face ${className}${pageNum ? '' : ' is-blank'}`;
    if (pageNum) {
      const img = document.createElement('img');
      img.src = state.images[pageNum];
      img.alt = '';
      img.draggable = false;
      face.appendChild(img);
    }
    return face;
  }

  function next() {
    if (state.animating || state.spread >= state.maxSpread) return;
    const oldPages = spreadPages(state.spread);
    const newPages = spreadPages(state.spread + 1);

    // Under the turning page: old left remains visible, new right is revealed.
    setBasePage(els.leftPage, oldPages.left);
    setBasePage(els.rightPage, newPages.right);
    animateTurn('next', oldPages.right, newPages.left, () => {
      state.spread += 1;
      renderSpread();
    });
  }

  function prev() {
    if (state.animating || state.spread <= 0) return;
    const oldPages = spreadPages(state.spread);
    const newPages = spreadPages(state.spread - 1);

    // Under the turning page: new left is revealed, old right remains until the leaf lands.
    setBasePage(els.leftPage, newPages.left);
    setBasePage(els.rightPage, oldPages.right);
    animateTurn('prev', oldPages.left, newPages.right, () => {
      state.spread -= 1;
      renderSpread();
    });
  }

  function animateTurn(direction, frontPage, backPage, onDone) {
    state.animating = true;
    updateUi();
    playFlipSound(direction);

    const sheet = document.createElement('div');
    sheet.className = `turn-sheet ${direction}`;
    sheet.style.setProperty('--turn-duration', `${TURN_MS}ms`);
    sheet.appendChild(makeTurnFace('front', frontPage));
    sheet.appendChild(makeTurnFace('back', backPage));
    els.turnLayer.appendChild(sheet);

    let finished = false;
    const finish = () => {
      if (finished) return;
      finished = true;
      sheet.remove();
      state.animating = false;
      onDone();
    };
    sheet.addEventListener('animationend', finish, { once: true });
    setTimeout(finish, TURN_MS + 100);
  }

  function goToPage(pageNum) {
    const n = Math.max(1, Math.min(state.total, Number(pageNum) || 1));
    const targetSpread = n === 1 ? 0 : Math.floor(n / 2);
    if (targetSpread === state.spread || state.animating) {
      updateUi(n);
      return;
    }

    // Nearby jumps use the full page-turn animation; larger jumps switch instantly.
    if (targetSpread === state.spread + 1) return next();
    if (targetSpread === state.spread - 1) return prev();

    state.spread = targetSpread;
    renderSpread();
    pulseBook();
  }

  function currentRepresentativePage() {
    if (state.spread === 0) return 1;
    const pages = spreadPages();
    return pages.left || pages.right || 1;
  }

  function updateUi(preferredInputPage) {
    const current = preferredInputPage || currentRepresentativePage();
    els.pageInput.value = current;
    els.prevBtn.disabled = state.spread <= 0 || state.animating;
    els.nextBtn.disabled = state.spread >= state.maxSpread || state.animating;
    els.hotspotLeft.disabled = state.spread <= 0 || state.animating;
    els.hotspotRight.disabled = state.spread >= state.maxSpread || state.animating;
    updateActiveThumb(current);
  }

  function buildThumbnails() {
    const fragment = document.createDocumentFragment();
    for (let pageNum = 1; pageNum <= state.total; pageNum++) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'thumb-item';
      button.dataset.page = pageNum;
      button.innerHTML = `
        <span class="thumb-image"><img src="${state.images[pageNum]}" alt="Preview of page ${pageNum}"></span>
        <span class="thumb-meta"><strong>Page ${pageNum}</strong><span>${pageNum === 1 ? 'Cover' : 'Company profile'}</span></span>`;
      button.addEventListener('click', () => {
        goToPage(pageNum);
        if (window.innerWidth < 900) toggleThumbnails(false);
      });
      fragment.appendChild(button);
    }
    els.thumbnailList.replaceChildren(fragment);
  }

  function updateActiveThumb(pageNum) {
    els.thumbnailList.querySelectorAll('.thumb-item.active').forEach((el) => el.classList.remove('active'));
    const target = els.thumbnailList.querySelector(`[data-page="${pageNum}"]`);
    if (target) target.classList.add('active');
  }

  function toggleThumbnails(force) {
    const shouldOpen = typeof force === 'boolean' ? force : !els.thumbnailPanel.classList.contains('open');
    els.thumbnailPanel.classList.toggle('open', shouldOpen);
    els.thumbnailPanel.setAttribute('aria-hidden', shouldOpen ? 'false' : 'true');
  }

  function setZoom(nextZoom) {
    state.zoom = Math.max(0.7, Math.min(2.2, Math.round(nextZoom * 10) / 10));
    els.bookWrap.style.transform = `scale(${state.zoom})`;
    els.zoomResetBtn.textContent = `${Math.round(state.zoom * 100)}%`;
    showToast(`Zoom ${Math.round(state.zoom * 100)}%`);
  }

  function pulseBook() {
    if (reducedMotion) return;
    els.book.animate([
      { transform: 'translateY(0)', filter: 'brightness(1)' },
      { transform: 'translateY(-2px)', filter: 'brightness(1.035)' },
      { transform: 'translateY(0)', filter: 'brightness(1)' },
    ], { duration: 280, easing: 'ease-out' });
  }

  function playFlipSound(direction) {
    if (!state.sound) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      if (!state.audioContext) state.audioContext = new AudioCtx();
      const ctx = state.audioContext;
      if (ctx.state === 'suspended') ctx.resume();

      const now = ctx.currentTime;
      const duration = 0.34;
      const buffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * duration), ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < data.length; i++) {
        const t = i / data.length;
        const envelope = Math.sin(Math.PI * Math.min(1, t * 1.35)) * Math.pow(1 - t, 1.45);
        const flutter = 0.65 + 0.35 * Math.sin(i * 0.115 + Math.sin(i * 0.006) * 2.5);
        data[i] = (Math.random() * 2 - 1) * envelope * flutter;
      }

      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.playbackRate.value = direction === 'next' ? 1.02 : 0.96;

      const band = ctx.createBiquadFilter();
      band.type = 'bandpass';
      band.frequency.value = 1250;
      band.Q.value = 0.65;

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.16, now + 0.035);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

      source.connect(band).connect(gain).connect(ctx.destination);
      source.start(now);

      // Soft paper landing tap.
      const osc = ctx.createOscillator();
      const tapGain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(118, now + 0.24);
      osc.frequency.exponentialRampToValueAtTime(72, now + 0.34);
      tapGain.gain.setValueAtTime(0.0001, now + 0.23);
      tapGain.gain.exponentialRampToValueAtTime(0.04, now + 0.255);
      tapGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.37);
      osc.connect(tapGain).connect(ctx.destination);
      osc.start(now + 0.23);
      osc.stop(now + 0.38);
    } catch (e) {
      // Audio is enhancement only; the flipbook remains fully functional without it.
    }
  }

  function toggleSound() {
    state.sound = !state.sound;
    els.soundBtn.classList.toggle('muted', !state.sound);
    els.soundBtn.setAttribute('aria-label', state.sound ? 'Mute page sound' : 'Enable page sound');
    showToast(state.sound ? 'Page sound on' : 'Page sound off');
    if (state.sound) playFlipSound('next');
  }

  async function toggleFullscreen() {
    try {
      if (!document.fullscreenElement) {
        await app.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (e) {
      showToast('Fullscreen is not available here');
    }
  }

  let toastTimer = null;
  function showToast(message) {
    clearTimeout(toastTimer);
    els.toast.textContent = message;
    els.toast.classList.add('show');
    toastTimer = setTimeout(() => els.toast.classList.remove('show'), 1400);
  }

  function bindEvents() {
    els.prevBtn.addEventListener('click', prev);
    els.nextBtn.addEventListener('click', next);
    els.hotspotLeft.addEventListener('click', prev);
    els.hotspotRight.addEventListener('click', next);
    els.pageInput.addEventListener('change', () => goToPage(els.pageInput.value));
    els.pageInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        goToPage(els.pageInput.value);
        els.pageInput.blur();
      }
    });

    els.zoomInBtn.addEventListener('click', () => setZoom(state.zoom + 0.1));
    els.zoomOutBtn.addEventListener('click', () => setZoom(state.zoom - 0.1));
    els.zoomResetBtn.addEventListener('click', () => setZoom(1));
    els.fullscreenBtn.addEventListener('click', toggleFullscreen);
    els.mobileFullscreenBtn.addEventListener('click', toggleFullscreen);
    els.soundBtn.addEventListener('click', toggleSound);
    els.soundBtn.classList.toggle('muted', !state.sound);

    els.thumbBtn.addEventListener('click', () => toggleThumbnails());
    els.mobileThumbBtn.addEventListener('click', () => toggleThumbnails());
    els.closeThumbBtn.addEventListener('click', () => toggleThumbnails(false));

    document.addEventListener('keydown', (e) => {
      if (['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) return;
      if (e.key === 'ArrowRight' || e.key === 'PageDown') { e.preventDefault(); next(); }
      else if (e.key === 'ArrowLeft' || e.key === 'PageUp') { e.preventDefault(); prev(); }
      else if (e.key === 'Home') { e.preventDefault(); goToPage(1); }
      else if (e.key === 'End') { e.preventDefault(); goToPage(state.total); }
      else if (e.key === '+' || e.key === '=') setZoom(state.zoom + 0.1);
      else if (e.key === '-') setZoom(state.zoom - 0.1);
      else if (e.key.toLowerCase() === 'f') toggleFullscreen();
      else if (e.key.toLowerCase() === 'm') toggleSound();
      else if (e.key === 'Escape') toggleThumbnails(false);
    });

    els.book.addEventListener('dblclick', () => setZoom(state.zoom === 1 ? 1.5 : 1));

    els.book.addEventListener('pointerdown', (e) => {
      if (e.button !== undefined && e.button !== 0) return;
      state.pointerStartX = e.clientX;
      state.pointerStartY = e.clientY;
    });
    window.addEventListener('pointerup', (e) => {
      if (state.pointerStartX === null) return;
      const dx = e.clientX - state.pointerStartX;
      const dy = e.clientY - state.pointerStartY;
      state.pointerStartX = null;
      state.pointerStartY = null;
      if (Math.abs(dx) < 55 || Math.abs(dx) < Math.abs(dy) * 1.2) return;
      if (dx < 0) next(); else prev();
    });

    els.viewport.addEventListener('wheel', (e) => {
      if (!(e.ctrlKey || e.metaKey)) return;
      e.preventDefault();
      setZoom(state.zoom + (e.deltaY < 0 ? 0.1 : -0.1));
    }, { passive: false });

    window.addEventListener('beforeunload', () => {
      state.images.forEach((url) => {
        if (typeof url === 'string' && url.startsWith('blob:')) URL.revokeObjectURL(url);
      });
    });
  }

  bindEvents();
  boot();
})();
