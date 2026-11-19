/* Card rails: a single scrolling row with arrows below. The markup works without
   this script (the row still scrolls); the arrows are the enhancement. */
(function () {
  var rails = document.querySelectorAll(".rail");
  Array.prototype.forEach.call(rails, function (rail) {
    var track = rail.querySelector(".rail-track");
    var controls = rail.querySelector(".rail-controls");
    var prev = rail.querySelector('[data-rail="prev"]');
    var next = rail.querySelector('[data-rail="next"]');
    if (!track || !prev || !next) return;

    function step() {
      var first = track.firstElementChild;
      if (!first) return track.clientWidth;
      var gap = parseFloat(getComputedStyle(track).columnGap) || 0;
      return first.getBoundingClientRect().width + gap;
    }

    function update() {
      var max = track.scrollWidth - track.clientWidth;
      var overflows = max > 2;
      if (controls) controls.hidden = !overflows;
      prev.disabled = track.scrollLeft <= 1;
      next.disabled = track.scrollLeft >= max - 1;
    }

    function go(dir) {
      var still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      track.scrollBy({ left: dir * step(), behavior: still ? "auto" : "smooth" });
    }

    prev.addEventListener("click", function () { go(-1); });
    next.addEventListener("click", function () { go(1); });
    track.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    update();
  });
})();
