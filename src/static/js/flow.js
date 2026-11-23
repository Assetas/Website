/* Flow film (home, under the hero): plays a .flow panel as a timeline of scenes in one spot, the way a product
   film runs. All timing lives in the markup, in milliseconds from the start of the loop:
     data-at="ms"          the element shows from then (.is-on)
     data-off="ms"         ...and hides from then (.is-off); scenes and screenshots use both
     .flow-pointer data-path="ms:x,y ms:x,y! ..."   the cursor glides to x%,y% of the window at each time; "!" clicks
     .flow-typed data-type="elm" data-type-at="ms" data-speed="ms"   types the word from then, one letter per data-speed
     video.flow-video data-rate="0.5"               plays from its data-at at that rate, once, until its scene ends
     .flow data-hold="ms" data-cycle="ms"           everything fades out at hold, and the loop restarts at cycle
   The chapter buttons ([data-chapter], one per .flow-scene) mark the playing scene and jump to its start. The
   panel carries data-loop, so menu.js adds the pause button (WCAG 2.2.2) and .is-paused / .is-offscreen; the
   timeline and the video stand still on either, or while the tab is hidden. Loaded only on pages with
   `flow: true`. Without JS, or with reduced motion, the .is-poster scene shows its last screen and the chapter
   buttons stay hidden. */
(function () {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  var TICK = 100;

  [].forEach.call(document.querySelectorAll(".flow"), function (root) {
    var all = function (sel) { return [].slice.call(root.querySelectorAll(sel)); };
    var on = all("[data-at]"), off = all("[data-off]"), scenes = all(".flow-scene"), chapters = all("[data-chapter]");
    var typed = all(".flow-typed"), videos = all("video.flow-video");
    var row = root.querySelector(".flow-chapters");
    var hold = +root.getAttribute("data-hold"), cycle = +root.getAttribute("data-cycle");
    var t = 0, prev = 0, shown = -1;

    var pointers = all(".flow-pointer").map(function (el) {
      var stops = el.getAttribute("data-path").trim().split(/\s+/).map(function (stop) {
        var m = stop.match(/^(\d+):([\d.]+),([\d.]+)(!?)$/);
        return { at: +m[1], x: m[2], y: m[3], click: m[4] === "!" };
      });
      return { el: el, stops: stops, at: -1 };
    });

    function sceneOf(el) { return el.closest(".flow-scene"); }
    function running() { return !(document.hidden || root.classList.contains("is-paused") || root.classList.contains("is-offscreen")); }

    function render() {
      on.forEach(function (el) { el.classList.toggle("is-on", t >= +el.getAttribute("data-at")); });
      off.forEach(function (el) { el.classList.toggle("is-off", t >= +el.getAttribute("data-off")); });

      pointers.forEach(function (p) {
        var stop = p.stops[0];
        p.stops.forEach(function (s) { if (t >= s.at) stop = s; });
        if (stop.at !== p.at) {
          p.el.style.left = stop.x + "%";
          p.el.style.top = stop.y + "%";
          p.at = stop.at;
        }
        p.stops.forEach(function (s) {
          if (s.click && prev < s.at && t >= s.at) {
            p.el.classList.add("is-click");
            setTimeout(function () { p.el.classList.remove("is-click"); }, 450);
          }
        });
      });

      typed.forEach(function (el) {
        var word = el.getAttribute("data-type"), at = +(el.getAttribute("data-type-at") || el.getAttribute("data-at")), speed = +el.getAttribute("data-speed") || 250;
        var n = t < at ? 0 : Math.min(word.length, Math.floor((t - at) / speed) + 1);
        var text = word.slice(0, n);
        if (el.firstChild.nodeValue !== text) el.firstChild.nodeValue = text;
      });

      videos.forEach(function (v) {
        var scene = sceneOf(v), at = +v.getAttribute("data-at");
        var live = t >= at && !(scene && scene.classList.contains("is-off"));
        if (live) {
          if (!v.hasAttribute("data-started")) {
            v.setAttribute("data-started", "");
            v.currentTime = 0;
            v.defaultPlaybackRate = v.playbackRate = +v.getAttribute("data-rate") || 1;
            if (running()) v.play().catch(function () {});
          } else if (v.paused && !v.ended && running()) {
            v.play().catch(function () {});
          }
        } else if (v.hasAttribute("data-started")) {
          v.removeAttribute("data-started");
          v.pause();
          v.currentTime = 0;
        }
      });

      root.classList.toggle("is-resetting", t >= hold);

      var current = -1;
      scenes.forEach(function (scene, i) { if (scene.classList.contains("is-on") && !scene.classList.contains("is-off")) current = i; });
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

    chapters.forEach(function (button) {
      button.addEventListener("click", function () {
        var scene = scenes[+button.getAttribute("data-chapter")];
        if (!scene) return;
        t = prev = +scene.getAttribute("data-at");
        render();
      });
    });

    root.classList.add("is-live");
    render();
    // Transitions only from the next frame, so the scenes hide at once instead of fading out on load
    requestAnimationFrame(function () { requestAnimationFrame(function () { root.classList.add("is-ready"); }); });

    setInterval(function () {
      if (!running()) {
        videos.forEach(function (v) { if (!v.paused) v.pause(); });
        return;
      }
      prev = t;
      t += TICK;
      if (t >= cycle) { t = prev = 0; }
      render();
    }, TICK);
  });
})();
