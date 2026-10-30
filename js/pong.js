/* =======================================================================
   PONG, on the closing slide
   FSP plays pong: F turns around, F and P become the paddles, S becomes
   the ball, and the first to three points wins. Then they line up as FSP
   again and start over. Runs only while the slide is open; with reduced
   motion it shows one still frame.
   ======================================================================= */

(function () {
  "use strict";

  var canvas = document.querySelector(".pong");
  if (!canvas || !canvas.getContext) return;

  var ctx   = canvas.getContext("2d");
  var slide = canvas.closest(".slide");

  /* the field is 640 x 480 units, scaled to fit the canvas */
  var W = 640, H = 480;

  var SIZE         = 130;    /* letter size, in units                   */
  var BALL_SCALE   = .5;     /* S shrinks to this when it is the ball   */
  var EDGE         = 34;     /* paddle distance from the side           */
  var SPEED        = 300;    /* serve speed, units per second           */
  var MAX_SPEED    = 660;
  var SPEED_UP     = 1.06;   /* per return                              */
  var TIP_BOOST    = 1.08;   /* extra speed off a paddle's tip          */
  var MAX_ANGLE    = 1.05;   /* radians from horizontal, off the tip    */
  var JITTER       = .15;    /* random spread on every return, radians  */
  var PADDLE_SPEED = 350;
  var PADDLE_ACCEL = 2600;   /* units per second squared                */
  var SQUASH       = .4;     /* how flat the ball goes on a paddle      */
  var RECOIL       = 5;      /* how far a paddle gives on a hit, units  */
  var WIN          = 3;      /* points to win                           */

  /* intro timeline, in seconds after the slide opens */
  var T_TURN = .9,  D_TURN = .6;    /* F turns around      */
  var T_MOVE = 1.6, D_MOVE = 1;     /* players take sides  */
  var T_LINE = 1.8, D_LINE = .9;    /* the field draws in  */
  var T_PLAY = 3;

  /* after a game, in seconds */
  var D_OVER   = 1.2;               /* the winner blinks           */
  var D_GATHER = 1.2;               /* everyone back to the middle */
  var HOLD     = 3;                 /* FSP, before starting over   */

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var root  = getComputedStyle(document.documentElement);
  var mono  = root.getPropertyValue("--mono").trim() || "monospace";
  var color = {
    screen: root.getPropertyValue("--c64-screen").trim() || "#352a86",
    text:   root.getPropertyValue("--c64-text").trim()   || "#b9adf7",
    bright: root.getPropertyValue("--c64-bright").trim() || "#eeee77",
    line:   "rgba(185, 173, 247, .35)",
    glow:   "rgba(185, 173, 247, .45)"
  };

  var glyph = {};                            /* ink box per letter      */
  var view  = { k: 1, x: 0, y: 0, dpr: 1 };  /* units to canvas pixels  */
  var game;                                  /* see reset()             */
  var raf = 0, last = 0;

  function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
  function lerp(a, b, p) { return a + (b - a) * p; }
  function ease(p) { return p < .5 ? 4 * p * p * p : 1 - Math.pow(2 - 2 * p, 3) / 2; }
  function progress(t, start, length) { return ease(clamp((t - start) / length, 0, 1)); }
  function spread(n) { return (Math.random() * 2 - 1) * n; }
  function side() { return Math.random() < .5 ? -1 : 1; }
  function font(size) { return "500 " + size + "px " + mono; }

  /* ---------- letters --------------------------------------------------- */

  /* measure the ink of each letter, so paddles and ball collide where they
     are drawn rather than at the edges of the font's em box */
  function measure() {
    ctx.save();
    ctx.font = font(SIZE);
    ["F", "S", "P"].forEach(function (ch) {
      var m = ctx.measureText(ch);
      glyph[ch] = {
        w:   m.actualBoundingBoxLeft + m.actualBoundingBoxRight,
        h:   m.actualBoundingBoxAscent + m.actualBoundingBoxDescent,
        dx:  (m.actualBoundingBoxLeft - m.actualBoundingBoxRight) / 2,
        dy:  (m.actualBoundingBoxAscent - m.actualBoundingBoxDescent) / 2,
        adv: m.width
      };
    });
    ctx.restore();
  }

  /* draw a letter with its ink centred on x, y. qx and qy squash it along
     the screen axes, whichever way it is rotated */
  function letter(ch, x, y, sx, k, rot, fill, qx, qy) {
    var g = glyph[ch];
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(qx || 1, qy || 1);
    ctx.rotate(rot);
    ctx.scale(sx * k, k);
    ctx.fillStyle = fill;
    ctx.fillText(ch, g.dx, g.dy);
    ctx.restore();
  }

  /* ---------- game ------------------------------------------------------ */

  function reset() {
    game = {
      t: 0,
      phase: "intro",          /* intro, play, point, over, gather, or still */
      wait: 0,
      serve: 1,
      winner: 0,               /* who won the latest point          */
      score: [0, 0],
      rally: 0,
      field: 0,                /* 0 to 1 while the field draws in   */
      f:    { ch: "F", x: 0, y: H / 2, vy: 0, turn: 1, aim: 0, react: 0, flash: 0, hit: 1 },
      p:    { ch: "P", x: 0, y: H / 2, vy: 0, turn: 1, aim: 0, react: 0, flash: 0, hit: 1 },
      ball: { x: W / 2, y: H / 2, vx: 0, vy: 0, k: 1, spin: 0, hit: 1 },
      from: null               /* positions when a game ended       */
    };
    pose(0);
  }

  /* the intro: FSP as a word, then F turns around and F and P take sides */
  function pose(t) {
    var g = game, adv = glyph.S.adv;
    var turn = progress(t, T_TURN, D_TURN);
    var move = progress(t, T_MOVE, D_MOVE);

    g.f.turn = Math.cos(Math.PI * turn);             /* 1 to -1: a flip */
    g.f.y    = H / 2 - Math.sin(Math.PI * turn) * 14;
    g.f.x    = lerp(W / 2 - adv, EDGE + glyph.F.w / 2, move);
    g.p.x    = lerp(W / 2 + adv, W - EDGE - glyph.P.w / 2, move);
    g.ball.k = lerp(1, BALL_SCALE, move);
    g.field  = progress(t, T_LINE, D_LINE);
  }

  /* how the receiving paddle plays the ball. pad.aim is its offset from
     the ball at contact, and the return goes the opposite way, so aiming
     sends the ball away from the other player: often off the tip, for a
     wide return. Now and then it reacts late and stretches just past it */
  function aim(pad) {
    var half  = glyph[pad.ch].h / 2;
    var ball  = glyph.S.h * BALL_SCALE / 2;
    var other = pad === game.f ? game.p : game.f;
    var away  = other.y < H / 2 ? -1 : 1;
    var miss  = Math.random() < Math.min(.08 + game.rally * .03, .4);

    pad.react = miss ? .35 + Math.random() * .25 : .1 + Math.random() * .12;
    if (miss)                     pad.aim = side() * (half + ball + 4 + Math.random() * 14);
    else if (Math.random() < .35) pad.aim = away * half * (.75 + Math.random() * .35);
    else                          pad.aim = (Math.random() < .7 ? away : -away) * half * Math.random() * .6;
  }

  function serve(dir) {
    var b = game.ball, a = spread(.5);
    b.x = W / 2;
    b.y = H / 2;
    b.vx = Math.cos(a) * SPEED * dir;
    b.vy = Math.sin(a) * SPEED;
    b.hit = 1;
    game.rally = 0;
    game.phase = "play";
    aim(dir > 0 ? game.p : game.f);
  }

  /* the angle grows faster than the distance from the paddle's middle, so
     a hit near the tip sends the ball out wide, and a little faster */
  function hit(pad, dir) {
    var b = game.ball;
    var where = clamp((b.y - pad.y) / (glyph[pad.ch].h / 2), -1, 1);
    var angle = (where < 0 ? -1 : 1) * Math.pow(Math.abs(where), 1.5) * MAX_ANGLE + spread(JITTER);
    var speed = Math.hypot(b.vx, b.vy) * SPEED_UP * (Math.abs(where) > .75 ? TIP_BOOST : 1);

    angle = clamp(angle, -MAX_ANGLE, MAX_ANGLE);
    if (Math.abs(angle) < .1) angle = angle < 0 ? -.1 : .1;
    speed = Math.min(speed, MAX_SPEED);

    b.vx = Math.cos(angle) * speed * dir;
    b.vy = Math.sin(angle) * speed;
    b.hit = 0;                           /* starts the squash, see draw() */
    pad.flash = .14;
    pad.hit   = 0;                       /* starts the recoil, see paddle() */
    game.rally++;
    aim(dir > 0 ? game.p : game.f);
  }

  /* walls return the ball at almost, but not exactly, the same angle */
  function wobble(b) {
    var a = spread(.06), c = Math.cos(a), s = Math.sin(a), vx = b.vx;
    b.vx = vx * c - b.vy * s;
    b.vy = vx * s + b.vy * c;
  }

  function point(who) {
    game.score[who]++;
    game.winner = who;
    if (game.score[who] >= WIN) {
      game.phase = "over";
      game.wait  = D_OVER;
    } else {
      game.phase = "point";
      game.wait  = .9;
      game.serve = who === 0 ? 1 : -1;   /* toward whoever lost the point */
    }
  }

  /* where the ball will reach this paddle's face, with wall bounces */
  function intercept(pad) {
    var b  = game.ball;
    var bw = glyph.S.w * BALL_SCALE / 2, bh = glyph.S.h * BALL_SCALE / 2;
    var x  = pad === game.f ? pad.x + glyph.F.w / 2 + bw : pad.x - glyph.P.w / 2 - bw;
    var t  = Math.max(0, (x - b.x) / b.vx);
    var span = H - 2 * bh;
    var y  = (b.y + b.vy * t - bh) % (2 * span);
    if (y < 0) y += 2 * span;
    return bh + (y > span ? 2 * span - y : y);
  }

  /* a paddle heads for where the ball will arrive once it has reacted;
     otherwise it waits near the middle, leaning toward the ball. It speeds
     up and slows down rather than moving at one speed */
  function track(pad, coming, dt) {
    var half = glyph[pad.ch].h / 2;
    var target = game.phase === "play" ? H / 2 + (game.ball.y - H / 2) * .3 : H / 2;

    if (coming) {
      pad.react -= dt;
      if (pad.react <= 0) target = intercept(pad) + pad.aim;
    }

    var want = clamp((target - pad.y) * 7, -PADDLE_SPEED, PADDLE_SPEED);
    pad.vy += clamp(want - pad.vy, -PADDLE_ACCEL * dt, PADDLE_ACCEL * dt);
    pad.y  += pad.vy * dt;

    if (pad.y < half + 8)          { pad.y = half + 8;     pad.vy = 0; }
    else if (pad.y > H - half - 8) { pad.y = H - half - 8; pad.vy = 0; }
    pad.flash = Math.max(0, pad.flash - dt);
    pad.hit  += dt;
  }

  /* after a game: everyone glides back to the middle and F turns back, so
     it reads FSP again. Then the intro replays, after a hold */
  function gather() {
    var g = game, b = g.ball, o = g.from, adv = glyph.S.adv;
    var m = progress(g.t, 0, D_GATHER);

    g.f.x    = lerp(o.fx, W / 2 - adv, m);
    g.f.y    = lerp(o.fy, H / 2, m);
    g.p.x    = lerp(o.px, W / 2 + adv, m);
    g.p.y    = lerp(o.py, H / 2, m);
    b.x      = lerp(o.bx, W / 2, m);
    b.y      = lerp(o.by, H / 2, m);
    b.k      = lerp(BALL_SCALE, 1, m);
    b.spin   = lerp(o.spin, Math.round(o.spin / (2 * Math.PI)) * 2 * Math.PI, m);
    g.f.turn = -Math.cos(Math.PI * progress(g.t, D_GATHER * .4, D_GATHER * .6));
    g.field  = 1 - m;

    if (g.t >= D_GATHER) {
      g.score = [0, 0];
      g.phase = "intro";
      g.t     = T_TURN - HOLD;
      g.f.vy  = g.p.vy = 0;
    }
  }

  function step(dt) {
    var g = game, b = g.ball;
    g.t += dt;

    if (g.phase === "intro") {
      pose(g.t);
      if (g.t >= T_PLAY) serve(side());
      return;
    }
    if (g.phase === "gather") {
      gather();
      return;
    }

    var playing = g.phase === "play";
    track(g.f, playing && b.vx < 0, dt);
    track(g.p, playing && b.vx > 0, dt);

    if (!playing) {
      g.wait -= dt;
      if (g.phase === "over") {
        (g.winner === 0 ? g.f : g.p).flash = g.wait % .4 > .2 ? .1 : 0;   /* blinks */
      }
      if (g.wait > 0) return;
      if (g.phase === "over") {
        g.phase = "gather";
        g.t     = 0;
        g.from  = { fx: g.f.x, fy: g.f.y, px: g.p.x, py: g.p.y, bx: b.x, by: b.y, spin: b.spin };
        g.f.flash = g.p.flash = 0;
      } else {
        serve(g.serve);
      }
      return;
    }

    b.hit += dt;

    var bw = glyph.S.w * BALL_SCALE / 2, bh = glyph.S.h * BALL_SCALE / 2;
    var left = b.x - bw, right = b.x + bw;

    b.x += b.vx * dt;
    b.y += b.vy * dt;
    b.spin += (b.vx > 0 ? 1 : -1) * (3 + Math.abs(b.vy) / 90) * dt;

    /* top and bottom walls */
    if (b.y - bh < 0) {
      b.y = bh;
      wobble(b);
      b.vy = Math.abs(b.vy);
    } else if (b.y + bh > H) {
      b.y = H - bh;
      wobble(b);
      b.vy = -Math.abs(b.vy);
    }

    /* the faces are the stems: F's is on its right once it has turned */
    var fFace = g.f.x + glyph.F.w / 2;
    var pFace = g.p.x - glyph.P.w / 2;
    if (b.vx < 0 && left >= fFace && b.x - bw <= fFace &&
        Math.abs(b.y - g.f.y) <= glyph.F.h / 2 + bh) {
      b.x = fFace + bw;
      hit(g.f, 1);
    } else if (b.vx > 0 && right <= pFace && b.x + bw >= pFace &&
               Math.abs(b.y - g.p.y) <= glyph.P.h / 2 + bh) {
      b.x = pFace - bw;
      hit(g.p, -1);
    }

    if (b.x + bw < 0)      point(1);
    else if (b.x - bw > W) point(0);
  }

  /* ---------- drawing --------------------------------------------------- */

  /* on a hit a paddle gives a little, away from the field, and springs back */
  function paddle(pad, out) {
    var h = pad.hit, a = h < .4 ? Math.exp(-h * 14) * Math.cos(h * 28) : 0;
    letter(pad.ch, pad.x + out * RECOIL * a, pad.y, pad.turn, 1, 0,
           pad.flash > 0 ? color.bright : color.text, 1 - .1 * a, 1 + .05 * a);
  }

  /* the score: a row of slots on each player's side, filled as they score.
     The latest point stays lit until the next serve */
  function score() {
    var g = game, size = 22, gap = 10, width = WIN * size + (WIN - 1) * gap;
    var fresh = g.phase === "point" || g.phase === "over";

    ctx.lineWidth = 2;
    for (var who = 0; who < 2; who++) {
      var x0 = W / 2 + (who === 0 ? -90 : 90) - width / 2;
      for (var i = 0; i < WIN; i++) {
        var x = x0 + i * (size + gap), y = 24;
        if (i < g.score[who]) {
          ctx.fillStyle = fresh && who === g.winner && i === g.score[who] - 1 ? color.bright : color.text;
          ctx.fillRect(x, y, size, size);
        } else {
          ctx.strokeStyle = color.line;
          ctx.strokeRect(x + 1, y + 1, size - 2, size - 2);
        }
      }
    }
  }

  function draw() {
    var g = game;
    if (!canvas.width || !g) return;

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.shadowBlur = 0;
    ctx.fillStyle = color.screen;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.setTransform(view.k, 0, 0, view.k, view.x, view.y);
    ctx.shadowColor = color.glow;
    ctx.shadowBlur  = 6 * view.dpr;

    /* the field: a dashed centre line drawn from the top, and the score */
    if (g.field > 0) {
      ctx.fillStyle = color.line;
      for (var y = 10; y < H * g.field; y += 24) ctx.fillRect(W / 2 - 2, y, 4, 12);
      ctx.globalAlpha = g.field;
      score();
      ctx.globalAlpha = 1;
    }

    ctx.font         = font(SIZE);
    ctx.textAlign    = "left";
    ctx.textBaseline = "alphabetic";
    paddle(g.f, -1);
    paddle(g.p, 1);
    if (g.phase !== "point" && g.phase !== "over") {
      /* yellow while it is the ball, lavender while it is part of the word */
      var lit = g.phase === "intro"  ? g.t >= T_MOVE :
                g.phase === "gather" ? g.t < D_GATHER * .8 : true;

      /* on a paddle the ball flattens against it, then wobbles back */
      var h = g.ball.hit, a = h < .5 ? Math.exp(-h * 12) * Math.cos(h * 32) : 0;

      letter("S", g.ball.x, g.ball.y, 1, g.ball.k, g.ball.spin, lit ? color.bright : color.text,
             1 - SQUASH * a, 1 + SQUASH * .6 * a);
    }
  }

  function resize() {
    var w = canvas.clientWidth, h = canvas.clientHeight;
    if (!w || !h) return;
    var dpr = window.devicePixelRatio || 1;
    canvas.width  = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    var k = Math.min(canvas.width / W, canvas.height / H);
    view = { k: k, x: (canvas.width - W * k) / 2, y: (canvas.height - H * k) / 2, dpr: dpr };
    draw();
  }

  /* ---------- running --------------------------------------------------- */

  /* the finished layout, for reduced motion, the overview, and print */
  function still() {
    reset();
    pose(T_PLAY);
    game.phase = "still";
    draw();
  }

  function frame(now) {
    step(clamp((now - last) / 1000, 0, 1 / 30));
    last = now;
    draw();
    raf = requestAnimationFrame(frame);
  }

  function start() {
    if (reduced) { still(); return; }
    reset();
    last = performance.now();
    raf = requestAnimationFrame(frame);
  }

  function stop() {
    cancelAnimationFrame(raf);
    raf = 0;
  }

  /* play while the slide is open, but not in the overview */
  function sync() {
    var on = slide.classList.contains("is-active") &&
             !document.body.classList.contains("is-overview");
    if (on && !raf) start();
    else if (!on && raf) stop();
  }

  measure();
  still();

  new ResizeObserver(resize).observe(canvas);
  new MutationObserver(sync).observe(slide, { attributes: true, attributeFilter: ["class"] });
  new MutationObserver(sync).observe(document.body, { attributes: true, attributeFilter: ["class"] });
  sync();

  /* the letters change shape once the web font arrives */
  if (document.fonts) {
    document.fonts.load(font(SIZE)).then(function () {
      measure();
      if (!raf) still();
    });
  }
})();
