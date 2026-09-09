/* Page-level custom scrollbar (viewport type): native bars are hidden via CSS;
 * this drives a fixed track+thumb using window scroll metrics. Zero deps. */
(function () {
  const THUMB_MIN = 30;

  const track = document.createElement('div');
  track.className = 'ka-scrollbar-track ka-scrollbar-track-page';
  track.setAttribute('aria-hidden', 'true');
  const thumb = document.createElement('div');
  thumb.className = 'ka-scrollbar-thumb';
  track.appendChild(thumb);
  document.body.appendChild(track);

  const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

  function update() {
    const doc = document.documentElement;
    const scrollH = doc.scrollHeight;
    const clientH = window.innerHeight;
    const trackH = track.clientHeight;
    if (scrollH <= clientH + 1 || trackH <= 0) {
      track.style.display = 'none';
      return;
    }
    track.style.display = 'block';
    /* thumb height: ideal = track * visible-ratio, clamped to 45%~60% of track */
    const minH = Math.max(THUMB_MIN, Math.round(trackH * 0.45));
    const maxH = Math.max(minH, Math.round(trackH * 0.6));
    const thumbH = clamp(Math.floor((trackH * clientH) / scrollH), minH, maxH);
    const maxScroll = scrollH - clientH;
    const ratio = maxScroll > 0 ? window.scrollY / maxScroll : 0;
    thumb.style.height = thumbH + 'px';
    thumb.style.transform = `translateY(${Math.round(ratio * (trackH - thumbH))}px)`;
  }

  /* thumb drag (viewport type → window.scrollTo) */
  thumb.addEventListener('mousedown', (e) => {
    e.preventDefault();
    const offsetY = e.clientY - thumb.getBoundingClientRect().top;
    function onMove(ev: MouseEvent) {
      const doc = document.documentElement;
      const scrollH = doc.scrollHeight;
      const clientH = window.innerHeight;
      const trackH = track.clientHeight;
      const thumbH = thumb.offsetHeight;
      if (scrollH <= clientH || trackH <= thumbH) return;
      const rect = track.getBoundingClientRect();
      const y = clamp(ev.clientY - rect.top - offsetY, 0, trackH - thumbH);
      window.scrollTo(0, (y / (trackH - thumbH)) * (scrollH - clientH));
    }
    function onUp() {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    }
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  });

  /* track click (outside thumb) = jump one page */
  track.addEventListener('mousedown', (e) => {
    if (e.target === thumb) return;
    const rect = track.getBoundingClientRect();
    const dir = e.clientY < rect.top + thumb.offsetTop ? -1 : 1;
    window.scrollTo(0, window.scrollY + dir * window.innerHeight * 0.9);
  });

  window.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', update);
  if ('ResizeObserver' in window) {
    new ResizeObserver(update).observe(document.documentElement);
  }
  /* SPA route changes re-render body content */
  let pending = false;
  new MutationObserver(() => {
    if (pending) return;
    pending = true;
    requestAnimationFrame(() => {
      pending = false;
      update();
    });
  }).observe(document.body, { childList: true, subtree: true });

  update();
})();
