/* ========================================
   Solentrex – Main JS
   ======================================== */

document.addEventListener('DOMContentLoaded', () => {

  // --- Sticky Nav scroll state ---
  const nav = document.querySelector('.nav');
  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 40);
  }, { passive: true });

  // --- Mobile hamburger ---
  const hamburger = document.querySelector('.nav-hamburger');
  const mobileMenu = document.querySelector('.mobile-menu');
  hamburger?.addEventListener('click', () => {
    mobileMenu.classList.toggle('open');
    const spans = hamburger.querySelectorAll('span');
    if (mobileMenu.classList.contains('open')) {
      spans[0].style.transform = 'rotate(45deg) translate(5px, 5px)';
      spans[1].style.opacity = '0';
      spans[2].style.transform = 'rotate(-45deg) translate(5px, -5px)';
    } else {
      spans[0].style.transform = '';
      spans[1].style.opacity = '';
      spans[2].style.transform = '';
    }
  });

  // Close mobile menu on link click
  mobileMenu?.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      mobileMenu.classList.remove('open');
      const spans = hamburger.querySelectorAll('span');
      spans.forEach(s => { s.style.transform = ''; s.style.opacity = ''; });
    });
  });

  // --- Slideshow ---
  const slides = document.querySelectorAll('.slide');
  const dots = document.querySelectorAll('.slide-dot');
  const progressBar = document.querySelector('.slide-progress');
  let current = 0;
  const total = slides.length;
  const INTERVAL = 5000;
  let timer = null;
  let progressStart = null;
  let progressRAF = null;

  function goTo(index) {
    slides[current].classList.remove('active');
    dots[current].classList.remove('active');
    current = index % total;
    slides[current].classList.add('active');
    dots[current].classList.add('active');
    startProgress();
  }

  function startProgress() {
    if (progressRAF) cancelAnimationFrame(progressRAF);
    progressStart = performance.now();
    function tick(now) {
      const elapsed = now - progressStart;
      const pct = Math.min(elapsed / INTERVAL * 100, 100);
      if (progressBar) progressBar.style.width = pct + '%';
      if (elapsed < INTERVAL) {
        progressRAF = requestAnimationFrame(tick);
      }
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
    dot.addEventListener('click', () => {
      goTo(i);
      startAuto();
    });
  });

  if (total > 0) {
    slides[0].classList.add('active');
    dots[0]?.classList.add('active');
    startAuto();
  }

  // --- Scroll reveal ---
  const faders = document.querySelectorAll('.fade-up');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });

  faders.forEach(el => observer.observe(el));

  // --- Smooth scroll for anchor links ---
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
      const target = document.querySelector(anchor.getAttribute('href'));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });
});
