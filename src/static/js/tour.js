/* Tour chapters: beside a product tour video, a list of its chapters. Each chapter becomes a button that
   jumps the video to that point and plays it; as the video runs, the current chapter is marked and a thin
   bar under it fills to show how far into that chapter it is. Loaded only on pages with `tour: true`
   (currently /assets). Without JS the chapters show as a plain list with their start times. */
(function () {
  [].forEach.call(document.querySelectorAll("[data-tour]"), function (tour) {
    var video = tour.querySelector("video");
    var items = [].slice.call(tour.querySelectorAll(".tour-chapters li[data-t]"));
    if (!video || !items.length) return;

    var starts = items.map(function (li) { return parseFloat(li.getAttribute("data-t")); });
    var end = parseFloat(tour.getAttribute("data-tour-end")) || 0; // where the last chapter stops (the outro)

    var buttons = items.map(function (li, i) {
      var step = li.querySelector(".tour-step");
      var button = document.createElement("button");
      button.type = "button";
      button.className = step.className;
      button.innerHTML = step.innerHTML;
      step.replaceWith(button);
      button.addEventListener("click", function () {
        video.currentTime = starts[i] + 0.1;
        var played = video.play();
        if (played && played.catch) played.catch(function () {});
      });
      return button;
    });

    var current = -1;
    function update() {
      var t = video.currentTime;
      var stop = end || video.duration || Infinity;
      var index = -1;
      for (var i = 0; i < starts.length; i++) if (t >= starts[i] && t < stop) index = i;
      if (index !== current) {
        if (current > -1) { items[current].classList.remove("is-active"); buttons[current].removeAttribute("aria-current"); }
        if (index > -1) { items[index].classList.add("is-active"); buttons[index].setAttribute("aria-current", "step"); }
        current = index;
      }
      if (index > -1) {
        var next = index + 1 < starts.length ? starts[index + 1] : stop;
        var p = Math.max(0, Math.min(1, (t - starts[index]) / (next - starts[index])));
        items[index].style.setProperty("--p", (p * 100).toFixed(1) + "%");
      }
    }
    video.addEventListener("timeupdate", update);
    video.addEventListener("seeked", update);
    tour.classList.add("is-live");
    update();
  });
})();
