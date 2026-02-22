/* ========================================
   Solentrex - Main JS
   Premium scroll reveals, slideshow,
   card tilt, magnetic buttons, counters,
   easter eggs
   ======================================== */

document.addEventListener('DOMContentLoaded', () => {

  // --- Full-page grid overlay (ALL pages) ---
  const grid = document.createElement('div');
  grid.className = 'fullpage-grid';
  document.body.insertBefore(grid, document.body.firstChild);

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

  // =========================================
  //  INTERACTIVE CARD TILT (3D perspective)
  // =========================================
  const isMobile = window.matchMedia('(max-width:768px)').matches;

  if (!isMobile) {
    const tiltCards = document.querySelectorAll('.bento-card, .integration-card, .stat-card');
    tiltCards.forEach(card => {
      card.style.transition = 'transform 0.15s ease-out';
      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        const rotateX = ((y - centerY) / centerY) * -4;
        const rotateY = ((x - centerX) / centerX) * 4;
        card.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-3px)`;
      });
      card.addEventListener('mouseleave', () => {
        card.style.transform = '';
      });
    });

    // =========================================
    //  MAGNETIC BUTTONS
    // =========================================
    const magneticBtns = document.querySelectorAll('.btn-orange, .btn-blue');
    magneticBtns.forEach(btn => {
      btn.addEventListener('mousemove', (e) => {
        const rect = btn.getBoundingClientRect();
        const btnCenterX = rect.left + rect.width / 2;
        const btnCenterY = rect.top + rect.height / 2;
        const distX = e.clientX - btnCenterX;
        const distY = e.clientY - btnCenterY;
        const dist = Math.sqrt(distX * distX + distY * distY);
        if (dist < 80) {
          const pull = (1 - dist / 80) * 4;
          const moveX = (distX / dist) * pull;
          const moveY = (distY / dist) * pull;
          btn.style.transform = `translate(${moveX}px, ${moveY}px) translateY(-2px)`;
        }
      });
      btn.addEventListener('mouseleave', () => {
        btn.style.transform = '';
      });
    });
  }

  // =========================================
  //  ANIMATED NUMBER COUNTERS
  // =========================================
  function animateCounter(el) {
    const text = el.textContent.trim();
    // Parse patterns: "86K+", "-1.1%", "<60s", "6,800+", "$2M+", "100%", "2.5", "32", "15 min"
    const match = text.match(/^([<$-]?)([0-9,.]+)([KkMm]?)([+%s]?.*)$/);
    if (!match) return;

    const prefix = match[1];
    const numStr = match[2].replace(/,/g, '');
    const suffix1 = match[3]; // K, M
    const suffix2 = match[4]; // +, %, s, etc.
    const target = parseFloat(numStr);
    const hasDecimal = numStr.includes('.');
    const decimalPlaces = hasDecimal ? (numStr.split('.')[1] || '').length : 0;
    const hasComma = match[2].includes(',');

    const duration = 1500;
    const startTime = performance.now();

    function easeOutCubic(t) { return 1 - Math.pow(1 - t, 3); }

    function formatNum(n) {
      let s = hasDecimal ? n.toFixed(decimalPlaces) : Math.round(n).toString();
      if (hasComma) {
        const parts = s.split('.');
        parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
        s = parts.join('.');
      }
      return s;
    }

    function tick(now) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = easeOutCubic(progress);
      const current = target * eased;
      el.textContent = prefix + formatNum(current) + suffix1 + suffix2;
      if (progress < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  const counterEls = document.querySelectorAll('.hero-stat .num, .stat-card .num');
  if (counterEls.length) {
    const counterObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          animateCounter(entry.target);
          counterObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });
    counterEls.forEach(el => counterObserver.observe(el));
  }

  // =========================================
  //  EASTER EGGS
  // =========================================

  // --- Konami Code: ↑↑↓↓←→←→BA ---
  const konamiSequence = [38,38,40,40,37,39,37,39,66,65];
  let konamiIndex = 0;
  document.addEventListener('keydown', (e) => {
    if (e.keyCode === konamiSequence[konamiIndex]) {
      konamiIndex++;
      if (konamiIndex === konamiSequence.length) {
        konamiIndex = 0;
        triggerConfetti();
      }
    } else {
      konamiIndex = 0;
    }
  });

  function triggerConfetti() {
    const colors = ['#F57F06', '#ff8c1a', '#ffab42', '#0258A8', '#2b7de9', '#4da3e8'];
    for (let i = 0; i < 60; i++) {
      const piece = document.createElement('div');
      piece.className = 'confetti-piece';
      piece.style.left = Math.random() * 100 + 'vw';
      piece.style.top = '-10px';
      piece.style.background = colors[Math.floor(Math.random() * colors.length)];
      piece.style.width = (Math.random() * 6 + 4) + 'px';
      piece.style.height = (Math.random() * 6 + 4) + 'px';
      piece.style.animationDuration = (Math.random() * 1.5 + 1.5) + 's';
      piece.style.animationDelay = (Math.random() * 0.5) + 's';
      document.body.appendChild(piece);
      setTimeout(() => piece.remove(), 3000);
    }
  }

  // --- Logo triple-click: brief dark orange theme flash ---
  const logoLink = document.querySelector('.nav-logo');
  if (logoLink) {
    let clickCount = 0;
    let clickTimer = null;
    logoLink.addEventListener('click', (e) => {
      clickCount++;
      if (clickTimer) clearTimeout(clickTimer);
      if (clickCount === 3) {
        clickCount = 0;
        e.preventDefault();
        document.body.style.transition = 'filter 0.3s';
        document.body.style.filter = 'sepia(0.4) saturate(1.5) hue-rotate(-10deg)';
        setTimeout(() => {
          document.body.style.filter = '';
          setTimeout(() => { document.body.style.transition = ''; }, 300);
        }, 2000);
      }
      clickTimer = setTimeout(() => { clickCount = 0; }, 500);
    });
  }

  // --- 86K+ hover tooltip: "and counting..." after 3s ---
  const devHoursStat = Array.from(document.querySelectorAll('.hero-stat')).find(el => {
    const num = el.querySelector('.num');
    return num && num.textContent.includes('86K');
  });
  if (devHoursStat) {
    devHoursStat.style.position = 'relative';
    let hoverTimer = null;
    const tooltip = document.createElement('div');
    tooltip.className = 'easter-tooltip';
    tooltip.textContent = 'and counting...';
    devHoursStat.appendChild(tooltip);

    devHoursStat.addEventListener('mouseenter', () => {
      hoverTimer = setTimeout(() => {
        tooltip.classList.add('visible');
      }, 3000);
    });
    devHoursStat.addEventListener('mouseleave', () => {
      if (hoverTimer) clearTimeout(hoverTimer);
      tooltip.classList.remove('visible');
    });
  }
});
