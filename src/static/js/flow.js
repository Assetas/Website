/* Flow walk-through (home, under the hero): plays a .flow panel as a timeline. Each element with data-at="n"
   appears at step n (.is-on); each with data-off="n" leaves at step n (.is-off); data-leave="n" marks a card
   .is-left, which the CSS uses below 64rem to play the cards one at a time in one spot. After the last step it holds,
   fades everything out (.is-resetting) and starts again. It loops, so the panel carries data-loop: menu.js adds
   the pause button (WCAG 2.2.2) and .is-paused / .is-offscreen, and the timeline stands still on either, or
   while the tab is hidden. Loaded only on pages with `flow: true`. Without JS, or with reduced motion, every
   card shows finished. */
(function () {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  // Step n starts at TIMES[n - 1] ms into the cycle.
  var TIMES = [300, 900, 1400, 1900, 2500, 3600, 4000, 4700, 5400, 6000, 6600, 7400, 8100, 8700, 9500, 10200];
  var HOLD = 13800, FADE = 700, TICK = 100;

  [].forEach.call(document.querySelectorAll(".flow"), function (root) {
    var on = [].slice.call(root.querySelectorAll("[data-at]"));
    var off = [].slice.call(root.querySelectorAll("[data-off]"));
    // data-leave="n": a card leaves at step n, but only where the CSS plays one card at a time (narrow screens)
    var leave = [].slice.call(root.querySelectorAll("[data-leave]"));
    var t = 0, step = 0;

    function reset() {
      step = 0;
      on.forEach(function (el) { el.classList.remove("is-on"); });
      off.forEach(function (el) { el.classList.remove("is-off"); });
      leave.forEach(function (el) { el.classList.remove("is-left"); });
      root.classList.remove("is-resetting");
    }

    function advance() {
      while (step < TIMES.length && t >= TIMES[step]) {
        step++;
        on.forEach(function (el) { if (+el.getAttribute("data-at") === step) el.classList.add("is-on"); });
        off.forEach(function (el) { if (+el.getAttribute("data-off") === step) el.classList.add("is-off"); });
        leave.forEach(function (el) { if (+el.getAttribute("data-leave") === step) el.classList.add("is-left"); });
      }
      if (t >= HOLD) root.classList.add("is-resetting");
      if (t >= HOLD + FADE) { t = 0; reset(); }
    }

    root.classList.add("is-live");
    reset();
    // Transitions only from the next frame, so the cards hide at once instead of fading out on load
    requestAnimationFrame(function () { requestAnimationFrame(function () { root.classList.add("is-ready"); }); });
    setInterval(function () {
      if (document.hidden || root.classList.contains("is-paused") || root.classList.contains("is-offscreen")) return;
      t += TICK;
      advance();
    }, TICK);
  });
})();
