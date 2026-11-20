/* Compare table: check marks draw in row by row as the /pricing table scrolls into view, and hovering or
   focusing a row marks the tier where that capability starts (its first cell that isn't "Not included").
   Loaded only on pages with `compare: true` (currently /pricing). Without JS, or with reduced motion,
   every mark shows as is; the tier highlight still works under reduced motion. */
(function () {
  var root = document.querySelector(".assetas-compare");
  if (!root) return;
  var table = root.querySelector("table");
  var rows = [].slice.call(root.querySelectorAll("tbody tr:not(.group)"));

  rows.forEach(function (row) {
    var cells = [].slice.call(row.children).slice(1);
    for (var i = 0; i < cells.length; i++) {
      if (!cells[i].querySelector(".no")) { row.setAttribute("data-tier", i + 2); return; }
    }
  });

  function mark(row) {
    var tier = row && row.getAttribute("data-tier");
    if (tier) table.setAttribute("data-tier", tier); else table.removeAttribute("data-tier");
  }
  rows.forEach(function (row) {
    row.addEventListener("mouseenter", function () { mark(row); });
    row.addEventListener("focusin", function () { mark(row); });
  });
  table.addEventListener("mouseleave", function () { mark(null); });
  table.addEventListener("focusout", function (e) { if (!table.contains(e.relatedTarget)) mark(null); });

  if (!("IntersectionObserver" in window) || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  root.classList.add("is-armed");
  var io = new IntersectionObserver(function (entries) {
    var n = 0;
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      entry.target.style.setProperty("--row-delay", Math.min(n++, 8) * 45 + "ms");
      entry.target.classList.add("is-drawn");
      io.unobserve(entry.target);
    });
  }, { rootMargin: "0px 0px -8% 0px" });
  rows.forEach(function (row) { io.observe(row); });
})();
