/* ========================================
   Solentrex - Main JS
   Premium scroll reveals + slideshow
   ======================================== */

document.addEventListener('DOMContentLoaded', () => {

  // --- Full-page grid overlay (home page only) ---
  if (document.querySelector('.hero')) {
    const grid = document.createElement('div');
    grid.className = 'fullpage-grid';
    document.body.insertBefore(grid, document.body.firstChild);
  }

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

  // --- Subtle parallax: background scrolls slower than content ---
  const decors = document.querySelectorAll('.decor-glow, .decor-dots, .decor-ring, .decor-bar, .decor-diamond, .decor-cross, .fullpage-grid');
  if (decors.length) {
    window.addEventListener('scroll', () => {
      const y = window.scrollY * 0.3;
      decors.forEach(el => { el.style.marginTop = y + 'px'; });
    }, { passive: true });
  }

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
