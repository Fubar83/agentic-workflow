/* =======================================================================
   DECK — navigation
   No dependencies. Slides are read from the DOM, so adding a
   <section class="slide"> to index.html is all it takes to extend the deck.
   ======================================================================= */

(function () {
  "use strict";

  var deck    = document.getElementById("deck");
  var slides  = Array.prototype.slice.call(deck.querySelectorAll(".slide"));
  var prevBtn = document.getElementById("prev");
  var nextBtn = document.getElementById("next");
  var current = document.getElementById("current");
  var total   = document.getElementById("total");
  var bar     = document.getElementById("progress");
  var help    = document.getElementById("help");
  var hintBtn = document.getElementById("hint");

  var OFFSET = "3.5rem";   /* how far slides travel when changing */
  var index  = 0;

  /* the reveal animation hides content until a slide opens — only arm it
     once the script is running, so a failure here can never blank a slide */
  document.documentElement.classList.add("js");

  /* ---------- setup --------------------------------------------------- */

  total.textContent = slides.length;

  slides.forEach(function (slide, i) {
    slide.setAttribute("aria-roledescription", "slide");
    slide.setAttribute("aria-label", "Slide " + (i + 1) + " of " + slides.length);

    /* printed in the top margin by CSS */
    slide.dataset.no = ("0" + (i + 1)).slice(-2) + " / " + ("0" + slides.length).slice(-2);

    /* stagger index for the rise-in animation */
    var groups = slide.matches("[data-anim]")
      ? [slide]
      : Array.prototype.slice.call(slide.querySelectorAll("[data-anim]"));

    groups.forEach(function (group) {
      Array.prototype.forEach.call(group.children, function (child, n) {
        child.style.setProperty("--i", n);
      });
    });

    /* overview: click a thumbnail to jump to it */
    slide.addEventListener("click", function () {
      if (document.body.classList.contains("is-overview")) {
        setOverview(false);
        go(i);
      }
    });
  });

  /* ---------- navigation ---------------------------------------------- */

  function go(next) {
    next = Math.max(0, Math.min(slides.length - 1, next));
    if (next === index && slides[index].classList.contains("is-active")) return;

    var dir  = next >= index ? 1 : -1;
    var from = slides[index];
    var to   = slides[next];

    if (from !== to) {
      from.classList.remove("is-active");
      from.classList.add("is-leaving");
      from.style.transform = "translate3d(" + (dir > 0 ? "-" : "") + OFFSET + ", 0, 0)";
      window.setTimeout(function () {
        from.classList.remove("is-leaving");
        from.style.transform = "";
      }, 560);
    }

    /* place the incoming slide, then let it transition in */
    to.style.transition = "none";
    to.style.transform  = "translate3d(" + (dir > 0 ? "" : "-") + OFFSET + ", 0, 0)";
    void to.offsetWidth;
    to.style.transition = "";
    to.classList.remove("is-leaving");
    to.classList.add("is-active");
    to.style.transform = "";

    index = next;
    sync();
  }

  function sync() {
    current.textContent  = index + 1;
    bar.style.width      = ((index + 1) / slides.length) * 100 + "%";
    prevBtn.disabled     = index === 0;
    nextBtn.disabled     = index === slides.length - 1;
    if (location.hash !== "#" + (index + 1)) {
      history.replaceState(null, "", "#" + (index + 1));
    }
  }

  var next = function () { go(index + 1); };
  var prev = function () { go(index - 1); };

  /* ---------- modes ---------------------------------------------------- */

  function setOverview(on) {
    document.body.classList.toggle("is-overview", on);
    if (!on) {
      slides[index].scrollIntoView({ block: "center" });
      window.scrollTo(0, 0);
    }
  }

  function toggleFullscreen() {
    if (document.fullscreenElement) document.exitFullscreen();
    else document.documentElement.requestFullscreen();
  }

  function toggleTheme() {
    var root = document.documentElement;
    root.dataset.theme = root.dataset.theme === "light" ? "dark" : "light";
  }

  function setHelp(on) {
    help.hidden = !on;
  }

  /* ---------- input ---------------------------------------------------- */

  document.addEventListener("keydown", function (e) {
    if (e.metaKey || e.ctrlKey || e.altKey) return;

    switch (e.key) {
      case "ArrowRight":
      case "ArrowDown":
      case "PageDown":
      case " ":
      case "Enter":
        e.preventDefault(); next(); break;

      case "ArrowLeft":
      case "ArrowUp":
      case "PageUp":
      case "Backspace":
        e.preventDefault(); prev(); break;

      case "Home":
        e.preventDefault(); go(0); break;

      case "End":
        e.preventDefault(); go(slides.length - 1); break;

      case "o": case "O":
        setOverview(!document.body.classList.contains("is-overview")); break;

      case "f": case "F":
        toggleFullscreen(); break;

      case "t": case "T":
        toggleTheme(); break;

      case "?":
        setHelp(help.hidden); break;

      case "Escape":
        if (!help.hidden) setHelp(false);
        else setOverview(false);
        break;
    }
  });

  nextBtn.addEventListener("click", next);
  prevBtn.addEventListener("click", prev);
  hintBtn.addEventListener("click", function () { setHelp(help.hidden); });
  help.addEventListener("click", function () { setHelp(false); });

  /* touch — horizontal swipe */
  var touchX = null, touchY = null;
  deck.addEventListener("touchstart", function (e) {
    touchX = e.changedTouches[0].clientX;
    touchY = e.changedTouches[0].clientY;
  }, { passive: true });

  deck.addEventListener("touchend", function (e) {
    if (touchX === null) return;
    var dx = e.changedTouches[0].clientX - touchX;
    var dy = e.changedTouches[0].clientY - touchY;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) {
      dx < 0 ? next() : prev();
    }
    touchX = touchY = null;
  }, { passive: true });

  /* ---------- start ---------------------------------------------------- */

  window.addEventListener("hashchange", function () {
    var n = parseInt(location.hash.slice(1), 10);
    if (!isNaN(n)) go(n - 1);
  });

  var start = parseInt(location.hash.slice(1), 10);
  index = 0;
  slides[0].classList.add("is-active");
  sync();
  if (!isNaN(start) && start > 1) go(start - 1);
})();
