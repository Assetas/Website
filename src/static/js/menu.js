// Header menu and footer effects: the only page script besides analytics.
// Desktop: the Industry, Programs and Platform panels open on hover or keyboard focus in CSS alone; this adds
// the amber bar that slides under the item you point at (and rests under the current section).
// Phones and tablets: opens and closes the drawer and its expandable sections.
const header = document.querySelector(".site-header");
const nav = document.getElementById("site-nav");
const toggle = header && header.querySelector(".menu-toggle");

if (header && nav && toggle) {
  const desktop = window.matchMedia("(min-width: 64rem)");
  const behind = [document.querySelector("main"), document.querySelector(".site-footer")].filter(Boolean);
  const closeButton = nav.querySelector(".menu-close");

  // Drawer
  function setOpen(open, returnFocus = true) {
    header.classList.toggle("is-open", open);
    toggle.setAttribute("aria-expanded", String(open));
    document.documentElement.classList.toggle("menu-open", open);
    behind.forEach((el) => { el.inert = open; });
    if (open) closeButton.focus();
    else if (returnFocus) toggle.focus();
  }

  toggle.addEventListener("click", () => setOpen(!header.classList.contains("is-open")));
  closeButton.addEventListener("click", () => setOpen(false));
  header.querySelector(".nav-scrim").addEventListener("click", () => setOpen(false));
  desktop.addEventListener("change", () => {
    if (header.classList.contains("is-open")) setOpen(false, false);
  });

  nav.querySelectorAll(".nav-acc").forEach((button) => {
    button.addEventListener("click", () => {
      button.setAttribute("aria-expanded", String(button.getAttribute("aria-expanded") !== "true"));
    });
  });

  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    if (header.classList.contains("is-open")) setOpen(false);
    else if (nav.contains(document.activeElement)) document.activeElement.blur(); // closes a panel opened by keyboard
  });

  // Amber bar under the top-level items (desktop)
  const ink = header.querySelector(".nav-ink");
  const list = nav.querySelector(".nav-list");
  const rest = list.querySelector(".is-current > .nav-top");

  function inkTo(link) {
    if (!link || !desktop.matches) {
      ink.style.opacity = "0";
      return;
    }
    const box = header.getBoundingClientRect();
    const rect = link.getBoundingClientRect();
    const pad = parseFloat(getComputedStyle(link).paddingLeft);
    const hidden = ink.style.opacity !== "1";
    if (hidden) ink.style.transition = "none"; // appear in place instead of sliding in from the last spot
    ink.style.width = `${rect.width - pad * 2}px`;
    ink.style.transform = `translateX(${rect.left - box.left + pad}px)`;
    if (hidden) {
      void ink.offsetWidth;
      ink.style.transition = "";
    }
    ink.style.opacity = "1";
  }

  list.querySelectorAll(".nav-item").forEach((item) => {
    const link = item.querySelector(".nav-top");
    item.addEventListener("mouseenter", () => inkTo(link));
    item.addEventListener("focusin", () => inkTo(link));
  });
  list.addEventListener("mouseleave", () => inkTo(rest));
  list.addEventListener("focusout", (event) => {
    if (!list.contains(event.relatedTarget)) inkTo(rest);
  });
  window.addEventListener("resize", () => inkTo(rest));
  document.fonts.ready.then(() => inkTo(rest));
  header.classList.add("has-ink");
  inkTo(rest);
}

// Footer: the telemetry trace runs and the alpha mark draws itself once, when the footer scrolls into
// view (CSS: "Footer" in main.css). Without this, or with reduced motion, it shows finished.
const footer = document.querySelector(".site-footer");

if (footer && "IntersectionObserver" in window && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
  footer.classList.add("is-armed");
  const watch = new IntersectionObserver((entries) => {
    if (entries.some((entry) => entry.intersectionRatio > 0.25)) {
      footer.classList.add("is-in");
      watch.disconnect();
    }
  }, { threshold: 0.3 });
  watch.observe(footer);
}
