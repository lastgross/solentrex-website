/* ========================================
   Cursor Glow – Soft radial gradient
   that follows the mouse with lerp delay
   ======================================== */

(function () {
  // Skip on touch-only devices
  if ('ontouchstart' in window && !window.matchMedia('(pointer:fine)').matches) return;

  var glow = document.createElement('div');
  glow.className = 'cursor-glow';
  document.body.appendChild(glow);

  var mouseX = -300, mouseY = -300;
  var glowX = -300, glowY = -300;
  var visible = false;
  var rafId = null;

  function lerp(a, b, t) { return a + (b - a) * t; }

  function tick() {
    glowX = lerp(glowX, mouseX, 0.12);
    glowY = lerp(glowY, mouseY, 0.12);
    glow.style.transform = 'translate(' + (glowX - 100) + 'px,' + (glowY - 100) + 'px)';
    rafId = requestAnimationFrame(tick);
  }

  document.addEventListener('mousemove', function (e) {
    mouseX = e.clientX;
    mouseY = e.clientY;
    if (!visible) {
      visible = true;
      glow.style.opacity = '1';
    }
  }, { passive: true });

  document.addEventListener('mouseleave', function () {
    visible = false;
    glow.style.opacity = '0';
  });

  document.addEventListener('mouseenter', function () {
    visible = true;
    glow.style.opacity = '1';
  });

  // Detect section theme for glow color
  function updateGlowColor() {
    if (!visible) return;
    var el = document.elementFromPoint(mouseX, mouseY);
    if (!el) return;
    var section = el.closest('.contained.warm, .contained.light, .warm');
    if (section) {
      glow.style.background = 'radial-gradient(circle, rgba(245,127,6,0.2) 0%, transparent 70%)';
    } else {
      glow.style.background = 'radial-gradient(circle, rgba(43,125,233,0.25) 0%, transparent 70%)';
    }
  }

  // Throttled color update
  var colorTimer = null;
  document.addEventListener('mousemove', function () {
    if (!colorTimer) {
      colorTimer = setTimeout(function () {
        updateGlowColor();
        colorTimer = null;
      }, 200);
    }
  }, { passive: true });

  rafId = requestAnimationFrame(tick);
})();
