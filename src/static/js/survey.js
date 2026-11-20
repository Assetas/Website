/* Survey map: a diagram of one facility record branching to pads, equipment and components, drawn
   on <canvas class="survey-canvas"> inside .survey-map. Loaded only on pages with `survey: true` (currently
   /ldar). Pulses run from the record out to components; amber dots are leak findings that flare, with a "WO" (work order) tag, when a pulse
   reaches them. Colors come from the --color-survey-* tokens. It pauses offscreen and in a background tab,
   has a pause button (WCAG 2.2.2: motion over 5 s needs one) and draws a single still frame when the visitor
   prefers reduced motion. */
(function () {
  var canvas = document.querySelector(".survey-canvas");
  if (!canvas || !canvas.getContext) return;
  var ctx = canvas.getContext("2d");
  var box = canvas.parentElement;

  var css = getComputedStyle(document.documentElement);
  function rgb(name) {
    var v = css.getPropertyValue(name).trim().replace("#", "");
    if (v.length === 3) v = v.replace(/./g, "$&$&");
    var n = parseInt(v, 16);
    return [n >> 16 & 255, n >> 8 & 255, n & 255];
  }
  function rgba(c, a) { return "rgba(" + c[0] + "," + c[1] + "," + c[2] + "," + a + ")"; }
  var LINE = rgb("--color-survey-line"), INK = rgb("--color-survey-ink"), PULSE = rgb("--color-survey-pulse"),
      LEAK = rgb("--color-survey-leak"), RING = rgb("--color-survey-ring");
  var FONT = css.getPropertyValue("--font-body").trim() || "sans-serif";

  var EQUIPMENT = ["Wellhead", "Separator", "Tank battery", "Compressor", "Dehydrator", "Pneumatics", "Flare", "Meter run"];
  var seed, root, leaves, size = "";

  // The same diagram on every visit: a small seeded generator instead of Math.random
  function rand() { seed = seed * 16807 % 2147483647; return (seed - 1) / 2147483646; }

  // Root (labeled Assetas Dispatch) > pads > equipment > components; fewer branches on narrow screens
  function build(narrow) {
    seed = 11;
    leaves = [];
    root = { label: "Assetas Dispatch", kids: [] };
    var pads = narrow ? 2 : 4, k = 0;
    for (var p = 0; p < pads; p++) {
      var pad = { label: "Pad " + "ABCD".charAt(p), kids: [] };
      var eq = narrow ? 2 : 2 + Math.floor(rand() * 2);
      for (var e = 0; e < eq; e++) {
        var unit = { label: EQUIPMENT[k++ % EQUIPMENT.length], kids: [] };
        var comps = narrow ? 3 + Math.floor(rand() * 2) : 3 + Math.floor(rand() * 3);
        for (var c = 0; c < comps; c++) {
          var leaf = { leak: false, hit: -99 };
          unit.kids.push(leaf);
          leaves.push(leaf);
        }
        pad.kids.push(unit);
      }
      root.kids.push(pad);
    }
    // A handful of leak findings, spread out rather than clumped
    for (var i = 2; i < leaves.length; i += 5 + Math.floor(rand() * 5)) leaves[i].leak = true;
  }

  var w = 0, h = 0;
  function resize() {
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = box.clientWidth; h = box.clientHeight;
    var narrow = w < 640 ? "narrow" : "wide";
    if (narrow !== size) { size = narrow; build(narrow === "narrow"); }
    var pw = Math.max(1, Math.round(w * dpr)), ph = Math.max(1, Math.round(h * dpr));
    if (canvas.width !== pw || canvas.height !== ph) { canvas.width = pw; canvas.height = ph; }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    layout();
  }

  // Components across the top, the record at the bottom center; each parent sits over its children
  function layout() {
    var pad = w < 640 ? 24 : 56, n = leaves.length;
    var levelY = [h - 30, h * 0.68, h * 0.42, h * 0.16];
    leaves.forEach(function (l, i) { l.x = pad + i * (w - 2 * pad) / (n - 1); l.y = levelY[3]; });
    (function place(node, depth) {
      node.y = levelY[depth];
      if (!node.kids) return;
      node.kids.forEach(function (k) { place(k, depth + 1); });
      node.x = node.kids.reduce(function (s, k) { return s + k.x; }, 0) / node.kids.length;
      node.bus = (levelY[depth] + levelY[depth + 1]) / 2;
    })(root, 0);
    root.x = w / 2;
    // Each component's route from the record, for the pulses
    (function route(node, path) {
      if (!node.kids) { node.path = path.concat([[node.x, node.y]]); measure(node); return; }
      node.kids.forEach(function (k) {
        route(k, path.concat([[node.x, node.y], [node.x, node.bus], [k.x, node.bus]]));
      });
    })(root, []);
  }
  function measure(leaf) {
    leaf.len = [0];
    for (var i = 1; i < leaf.path.length; i++) {
      var a = leaf.path[i - 1], b = leaf.path[i];
      leaf.len.push(leaf.len[i - 1] + Math.abs(b[0] - a[0]) + Math.abs(b[1] - a[1]));
    }
  }
  function pointAt(leaf, d) {
    var L = leaf.len, P = leaf.path;
    for (var i = 1; i < P.length; i++) {
      if (d <= L[i] || i === P.length - 1) {
        var seg = L[i] - L[i - 1] || 1, f = Math.max(0, Math.min(1, (d - L[i - 1]) / seg));
        return [P[i - 1][0] + (P[i][0] - P[i - 1][0]) * f, P[i - 1][1] + (P[i][1] - P[i - 1][1]) * f, i];
      }
    }
  }

  var pulses = [], nextPulse = 0, PULSE_TIME = 1.5, TAIL = 70, WO_TIME = 1.8;

  // A "WO" tag that rises above a leak finding when a pulse reaches it: the finding becomes a work order
  function workOrder(l, since) {
    var a = Math.min(1, since / 0.15) * Math.min(1, (WO_TIME - since) / 0.5);
    var rise = 4 * Math.min(1, since / 0.3), tw = 24, th = 15, x = l.x - tw / 2, y = l.y - 14 - th - rise;
    ctx.fillStyle = rgba(RING, a);
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(x, y, tw, th, 3); else ctx.rect(x, y, tw, th);
    ctx.fill();
    ctx.fillStyle = rgba(LEAK, a);
    ctx.font = "700 9px " + FONT;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("WO", l.x, y + th / 2 + 0.5);
  }

  function draw(t, moving) {
    resize();
    ctx.clearRect(0, 0, w, h);
    ctx.lineCap = "square";

    // Routes: down from each parent to a bus, across, then down to each child
    ctx.strokeStyle = rgba(LINE, 0.5);
    ctx.lineWidth = 1;
    ctx.beginPath();
    (function routes(node) {
      if (!node.kids) return;
      var xs = node.kids.map(function (k) { return k.x; }).concat(node.x);
      ctx.moveTo(Math.round(node.x) + 0.5, node.y); ctx.lineTo(Math.round(node.x) + 0.5, Math.round(node.bus) + 0.5);
      ctx.moveTo(Math.min.apply(null, xs), Math.round(node.bus) + 0.5); ctx.lineTo(Math.max.apply(null, xs), Math.round(node.bus) + 0.5);
      node.kids.forEach(function (k) {
        ctx.moveTo(Math.round(k.x) + 0.5, Math.round(node.bus) + 0.5); ctx.lineTo(Math.round(k.x) + 0.5, k.y);
        routes(k);
      });
    })(root);
    ctx.stroke();

    // Pulses: a short bright run along a route, ending at a component
    if (moving) {
      if (t > nextPulse) {
        pulses.push({ leaf: leaves[Math.floor(rand() * leaves.length)], start: t });
        nextPulse = t + 0.3 + rand() * 0.35;
      }
      ctx.lineWidth = 2;
      ctx.lineJoin = "round";
      pulses = pulses.filter(function (p) {
        var k = (t - p.start) / PULSE_TIME;
        if (k >= 1) { p.leaf.hit = t; return false; }
        var total = p.leaf.len[p.leaf.len.length - 1], d1 = total * (1 - Math.pow(1 - k, 2)), d0 = Math.max(0, d1 - TAIL);
        var a = pointAt(p.leaf, d0), b = pointAt(p.leaf, d1);
        var g = ctx.createLinearGradient(a[0], a[1], b[0], b[1]);
        g.addColorStop(0, rgba(PULSE, 0));
        g.addColorStop(1, rgba(PULSE, 1));
        ctx.strokeStyle = g;
        ctx.beginPath(); ctx.moveTo(a[0], a[1]);
        for (var i = a[2]; i < b[2]; i++) ctx.lineTo(p.leaf.path[i][0], p.leaf.path[i][1]);
        ctx.lineTo(b[0], b[1]); ctx.stroke();
        return true;
      });
    }

    // Junctions: the record as a ringed blue node, pads and equipment as small navy squares
    (function nodes(node, depth) {
      if (!node.kids) return;
      if (depth === 0) {
        ctx.fillStyle = rgba(PULSE, 1);
        ctx.beginPath(); ctx.arc(node.x, node.y, 5, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = rgba(PULSE, 0.45); ctx.lineWidth = 1;
        ctx.beginPath(); ctx.arc(node.x, node.y, 10, 0, Math.PI * 2); ctx.stroke();
      } else {
        var s = depth === 1 ? 7 : 5;
        ctx.fillStyle = rgba(INK, 1);
        ctx.fillRect(node.x - s / 2, node.y - s / 2, s, s);
      }
      node.kids.forEach(function (k) { nodes(k, depth + 1); });
    })(root, 0);

    // Labels: the record always; pads from tablet width; equipment only where there is room
    ctx.fillStyle = rgba(INK, 0.85);
    ctx.textBaseline = "middle";
    ctx.font = "600 12px " + FONT;
    ctx.textAlign = "left";
    ctx.fillText(root.label, root.x + 16, root.y);
    ctx.font = "500 11px " + FONT;
    root.kids.forEach(function (pad) {
      ctx.fillText(pad.label, pad.x + 9, pad.y);
      if (w >= 900) pad.kids.forEach(function (unit) { ctx.fillText(unit.label, unit.x + 8, unit.y); });
    });

    // Components: navy dots that flash blue when a pulse arrives; leak findings amber, ringed in navy, with a halo
    leaves.forEach(function (l) {
      var since = t - l.hit, flare = since >= 0 && since < 1.6 ? 1 - since / 1.6 : 0;
      if (l.leak) {
        ctx.fillStyle = rgba(LEAK, 0.25 + 0.45 * flare);
        ctx.beginPath(); ctx.arc(l.x, l.y, 9 + 10 * (1 - flare) * (flare > 0 ? 1 : 0), 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = rgba(LEAK, 1);
        ctx.strokeStyle = rgba(RING, 1);
        ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.arc(l.x, l.y, 4.5, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        if (since >= 0 && since < WO_TIME) workOrder(l, since);
      } else {
        ctx.fillStyle = flare > 0.05 ? rgba(PULSE, 0.6 + 0.4 * flare) : rgba(INK, 0.6);
        ctx.beginPath(); ctx.arc(l.x, l.y, 3 + flare * 2, 0, Math.PI * 2); ctx.fill();
      }
    });
  }

  var still = window.matchMedia("(prefers-reduced-motion: reduce)");
  var paused = false, visible = true, raf = 0, clock = 0, last = 0;

  function frame(now) {
    if (last) clock += Math.min(now - last, 100) / 1000;
    last = now;
    draw(clock, true);
    raf = requestAnimationFrame(frame);
  }
  function update() {
    var run = !paused && visible && !document.hidden && !still.matches;
    if (run && !raf) { last = 0; raf = requestAnimationFrame(frame); }
    if (!run && raf) { cancelAnimationFrame(raf); raf = 0; }
    button.hidden = still.matches;
  }

  var button = document.createElement("button");
  button.type = "button";
  button.className = "survey-toggle";
  var PAUSE = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z"/></svg>';
  var PLAY = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>';
  function label() {
    button.innerHTML = paused ? PLAY : PAUSE;
    button.setAttribute("aria-label", paused ? "Play survey animation" : "Pause survey animation");
  }
  button.addEventListener("click", function () { paused = !paused; label(); update(); });
  label();
  box.appendChild(button);

  if ("IntersectionObserver" in window) {
    new IntersectionObserver(function (entries) { visible = entries[0].isIntersecting; update(); }).observe(canvas);
  }
  document.addEventListener("visibilitychange", update);
  if (still.addEventListener) still.addEventListener("change", function () { draw(clock, false); update(); });
  window.addEventListener("resize", function () { if (!raf) draw(clock, false); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { if (!raf) draw(clock, false); });

  draw(clock, false);
  update();
})();
