/* Step switcher: turns each .stepper block into steps beside one stage. Each .stepper-title becomes a button
   that opens its step and shows its screen (.stepper-media, in the same order) on the stage. Loaded only on
   pages with `stepper: true` (currently /ldar). Without JS every step and screen shows, stacked. */
(function () {
  [].forEach.call(document.querySelectorAll(".stepper"), function (root, r) {
    var steps = [].slice.call(root.querySelectorAll(".stepper-item"));
    var media = [].slice.call(root.querySelectorAll(".stepper-media"));
    if (!steps.length || steps.length !== media.length) return;

    var tabs = steps.map(function (step, i) {
      var title = step.querySelector(".stepper-title"), body = step.querySelector(".stepper-body");
      var button = document.createElement("button");
      button.type = "button";
      button.className = "stepper-tab";
      while (title.firstChild) button.appendChild(title.firstChild);
      title.appendChild(button);
      body.id = body.id || "stepper-" + r + "-body-" + i;
      button.setAttribute("aria-controls", body.id);
      button.addEventListener("click", function () { show(i); });
      return button;
    });

    function show(n) {
      steps.forEach(function (step, i) {
        var on = i === n;
        step.classList.toggle("is-active", on);
        tabs[i].setAttribute("aria-expanded", on ? "true" : "false");
        step.querySelector(".stepper-body").hidden = !on;
        media[i].classList.toggle("is-active", on);
        media[i].setAttribute("aria-hidden", on ? "false" : "true");
        // Inactive screens are stacked behind the active one; load them now so switching doesn't flash
        var img = media[i].querySelector("img");
        if (img) img.loading = "eager";
      });
    }

    root.classList.add("is-live");
    show(0);
    // Transitions only after the first step is set, so the page doesn't open with screens fading out
    requestAnimationFrame(function () { requestAnimationFrame(function () { root.classList.add("is-ready"); }); });
  });
})();
