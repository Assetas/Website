/* Flow walk-through (home, under the hero): plays a .flow panel as a timeline of scenes in one spot. Each element
   with data-at="n" appears at step n (.is-on); each with data-off="n" leaves at step n (.is-off). Scenes
   (.flow-scene) use both, so one fades out as the next comes in. The chapter buttons ([data-chapter], one per
   scene) mark the playing scene and jump to the start of theirs. After the last step it holds, fades everything
   out (.is-resetting) and starts again. It loops, so the panel carries data-loop: menu.js adds the pause button
   (WCAG 2.2.2) and .is-paused / .is-offscreen, and the timeline stands still on either, or while the tab is
   hidden. Loaded only on pages with `flow: true`. Without JS, or with reduced motion, the .is-poster scene shows
   finished and the chapter buttons stay hidden. */
(function () {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  // Step n starts at TIMES[n - 1] ms into the cycle (steps match the data-at / data-off numbers in index.njk).
  var TIMES = [
    300, 800, 1400, 1900, 2400, 3100, 4700, 6200,               // 1-8   capture offline (8: scene out)
    6500, 7200, 7800, 8400, 9000, 11600,                        // 9-14  the asset record
    11900, 12500, 13600, 14400, 16600,                          // 15-19 anomaly flag
    16900, 17400, 17800, 18200, 18600, 19700, 20200, 20800, 21400, 22000, 24200, // 20-30 route (24: cursor, 25: click)
    24500, 25100, 25600, 26200, 26900                           // 31-35 report
  ];
  var HOLD = 29800, FADE = 700, TICK = 100;

  [].forEach.call(document.querySelectorAll(".flow"), function (root) {
    var on = [].slice.call(root.querySelectorAll("[data-at]"));
    var off = [].slice.call(root.querySelectorAll("[data-off]"));
    var scenes = [].slice.call(root.querySelectorAll(".flow-scene"));
    var chapters = [].slice.call(root.querySelectorAll("[data-chapter]"));
    var row = root.querySelector(".flow-chapters");
    var t = 0, step = 0, shown = -1;

    function reset() {
      step = 0;
      on.forEach(function (el) { el.classList.remove("is-on"); });
      off.forEach(function (el) { el.classList.remove("is-off"); });
      root.classList.remove("is-resetting");
    }

    function mark() {
      var current = -1;
      scenes.forEach(function (scene, i) {
        if (scene.classList.contains("is-on") && !scene.classList.contains("is-off")) current = i;
      });
      chapters.forEach(function (button) {
        var here = +button.getAttribute("data-chapter") === current;
        button.classList.toggle("is-current", here);
        if (here) button.setAttribute("aria-current", "step"); else button.removeAttribute("aria-current");
        // On phones the chapters are one scrolling row: slide the playing one into view (the row only, not the page)
        if (here && current !== shown && row && row.scrollWidth > row.clientWidth) {
          row.scrollTo({ left: button.offsetLeft - row.offsetLeft, behavior: "smooth" });
        }
      });
      shown = current;
    }

    function advance() {
      while (step < TIMES.length && t >= TIMES[step]) {
        step++;
        on.forEach(function (el) { if (+el.getAttribute("data-at") === step) el.classList.add("is-on"); });
        off.forEach(function (el) { if (+el.getAttribute("data-off") === step) el.classList.add("is-off"); });
      }
      if (t >= HOLD) root.classList.add("is-resetting");
      if (t >= HOLD + FADE) { t = 0; reset(); }
      mark();
    }

    chapters.forEach(function (button) {
      button.addEventListener("click", function () {
        var scene = scenes[+button.getAttribute("data-chapter")];
        if (!scene) return;
        t = TIMES[+scene.getAttribute("data-at") - 1];
        reset();
        advance();
      });
    });

    root.classList.add("is-live");
    reset();
    mark();
    // Transitions only from the next frame, so the scenes hide at once instead of fading out on load
    requestAnimationFrame(function () { requestAnimationFrame(function () { root.classList.add("is-ready"); }); });
    setInterval(function () {
      if (document.hidden || root.classList.contains("is-paused") || root.classList.contains("is-offscreen")) return;
      t += TICK;
      advance();
    }, TICK);
  });
})();
