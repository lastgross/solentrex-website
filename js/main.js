/* ========================================
   Solentrex – Main JS
   Premium scroll reveals + slideshow
   ======================================== */

document.addEventListener('DOMContentLoaded', () => {

  // --- Page background treatments ---
  // Detect page by URL and inject a fixed overlay for visual depth
  (function() {
    var path = window.location.pathname.toLowerCase();
    var bg = null;

    if (path === '/' || path === '/home' || path.indexOf('index') !== -1 || path.indexOf('home') !== -1) {
      // Home — radial glows
      bg = 'radial-gradient(ellipse 50% 40% at 15% 30%,rgba(2,88,168,.35),transparent),'
         + 'radial-gradient(ellipse 40% 35% at 85% 70%,rgba(245,127,6,.3),transparent),'
         + 'radial-gradient(ellipse 45% 40% at 50% 90%,rgba(43,125,233,.25),transparent)';
    } else if (path.indexOf('platform') !== -1) {
      // Platform — dot grid
      bg = 'radial-gradient(circle,rgba(255,255,255,.25) 1px,transparent 1px)';
    } else if (path.indexOf('integration') !== -1) {
      // Integrations — diagonal lines
      bg = 'repeating-linear-gradient(135deg,rgba(255,255,255,.2) 0px,rgba(255,255,255,.2) 1px,transparent 1px,transparent 40px)';
    } else if (path.indexOf('partner') !== -1) {
      // Partners — gradient sweep
      bg = 'linear-gradient(90deg,rgba(2,88,168,.35) 0%,transparent 40%,transparent 60%,rgba(245,127,6,.3) 100%)';
    } else if (path.indexOf('about') !== -1) {
      // About — noise/grain
      bg = "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")";
    }

    if (bg) {
      var overlay = document.createElement('div');
      overlay.style.cssText = 'position:fixed;inset:0;z-index:0;pointer-events:none;background:' + bg + ';';
      if (path.indexOf('platform') !== -1) {
        overlay.style.backgroundSize = '32px 32px';
      }
      if (path.indexOf('about') !== -1) {
        overlay.style.backgroundSize = '256px 256px';
        overlay.style.backgroundRepeat = 'repeat';
        overlay.style.opacity = '0.5';
      }
      document.body.insertBefore(overlay, document.body.firstChild);
    }
  })();

  // --- Floating pill nav scroll state ---
  const nav = document.querySelector('.nav');
  if (nav) {
    window.addEventListener('scroll', () => {
      nav.classList.toggle('scrolled', window.scrollY > 40);
    }, { passive: true });
  }

  // --- Mobile hamburger ---
  const hamburger = document.querySelector('.nav-hamburger');
  const mobileMenu = document.querySelector('.mobile-menu');
  if (hamburger && mobileMenu) {
    function closeMobileMenu() {
      mobileMenu.classList.remove('open');
      document.body.classList.remove('menu-open');
      hamburger.querySelectorAll('span').forEach(s => { s.style.transform = ''; s.style.opacity = ''; });
    }
    function openMobileMenu() {
      mobileMenu.classList.add('open');
      document.body.classList.add('menu-open');
      const spans = hamburger.querySelectorAll('span');
      spans[0].style.transform = 'rotate(45deg) translate(5px, 5px)';
      spans[1].style.opacity = '0';
      spans[2].style.transform = 'rotate(-45deg) translate(5px, -5px)';
    }
    hamburger.addEventListener('click', () => {
      mobileMenu.classList.contains('open') ? closeMobileMenu() : openMobileMenu();
    });
    mobileMenu.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', closeMobileMenu);
    });
    // Close on outside tap
    document.addEventListener('click', (e) => {
      if (mobileMenu.classList.contains('open') && !mobileMenu.contains(e.target) && !hamburger.contains(e.target)) {
        closeMobileMenu();
      }
    });
  }

  // --- Staggered scroll reveal ---
  const revealEls = document.querySelectorAll('.reveal');
  if (revealEls.length) {
    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
    revealEls.forEach(el => revealObserver.observe(el));
  }

  // --- Slideshow ---
  const slides = document.querySelectorAll('.slide');
  const dots = document.querySelectorAll('.slide-dot');
  const progressBar = document.querySelector('.slide-progress');
  if (slides.length > 0) {
    let current = 0;
    const total = slides.length;
    const INTERVAL = 5000;
    let timer = null;
    let progressStart = null;
    let progressRAF = null;

    function goTo(index) {
      slides[current].classList.remove('active');
      if (dots[current]) dots[current].classList.remove('active');
      current = ((index % total) + total) % total;
      slides[current].classList.add('active');
      if (dots[current]) dots[current].classList.add('active');
      startProgress();
    }

    function startProgress() {
      if (progressRAF) cancelAnimationFrame(progressRAF);
      progressStart = performance.now();
      function tick(now) {
        const elapsed = now - progressStart;
        const pct = Math.min(elapsed / INTERVAL * 100, 100);
        if (progressBar) progressBar.style.width = pct + '%';
        if (elapsed < INTERVAL) progressRAF = requestAnimationFrame(tick);
      }
      progressRAF = requestAnimationFrame(tick);
    }

    function startAuto() {
      stopAuto();
      timer = setInterval(() => goTo(current + 1), INTERVAL);
      startProgress();
    }

    function stopAuto() {
      if (timer) clearInterval(timer);
      if (progressRAF) cancelAnimationFrame(progressRAF);
    }

    dots.forEach((dot, i) => {
      dot.addEventListener('click', () => { goTo(i); startAuto(); });
    });

    // Touch swipe support
    const slidesWrapper = document.querySelector('.slides-wrapper');
    if (slidesWrapper) {
      let touchStartX = 0;
      let touchEndX = 0;
      slidesWrapper.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
      }, { passive: true });
      slidesWrapper.addEventListener('touchend', (e) => {
        touchEndX = e.changedTouches[0].screenX;
        const diff = touchStartX - touchEndX;
        if (Math.abs(diff) > 50) {
          goTo(diff > 0 ? current + 1 : current - 1);
          startAuto();
        }
      }, { passive: true });
    }

    slides[0].classList.add('active');
    if (dots[0]) dots[0].classList.add('active');
    startAuto();
  }

  // --- Smooth scroll for anchor links ---
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
      const href = anchor.getAttribute('href');
      if (href === '#') return;
      const target = document.querySelector(href);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });

  // --- Demo form handler ---
  const demoForm = document.getElementById('demo-form');
  if (demoForm) {
    demoForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const btn = demoForm.querySelector('.btn');
      const origText = btn.textContent;
      btn.textContent = 'Sending...';
      btn.style.opacity = '.6';
      setTimeout(() => {
        btn.textContent = 'Request Sent!';
        btn.style.opacity = '1';
        btn.style.background = '#22c55e';
        setTimeout(() => {
          btn.textContent = origText;
          btn.style.background = '';
          demoForm.reset();
        }, 3000);
      }, 1200);
    });
  }
});
