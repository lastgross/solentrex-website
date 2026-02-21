/* ========================================
   Solentrex – Main JS
   Premium scroll reveals + slideshow
   ======================================== */

document.addEventListener('DOMContentLoaded', () => {

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
    hamburger.addEventListener('click', () => {
      mobileMenu.classList.toggle('open');
      const spans = hamburger.querySelectorAll('span');
      if (mobileMenu.classList.contains('open')) {
        spans[0].style.transform = 'rotate(45deg) translate(5px, 5px)';
        spans[1].style.opacity = '0';
        spans[2].style.transform = 'rotate(-45deg) translate(5px, -5px)';
      } else {
        spans.forEach(s => { s.style.transform = ''; s.style.opacity = ''; });
      }
    });
    mobileMenu.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        mobileMenu.classList.remove('open');
        hamburger.querySelectorAll('span').forEach(s => { s.style.transform = ''; s.style.opacity = ''; });
      });
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
