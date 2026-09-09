/* KeyAtlas custom overlay scrollbars.
 * Native scrollbars (incl. arrow buttons) are hidden via CSS; this script
 * drives a thin track+thumb overlay instead. Zero dependencies.
 * All containers here are "bounded" type (element-own scroll metrics). */
(function () {
  "use strict";

  var CONTAINER_SELECTOR = ".content, .settings-body, .detail-drawer-panel";
  var THUMB_MIN = 30;
  var updaters = [];

  function clamp(v, min, max) {
    return Math.min(max, Math.max(min, v));
  }

  function attach(el) {
    if (!el || el.dataset.kaScrollbar) return;
    el.dataset.kaScrollbar = "1";

    /* the absolute-positioned track needs a positioned container */
    if (getComputedStyle(el).position === "static") {
      el.style.position = "relative";
    }

    var track = document.createElement("div");
    track.className = "ka-scrollbar-track";
    track.setAttribute("aria-hidden", "true");
    var thumb = document.createElement("div");
    thumb.className = "ka-scrollbar-thumb";
    track.appendChild(thumb);
    el.appendChild(track);

    function update() {
      var scrollH = el.scrollHeight;
      var clientH = el.clientHeight;
      var trackH = track.clientHeight;
      if (scrollH <= clientH + 1 || trackH <= 0) {
        track.style.display = "none";
        return;
      }
      track.style.display = "block";
      /* thumb height: ideal = track * visible-ratio, clamped to 45%~60% of track */
      var minH = Math.max(THUMB_MIN, Math.round(trackH * 0.45));
      var maxH = Math.max(minH, Math.round(trackH * 0.6));
      var thumbH = clamp(Math.floor(trackH * (clientH / scrollH)), minH, maxH);
      var maxScroll = scrollH - clientH;
      var ratio = maxScroll > 0 ? el.scrollTop / maxScroll : 0;
      thumb.style.height = thumbH + "px";
      thumb.style.transform = "translateY(" + Math.round(ratio * (trackH - thumbH)) + "px)";
    }

    /* thumb drag */
    thumb.addEventListener("mousedown", function (e) {
      e.preventDefault();
      e.stopPropagation();
      var offsetY = e.clientY - thumb.getBoundingClientRect().top;
      function onMove(ev) {
        var scrollH = el.scrollHeight;
        var clientH = el.clientHeight;
        var trackH = track.clientHeight;
        var thumbH = thumb.offsetHeight;
        if (scrollH <= clientH || trackH <= thumbH) return;
        var rect = track.getBoundingClientRect();
        var y = clamp(ev.clientY - rect.top - offsetY, 0, trackH - thumbH);
        el.scrollTop = (y / (trackH - thumbH)) * (scrollH - clientH);
      }
      function onUp() {
        document.removeEventListener("mousemove", onMove);
        document.removeEventListener("mouseup", onUp);
      }
      document.addEventListener("mousemove", onMove);
      document.addEventListener("mouseup", onUp);
    });

    /* track click (outside thumb) = jump one page */
    track.addEventListener("mousedown", function (e) {
      if (e.target === thumb) return;
      var rect = track.getBoundingClientRect();
      var dir = e.clientY < rect.top + thumb.offsetTop ? -1 : 1;
      el.scrollTop += dir * el.clientHeight * 0.9;
    });

    el.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    if (window.ResizeObserver) {
      new ResizeObserver(update).observe(el);
    }
    /* list re-renders change scrollHeight but not container size */
    if (window.MutationObserver) {
      var pending = false;
      new MutationObserver(function () {
        if (pending) return;
        pending = true;
        requestAnimationFrame(function () {
          pending = false;
          update();
        });
      }).observe(el, { childList: true, subtree: true });
    }

    updaters.push(update);
    update();
  }

  function init() {
    document.querySelectorAll(CONTAINER_SELECTOR).forEach(attach);
  }

  window.KeyAtlasScrollbars = {
    updateAll: function () {
      updaters.forEach(function (fn) {
        fn();
      });
    },
  };

  init();
})();
