/* =======================================================================
   FLOW: draws the Mermaid flowchart on the loop slide
   The chart's source is the <script type="text/x-mermaid"> inside
   .flowchart in index.html. Mermaid loads from a CDN, pinned and checked
   against its hash; without a connection the slide keeps its one-line
   fallback. Colours come from deck.css, so the chart follows the theme.
   ======================================================================= */

(function () {
  "use strict";

  var MERMAID   = "https://cdn.jsdelivr.net/npm/mermaid@11.6.0/dist/mermaid.min.js";
  var INTEGRITY = "sha384-zkWMJO4sgpPUzyuOgDx8HB/K55glbAwajEpk1Go2NWRuPkPA/wIhoEJTuSkmOYrV";
  var FONT      = '"JetBrains Mono", ui-monospace, Menlo, Consolas, monospace';

  var box = document.querySelector(".flowchart");
  var src = box && box.querySelector('script[type="text/x-mermaid"]');
  if (!src) return;

  var script = document.createElement("script");
  script.src = MERMAID;
  script.integrity = INTEGRITY;
  script.crossOrigin = "anonymous";
  script.onload = draw;
  document.head.appendChild(script);

  function draw() {
    /* type and spacing follow the deck's scale, so the chart keeps its
       proportions on any screen; the SVG then scales to fit the slide */
    var rem = parseFloat(getComputedStyle(document.documentElement).fontSize);
    var px  = function (n) { return Math.round(rem * n); };

    window.mermaid.initialize({
      startOnLoad: false,
      theme: "base",
      fontFamily: FONT,
      themeVariables: { fontFamily: FONT, fontSize: px(0.8) + "px" },
      flowchart: { curve: "basis", padding: px(0.5), nodeSpacing: px(1.5), rankSpacing: px(0.8) }
    });

    /* measure the labels in the deck's font, not a fallback */
    document.fonts.load('16px "JetBrains Mono"')
      .then(function () {
        return window.mermaid.render("loop-chart", src.textContent.trim());
      })
      .then(function (out) {
        box.insertAdjacentHTML("beforeend", out.svg);
        box.classList.add("is-drawn");
      })
      .catch(function (err) {
        console.warn("flowchart not drawn:", err);   /* the fallback stays */
      });
  }
})();
