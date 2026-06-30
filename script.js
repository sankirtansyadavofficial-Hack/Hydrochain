/* ═══════════════════════════════════════════════════════════════
   HYDROCHAIN — Interactive Engine
   Fixed Frame Canvas + Hero Smoke + NavHeader Cursor
   Frames from "scroll animation" folder (9:16 portrait)
   ═══════════════════════════════════════════════════════════════ */

(function () {
  "use strict";

  var $ = function (id) { return document.getElementById(id); };

  var navbar       = $("navbar");
  var navCursor    = $("nav-cursor");
  var navContainer = $("nav-links");
  var navItems     = document.querySelectorAll(".nav-link");
  var heroCanvas   = $("water-bg-canvas");
  var heroCtx      = heroCanvas ? heroCanvas.getContext("2d") : null;

  /* ═══════════════════════════════════════════════════════════════
     SCROLL-DRIVEN FRAME ANIMATION — FIXED CANVAS
     240 portrait frames from "scroll animation/" folder
     Canvas is position:fixed, shown from hero end to footer start
     ═══════════════════════════════════════════════════════════════ */
  var TOTAL_FRAMES = 240;
  var frameImages = [];
  var framesLoaded = 0;
  var scrollCanvas = $("scroll-frame-canvas");
  var scrollCtx = scrollCanvas ? scrollCanvas.getContext("2d") : null;
  var frameBg = $("scroll-frame-bg");
  var contentWrapper = $("scroll-content-wrapper");
  var currentFrame = 0;
  var targetFrame = 0;
  var lastDrawnFrame = -1;

  function getFramePath(index) {
    var num = String(index).padStart(3, "0");
    return "scroll animation/ezgif-frame-" + num + ".jpg";
  }

  function resizeScrollCanvas() {
    if (!scrollCanvas) return;
    scrollCanvas.width = window.innerWidth;
    scrollCanvas.height = window.innerHeight;
    // Redraw current frame after resize
    if (lastDrawnFrame >= 0) drawFrame(lastDrawnFrame);
  }

  function drawFrame(idx) {
    if (!scrollCtx || !frameImages[idx]) return;
    var img = frameImages[idx];
    if (!img.complete || !img.naturalWidth) return;

    var cw = scrollCanvas.width;
    var ch = scrollCanvas.height;
    var iw = img.naturalWidth;
    var ih = img.naturalHeight;

    // High quality rendering
    scrollCtx.imageSmoothingEnabled = true;
    scrollCtx.imageSmoothingQuality = "high";

    // Cover fit with bottom-biased anchor (0.65 = show more road/bottom)
    // The frames are 9:16 portrait on a 16:9 landscape viewport,
    // so vertical cropping is heavy. Anchoring at 65% keeps the
    // wet road and water-spread visible instead of just sky/buildings.
    var scale = Math.max(cw / iw, ch / ih);
    var sw = iw * scale;
    var sh = ih * scale;
    var sx = (cw - sw) / 2;
    var sy = (ch - sh) * 0.65;

    scrollCtx.clearRect(0, 0, cw, ch);
    scrollCtx.drawImage(img, sx, sy, sw, sh);
    lastDrawnFrame = idx;
  }

  function smoothFrameLoop() {
    // Fast interpolation for rapid, smooth frame playback
    currentFrame += (targetFrame - currentFrame) * 0.25;
    var idx = Math.round(currentFrame);
    idx = Math.max(0, Math.min(TOTAL_FRAMES - 1, idx));

    // Only redraw if frame actually changed
    if (idx !== lastDrawnFrame) {
      drawFrame(idx);
    }
    requestAnimationFrame(smoothFrameLoop);
  }

  function updateScrollFrame() {
    if (!contentWrapper || !frameBg) return;

    var hero = $("hero");
    var footer = $("footer");
    if (!hero || !footer) return;

    // The animation zone: from bottom of hero to top of footer
    var heroBottom = hero.offsetTop + hero.offsetHeight;
    var footerTop = footer.offsetTop;
    var animationZoneHeight = footerTop - heroBottom;

    // Current scroll position relative to the animation zone
    var scrolled = window.scrollY - heroBottom;

    // Show/hide the fixed canvas as soon as we start scrolling down
    if (window.scrollY > 50) {
      frameBg.classList.add("visible");
    } else {
      frameBg.classList.remove("visible");
    }

    // Clamp scroll position
    if (scrolled < 0) scrolled = 0;
    if (scrolled > animationZoneHeight) scrolled = animationZoneHeight;

    // Map scroll to frame index across the full zone
    var progress = animationZoneHeight > 0 ? scrolled / animationZoneHeight : 0;
    targetFrame = Math.floor(progress * (TOTAL_FRAMES - 1));
  }

  function preloadFrames() {
    if (!scrollCanvas || !scrollCtx) return;
    resizeScrollCanvas();
    window.addEventListener("resize", resizeScrollCanvas);

    // Start render loop
    smoothFrameLoop();

    // Preload all 240 frames
    for (var i = 1; i <= TOTAL_FRAMES; i++) {
      (function (index) {
        var img = new Image();
        img.src = getFramePath(index);
        frameImages[index - 1] = img;

        img.onload = function () {
          framesLoaded++;
          // Draw first frame immediately when it loads
          if (index === 1) {
            drawFrame(0);
          }
        };

        img.onerror = function () {
          framesLoaded++;
        };
      })(i);
    }
  }

  /* ═══════════════════════════════════════════════════════════════
     NAVHEADER-STYLE SLIDING CURSOR PILL
     ═══════════════════════════════════════════════════════════════ */
  function initNavCursorPill() {
    if (!navContainer || !navCursor) return;

    navItems.forEach(function (link) {
      link.addEventListener("mouseenter", function () {
        var linkRect = link.getBoundingClientRect();
        var containerRect = navContainer.getBoundingClientRect();
        navCursor.style.width = linkRect.width + "px";
        navCursor.style.left = (linkRect.left - containerRect.left) + "px";
        navCursor.style.opacity = "1";
      });

      link.addEventListener("click", function (e) {
        e.preventDefault();
        var target = link.getAttribute("data-target");
        if (target === "hero" || target === "#") {
          window.scrollTo({ top: 0, behavior: "smooth" });
        } else {
          var el = document.getElementById(target);
          if (el) el.scrollIntoView({ behavior: "smooth" });
        }
      });
    });

    navContainer.addEventListener("mouseleave", function () {
      if (navCursor) navCursor.style.opacity = "0";
    });

    var brand = document.querySelector(".nav-brand");
    if (brand) {
      brand.addEventListener("click", function () {
        window.scrollTo({ top: 0, behavior: "smooth" });
      });
    }
  }

  /* ═══════════════════════════════════════════════════════════════
     SCROLL-REVEAL ANIMATION ENGINE
     ═══════════════════════════════════════════════════════════════ */
  function initScrollReveal() {
    var revealEls = document.querySelectorAll(".scroll-reveal");
    if (!revealEls.length) return;

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            var delay = parseInt(entry.target.getAttribute("data-delay") || "0", 10);
            setTimeout(function () {
              entry.target.classList.add("revealed");
            }, delay);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -50px 0px" }
    );

    revealEls.forEach(function (el) { observer.observe(el); });
  }

  /* ═══════════════════════════════════════════════════════════════
     HERO SMOKE & FLAME TRAIL (UNTOUCHED)
     ═══════════════════════════════════════════════════════════════ */
  var heroWidth = 0, heroHeight = 0;
  var smokeParticles = [];
  var mouse = { x: -1000, y: -1000, active: false, lastX: -1000, lastY: -1000 };

  function resizeHeroCanvas() {
    if (!heroCanvas) return;
    heroWidth = heroCanvas.width = window.innerWidth;
    heroHeight = heroCanvas.height = window.innerHeight;
  }

  function SmokeParticle(x, y, vx, vy) {
    this.x = x;
    this.y = y;
    this.vx = vx * 0.35 + (Math.random() - 0.5) * 1.5;
    this.vy = vy * 0.35 - Math.random() * 1.8 - 0.8;
    this.size = Math.random() * 18 + 14;
    this.growth = Math.random() * 0.6 + 0.4;
    this.alpha = Math.random() * 0.55 + 0.35;
    this.fade = Math.random() * 0.012 + 0.008;
    this.color = Math.random() < 0.5 ? "0, 114, 255" : "0, 198, 255";
    if (Math.random() < 0.25) this.color = "0, 51, 170";
  }

  SmokeParticle.prototype.update = function () {
    this.x += this.vx;
    this.y += this.vy;
    this.size += this.growth;
    this.alpha -= this.fade;
  };

  SmokeParticle.prototype.draw = function (c) {
    if (this.alpha <= 0) return;
    c.save();
    c.globalAlpha = Math.max(0, this.alpha);
    var grad = c.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.size);
    grad.addColorStop(0, "rgba(" + this.color + ", 0.85)");
    grad.addColorStop(0.4, "rgba(" + this.color + ", 0.35)");
    grad.addColorStop(1, "rgba(" + this.color + ", 0)");
    c.fillStyle = grad;
    c.beginPath();
    c.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    c.fill();
    c.restore();
  };

  function initSmokeTailSimulation() {
    if (!heroCanvas || !heroCtx) return;
    resizeHeroCanvas();
    window.addEventListener("resize", resizeHeroCanvas);

    var heroSec = $("hero");
    if (heroSec) {
      heroSec.addEventListener("mousemove", function (e) {
        var rect = heroSec.getBoundingClientRect();
        var curX = e.clientX - rect.left;
        var curY = e.clientY - rect.top;

        if (mouse.active && mouse.lastX !== -1000) {
          var dx = curX - mouse.lastX;
          var dy = curY - mouse.lastY;
          var dist = Math.hypot(dx, dy);
          var steps = Math.min(Math.floor(dist / 4), 12) + 1;
          for (var i = 0; i < steps; i++) {
            var px = mouse.lastX + (dx * i) / steps;
            var py = mouse.lastY + (dy * i) / steps;
            smokeParticles.push(new SmokeParticle(px, py, dx * 0.1, dy * 0.1));
          }
        } else {
          smokeParticles.push(new SmokeParticle(curX, curY, 0, 0));
        }

        mouse.x = curX;
        mouse.y = curY;
        mouse.lastX = curX;
        mouse.lastY = curY;
        mouse.active = true;
      });

      heroSec.addEventListener("mouseleave", function () {
        mouse.active = false;
        mouse.lastX = -1000;
        mouse.lastY = -1000;
      });
    }

    animateSmoke();
  }

  var backgroundWaveOffset = 0;
  function animateSmoke() {
    if (!heroCtx) return;
    heroCtx.clearRect(0, 0, heroWidth, heroHeight);

    backgroundWaveOffset += 0.015;
    heroCtx.save();
    heroCtx.fillStyle = "rgba(0, 114, 255, 0.02)";
    heroCtx.beginPath();
    heroCtx.moveTo(0, heroHeight);
    for (var x = 0; x <= heroWidth; x += 40) {
      var y = Math.sin(x * 0.004 + backgroundWaveOffset) * 15 + heroHeight * 0.75;
      heroCtx.lineTo(x, y);
    }
    heroCtx.lineTo(heroWidth, heroHeight);
    heroCtx.closePath();
    heroCtx.fill();
    heroCtx.restore();

    heroCtx.globalCompositeOperation = "lighter";

    for (var i = smokeParticles.length - 1; i >= 0; i--) {
      var p = smokeParticles[i];
      p.update();
      p.draw(heroCtx);
      if (p.alpha <= 0) {
        smokeParticles.splice(i, 1);
      }
    }

    heroCtx.globalCompositeOperation = "source-over";
    requestAnimationFrame(animateSmoke);
  }

  /* ═══════════════════════════════════════════════════════════════
     NAVBAR SCROLL STATE & ACTIVE LINK
     ═══════════════════════════════════════════════════════════════ */
  function onScroll() {
    var sy = window.scrollY;
    if (navbar) navbar.classList.toggle("scrolled", sy > 40);
    updateActiveNav();
    updateScrollFrame();
  }

  function updateActiveNav() {
    var sy = window.scrollY + window.innerHeight / 3;
    var active = "hero";
    var ids = ["hero", "about", "features", "technology", "footer"];
    ids.forEach(function (id) {
      var el = document.getElementById(id);
      if (el && el.offsetTop <= sy) active = id;
    });
    navItems.forEach(function (l) {
      l.classList.toggle("active", l.getAttribute("data-target") === active);
    });
  }

  /* ═══════════════════════════════════════════════════════════════
     METRIC COUNTER ANIMATIONS
     ═══════════════════════════════════════════════════════════════ */
  function initCounters() {
    var nums = document.querySelectorAll(".metric-value");

    var obs = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting && !entry.target.classList.contains("counted")) {
            entry.target.classList.add("counted");
            nums.forEach(function (el) {
              var target = parseInt(el.getAttribute("data-target"));
              if (!target) return;
              var start = performance.now();
              (function animate(now) {
                var p = Math.min((now - start) / 2000, 1);
                var val = Math.round(target * (1 - Math.pow(1 - p, 3)));
                if (target === 99) {
                  el.textContent = p < 1 ? val + "%" : "99.9%";
                } else if (target === 10) {
                  el.textContent = p < 1 ? val + "M+" : "10M+";
                } else {
                  el.textContent = p < 1 ? val : target + "+";
                }
                if (p < 1) requestAnimationFrame(animate);
              })(start);
            });
          }
        });
      },
      { threshold: 0.2 }
    );

    var mb = document.querySelector(".hero-metrics-bar");
    if (mb) obs.observe(mb);
  }

  /* ═══════════════════════════════════════════════════════════════
     PRELOADER ENGINE
     Smoothly increments loader percentage (0-100) based on actual
     loaded frames and fades out when complete.
     ═══════════════════════════════════════════════════════════════ */
  function initPreloader() {
    var preloader = $("preloader");
    var bar = document.querySelector(".preloader-bar");
    var pctText = document.querySelector(".preloader-percentage");
    if (!preloader || !bar || !pctText) return;

    // Block scrolling while preloading
    document.body.classList.add("preloader-active");

    var startTime = performance.now();
    var MIN_DURATION = 2500;   // 2.5 seconds total loader display
    var HOLD_AT_99  = 600;     // pause at 99% for dramatic effect before 100
    var reachedNinetyNine = false;
    var ninetyNineTime = 0;
    var displayPercent  = 0;

    function ease(t) {
      // 3-phase curve:
      // 0.00–0.35 → fast start  (0–40%)
      // 0.35–0.80 → smooth mid  (40–85%)
      // 0.80–1.00 → slow crawl  (85–100%) — feels satisfying
      if (t < 0.35) {
        return (t / 0.35) * 0.40;
      } else if (t < 0.80) {
        return 0.40 + ((t - 0.35) / 0.45) * 0.45;
      } else {
        return 0.85 + ((t - 0.80) / 0.20) * 0.15;
      }
    }

    function update(now) {
      var elapsed  = now - startTime;
      var timePct  = Math.min(elapsed / MIN_DURATION, 1.0);
      var eased    = ease(timePct);

      // Also check actual frame load progress — take the slower of the two
      var framePct = framesLoaded / TOTAL_FRAMES;
      var rawPct   = Math.min(eased, framePct);

      // Pause at 99 until frames are loaded AND hold time elapsed
      if (rawPct >= 0.99) {
        if (!reachedNinetyNine) {
          reachedNinetyNine = true;
          ninetyNineTime = now;
        }
        var heldFor = now - ninetyNineTime;
        if (framePct >= 1 && heldFor >= HOLD_AT_99) {
          rawPct = 1.0; // release to 100
        } else {
          rawPct = 0.99;
        }
      }

      displayPercent = Math.floor(rawPct * 100);
      bar.style.width      = displayPercent + "%";
      pctText.textContent  = displayPercent + "%";

      if (displayPercent >= 100) {
        // Brief pause at 100% then fade out
        setTimeout(function () {
          preloader.classList.add("fade-out");
          document.body.classList.remove("preloader-active");
        }, 600);
      } else {
        requestAnimationFrame(update);
      }
    }

    requestAnimationFrame(update);
  }

  /* ═══════════════════════════════════════════════════════════════
     INIT
     ═══════════════════════════════════════════════════════════════ */
  function init() {
    initPreloader();
    initNavCursorPill();
    initScrollReveal();
    initSmokeTailSimulation();
    preloadFrames();
    initCounters();

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
