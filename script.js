'use strict';

/* ─── NAVBAR ─────────────────────────────────────────── */
(function initNav() {
  const nav = document.getElementById('nav');
  const hamburger = document.getElementById('hamburger');
  const navLinks = document.getElementById('nav-links');

  function openMenu() {
    navLinks.classList.add('open');
    hamburger.classList.add('active');
    hamburger.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
  }

  function closeMenu() {
    navLinks.classList.remove('open');
    hamburger.classList.remove('active');
    hamburger.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  }

  hamburger.addEventListener('click', () => {
    const isOpen = navLinks.classList.contains('open');
    isOpen ? closeMenu() : openMenu();
  });

  navLinks.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', closeMenu);
  });

  // Close on Escape
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && navLinks.classList.contains('open')) closeMenu();
  });

  // Scroll-based nav styling
  const onScroll = () => {
    nav.classList.toggle('scrolled', window.scrollY > 50);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
})();

/* ─── PRELOADER ──────────────────────────────────────── */
(function initPreloader() {
  const pl       = document.getElementById('preloader');
  const wordmark = document.getElementById('plWordmark');
  const bar      = document.getElementById('plBar');
  const dot      = document.getElementById('plDot');
  const counter  = document.getElementById('plCounter');

  if (!pl) { window.dispatchEvent(new CustomEvent('preloaderDone')); return; }

  // Skip on repeat visits within the same tab session
  if (sessionStorage.getItem('plSeen')) {
    pl.remove();
    return;
  }

  document.body.style.overflow = 'hidden';

  const FINAL    = 'ORION';
  const CHARS    = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const settled  = [false, false, false, false, false];
  let   progressComplete = false;

  function randomChar() {
    return CHARS[Math.floor(Math.random() * CHARS.length)];
  }

  // ── Scramble ──
  const scrambleStart    = performance.now();
  const SCRAMBLE_TOTAL   = 1700;
  const SETTLE_STAGGER   = 210;

  function scrambleLoop(now) {
    const elapsed = now - scrambleStart;
    const chars   = FINAL.split('');

    chars.forEach((ch, i) => {
      if (elapsed >= SCRAMBLE_TOTAL * 0.32 + i * SETTLE_STAGGER) {
        settled[i] = true;
      }
      if (!settled[i]) chars[i] = randomChar();
    });

    wordmark.textContent = chars.join('');

    if (!settled.every(Boolean)) {
      requestAnimationFrame(scrambleLoop);
    } else {
      wordmark.textContent = FINAL;
      pl.classList.add('pl-ready');
      checkExit();
    }
  }

  // Show accent + tagline shortly after start
  setTimeout(() => pl.classList.add('pl-ready'), 420);
  requestAnimationFrame(scrambleLoop);

  // ── Progress bar ──
  const progressStart    = performance.now();
  const PROGRESS_DURATION = 1950;

  function progressLoop(now) {
    const raw = Math.min((now - progressStart) / PROGRESS_DURATION, 1);
    // ease-in-out quad
    const eased  = raw < 0.5 ? 2 * raw * raw : 1 - Math.pow(-2 * raw + 2, 2) / 2;
    const pctInt = Math.round(eased * 100);

    if (bar) bar.style.width = pctInt + '%';
    if (dot) dot.style.left  = pctInt + '%';
    if (counter) counter.textContent = pctInt + '%';

    if (raw < 1) {
      requestAnimationFrame(progressLoop);
    } else {
      progressComplete = true;
      checkExit();
    }
  }

  requestAnimationFrame(progressLoop);

  // ── Exit sequence ──
  function checkExit() {
    if (!progressComplete || !settled.every(Boolean)) return;

    setTimeout(() => {
      // 1. Wordmark tears apart
      pl.classList.add('pl-exit-text');

      setTimeout(() => {
        // 2. Panels slide to edges
        pl.classList.add('pl-exit-panels');

        setTimeout(() => {
          // 3. Cleanup
          sessionStorage.setItem('plSeen', '1');
          document.body.style.overflow = '';
          pl.style.pointerEvents = 'none';
          pl.remove();
          window.dispatchEvent(new CustomEvent('preloaderDone'));
        }, 980);
      }, 220);
    }, 320);
  }
})();

/* ─── HERO HEADLINE ANIMATION ────────────────────────── */
(function animateHero() {
  const words = document.querySelectorAll('.hero-headline .word');

  function run() {
    words.forEach((word, i) => {
      setTimeout(() => word.classList.add('visible'), 200 + i * 160);
    });
  }

  // If preloader was already seen this session, run immediately
  if (sessionStorage.getItem('plSeen')) {
    run();
  } else {
    window.addEventListener('preloaderDone', run, { once: true });
  }
})();

/* ─── SCROLL REVEAL ──────────────────────────────────── */
(function initScrollReveal() {
  const revealEls = document.querySelectorAll('.reveal');

  if (!window.IntersectionObserver) {
    revealEls.forEach(el => el.classList.add('visible'));
    return;
  }

  const observer = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
  );

  revealEls.forEach(el => observer.observe(el));
})();

/* ─── SMOOTH SCROLL (ANCHOR LINKS) ──────────────────── */
(function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', e => {
      const target = document.querySelector(anchor.getAttribute('href'));
      if (!target) return;
      e.preventDefault();
      const navEl = document.getElementById('nav');
      const navHeight = navEl.offsetHeight + parseInt(getComputedStyle(navEl).top || '0', 10);
      const top = target.getBoundingClientRect().top + window.scrollY - navHeight - 20;
      window.scrollTo({ top, behavior: 'smooth' });
    });
  });
})();

/* ─── COUNTER ANIMATION (TRUST BAR) ─────────────────── */
(function initCounters() {
  const counters = document.querySelectorAll('.stat-number');

  const parseTarget = el => {
    const text = el.textContent.trim();
    const num = parseFloat(text.replace(/[^0-9.]/g, ''));
    const suffix = text.replace(/[0-9.]/g, '');
    return { num, suffix };
  };

  const animateCounter = el => {
    const { num, suffix } = parseTarget(el);
    const duration = 1500;
    const start = performance.now();

    const isDecimal = num % 1 !== 0;

    const tick = now => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const value = num * eased;
      el.textContent = (isDecimal ? value.toFixed(1) : Math.floor(value)) + suffix;
      if (progress < 1) requestAnimationFrame(tick);
    };

    requestAnimationFrame(tick);
  };

  if (!window.IntersectionObserver) return;

  const observer = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          animateCounter(entry.target);
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.5 }
  );

  counters.forEach(el => observer.observe(el));
})();

/* ─── CONTACT FORM ───────────────────────────────────── */
(function initForm() {
  const form = document.getElementById('contactForm');
  const successMsg = document.getElementById('formSuccess');
  const submitBtn = document.getElementById('submitBtn');

  if (!form) return;

  form.addEventListener('submit', e => {
    e.preventDefault();

    // Basic validation
    const name = form.querySelector('#name').value.trim();
    const phone = form.querySelector('#phone').value.trim();
    const propertyType = form.querySelector('#propertyType').value;
    const budget = form.querySelector('#budget').value;

    if (!name || !phone || !propertyType || !budget) {
      highlightInvalid(form);
      return;
    }

    // Phone validation (basic)
    if (phone.replace(/\D/g, '').length < 10) {
      const phoneInput = form.querySelector('#phone');
      phoneInput.style.borderColor = '#ef4444';
      phoneInput.focus();
      return;
    }

    // Simulate submission (replace with actual Tally/API call)
    submitBtn.disabled = true;
    submitBtn.querySelector('.btn-text').textContent = 'Sending...';

    setTimeout(() => {
      form.style.display = 'none';
      successMsg.hidden = false;

      // Optional: open WhatsApp after 1 second as backup
      setTimeout(() => {
        const msg = encodeURIComponent(
          `Hi ORION, I'm interested in a ${propertyType.replace('-', '/')} property within ${budget.replace('-', ' to ')} budget. My name is ${name} and my phone is ${phone}.`
        );
        // Uncomment to auto-redirect to WhatsApp:
        // window.open(`https://wa.me/919094006778?text=${msg}`, '_blank');
      }, 1200);
    }, 800);
  });

  // Clear error styles on input
  form.querySelectorAll('input, select').forEach(el => {
    el.addEventListener('input', () => { el.style.borderColor = ''; });
    el.addEventListener('change', () => { el.style.borderColor = ''; });
  });

  function highlightInvalid(form) {
    form.querySelectorAll('input[required], select[required]').forEach(el => {
      if (!el.value.trim()) {
        el.style.borderColor = '#ef4444';
        el.addEventListener('input', () => { el.style.borderColor = ''; }, { once: true });
      }
    });
  }
})();

/* ─── CARD HOVER DEPTH EFFECT ────────────────────────── */
(function initCardParallax() {
  const cards = document.querySelectorAll('.service-card, .property-card, .testimonial-card');

  cards.forEach(card => {
    card.addEventListener('mousemove', e => {
      const rect = card.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      card.style.transform = `perspective(800px) rotateY(${x * 4}deg) rotateX(${-y * 4}deg) translateY(-6px)`;
    });
    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
    });
  });
})();

/* ─── ACTIVE NAV LINK HIGHLIGHT ─────────────────────── */
(function initActiveNav() {
  const sections = document.querySelectorAll('section[id]');
  const navAnchors = document.querySelectorAll('.nav-links li a:not(.nav-cta)');

  if (!window.IntersectionObserver) return;

  const observer = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const id = entry.target.getAttribute('id');
          navAnchors.forEach(a => {
            a.style.color = a.getAttribute('href') === `#${id}` ? 'var(--white)' : '';
          });
        }
      });
    },
    { threshold: 0.4 }
  );

  sections.forEach(s => observer.observe(s));
})();

/* ─── SCROLL PROGRESS BAR ────────────────────────────── */
(function initScrollProgress() {
  const bar = document.createElement('div');
  bar.className = 'scroll-progress';
  document.body.prepend(bar);

  const update = () => {
    const scrolled = window.scrollY;
    const total = document.documentElement.scrollHeight - window.innerHeight;
    bar.style.width = (total > 0 ? (scrolled / total) * 100 : 0) + '%';
  };
  window.addEventListener('scroll', update, { passive: true });
  update();
})();

/* ─── CUSTOM CURSOR ──────────────────────────────────── */
(function initCursor() {
  if (window.matchMedia('(pointer: coarse)').matches) return;

  const dot = document.createElement('div');
  dot.className = 'cursor-dot';
  const ring = document.createElement('div');
  ring.className = 'cursor-ring';
  document.body.append(dot, ring);

  let mx = -100, my = -100;
  let rx = -100, ry = -100;
  let rafId;

  document.addEventListener('mousemove', e => {
    mx = e.clientX;
    my = e.clientY;
    dot.style.transform = `translate(calc(${mx}px - 50%), calc(${my}px - 50%))`;
  });

  const lerp = (a, b, t) => a + (b - a) * t;

  const animateRing = () => {
    rx = lerp(rx, mx, 0.12);
    ry = lerp(ry, my, 0.12);
    ring.style.transform = `translate(calc(${rx}px - 50%), calc(${ry}px - 50%))`;
    rafId = requestAnimationFrame(animateRing);
  };
  animateRing();

  const hoverEls = 'a, button, [role="button"], select, input, textarea, [tabindex="0"]';
  document.querySelectorAll(hoverEls).forEach(el => {
    el.addEventListener('mouseenter', () => ring.classList.add('hovered'));
    el.addEventListener('mouseleave', () => ring.classList.remove('hovered'));
  });
  document.addEventListener('mousedown', () => ring.classList.add('clicking'));
  document.addEventListener('mouseup', () => ring.classList.remove('clicking'));
  document.addEventListener('mouseleave', () => { dot.style.opacity = '0'; ring.style.opacity = '0'; });
  document.addEventListener('mouseenter', () => { dot.style.opacity = '1'; ring.style.opacity = '1'; });
})();

/* ─── DIRECTIONAL REVEAL (data-reveal attr) ─────────── */
(function initDirectionalReveal() {
  const els = document.querySelectorAll('[data-reveal]');
  if (!els.length || !window.IntersectionObserver) return;

  const observer = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
  );

  els.forEach(el => observer.observe(el));
})();

/* ─── PARALLAX HERO ORBS (handled by initHeroScrollLayers) ── */
// Orb parallax is now managed in initHeroScrollLayers below for
// unified multi-layer handling. This stub is intentionally empty.
(function initParallax() {})();

/* ─── MAGNETIC BUTTONS ───────────────────────────────── */
(function initMagnetic() {
  if (window.matchMedia('(pointer: coarse)').matches) return;

  document.querySelectorAll('.btn-gold').forEach(btn => {
    btn.addEventListener('mousemove', e => {
      const rect = btn.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = (e.clientX - cx) * 0.22;
      const dy = (e.clientY - cy) * 0.22;
      btn.style.transform = `translate(${dx}px, ${dy}px)`;
    });
    btn.addEventListener('mouseleave', () => {
      btn.style.transform = '';
    });
  });
})();

/* ─── FAQ ACCORDION ──────────────────────────────────── */
(function initFAQ() {
  document.querySelectorAll('.faq-question').forEach(btn => {
    btn.addEventListener('click', () => {
      const item = btn.closest('.faq-item');
      const isOpen = item.classList.contains('open');

      // close all others in this list
      const list = item.closest('.faq-list');
      if (list) {
        list.querySelectorAll('.faq-item.open').forEach(open => {
          if (open !== item) open.classList.remove('open');
        });
      }

      item.classList.toggle('open', !isOpen);
      btn.setAttribute('aria-expanded', String(!isOpen));
    });
  });
})();

/* ─── STAGGER CHILDREN REVEAL ────────────────────────── */
(function initStaggerReveal() {
  const containers = document.querySelectorAll('.stagger');
  if (!containers.length || !window.IntersectionObserver) return;

  const observer = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.querySelectorAll('.reveal, [data-reveal]').forEach(child => {
            child.classList.add('visible');
          });
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.1 }
  );

  containers.forEach(c => observer.observe(c));
})();

/* ─── TYPING EFFECT (for .typing-text elements) ──────── */
(function initTyping() {
  document.querySelectorAll('.typing-text').forEach(el => {
    const text = el.textContent;
    el.textContent = '';
    el.style.opacity = '1';

    const observer = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) {
        let i = 0;
        const tick = () => {
          if (i <= text.length) {
            el.textContent = text.slice(0, i);
            i++;
            setTimeout(tick, 38);
          }
        };
        tick();
        observer.disconnect();
      }
    }, { threshold: 0.5 });

    observer.observe(el);
  });
})();

/* ─── HERO RIGHT ENTRANCE ─────────────────────────────────── */
(function initHeroRightEntrance() {
  const elements = [
    document.querySelector('.hero-prop-preview'),
    ...document.querySelectorAll('.hero-float-stat')
  ].filter(Boolean);

  if (!elements.length) return;

  // Use CSS individual transform properties so they don't conflict with
  // floatCardA animation (which uses `transform`)
  elements.forEach(el => {
    el.style.opacity = '0';
    el.style.scale = '0.9';
    el.style.translate = '0px 40px';
    el.style.transition =
      'opacity 0.75s cubic-bezier(0.16, 1, 0.3, 1),' +
      'translate 0.75s cubic-bezier(0.16, 1, 0.3, 1),' +
      'scale 0.75s cubic-bezier(0.16, 1, 0.3, 1)';
  });

  function run() {
    setTimeout(() => {
      elements.forEach((el, i) => {
        setTimeout(() => {
          el.style.opacity = '1';
          el.style.scale = '1';
          el.style.translate = '0px 0px';
          setTimeout(() => { el.style.transition = ''; }, 820);
        }, i * 220);
      });
    }, 700);
  }

  if (sessionStorage.getItem('plSeen')) {
    run();
  } else {
    window.addEventListener('preloaderDone', run, { once: true });
  }
})();

/* ─── HERO MOUSE PARALLAX ─────────────────────────────────── */
(function initHeroMouseParallax() {
  if (window.matchMedia('(pointer: coarse)').matches) return;

  const hero     = document.getElementById('home');
  const propCard = document.querySelector('.hero-prop-preview');
  const stats    = document.querySelectorAll('.hero-float-stat');

  if (!hero || !propCard) return;

  let tx = 0, ty = 0, cx = 0, cy = 0, rafActive = false;
  const lerp = (a, b, t) => a + (b - a) * t;

  hero.addEventListener('mousemove', e => {
    const r = hero.getBoundingClientRect();
    tx = (e.clientX - r.left  - r.width  * 0.5) / (r.width  * 0.5);
    ty = (e.clientY - r.top   - r.height * 0.5) / (r.height * 0.5);
    if (!rafActive) { rafActive = true; loop(); }
  });

  hero.addEventListener('mouseleave', () => { tx = 0; ty = 0; });

  function loop() {
    cx = lerp(cx, tx, 0.062);
    cy = lerp(cy, ty, 0.062);

    // Card moves opposite to cursor — appears deeper in the scene
    propCard.style.translate = `${cx * -16}px ${cy * -10}px`;

    // Stat badges move with cursor — closer layer, more movement
    stats.forEach((s, i) => {
      const d = i === 0 ? 22 : 16;
      s.style.translate = `${cx * d}px ${cy * d * 0.55}px`;
    });

    const settled = Math.abs(cx - tx) < 0.002 && Math.abs(cy - ty) < 0.002;
    rafActive = !settled;
    if (rafActive) requestAnimationFrame(loop);
  }
})();

/* ─── SCROLL PARALLAX: HERO LAYERS ───────────────────────── */
(function initHeroScrollLayers() {
  const hero      = document.getElementById('home');
  const dotGrid   = document.querySelector('.hero-dot-grid');
  const heroRight = document.querySelector('.hero-right');
  const orb1      = document.querySelector('.orb-1');
  const orb2      = document.querySelector('.orb-2');

  if (!hero) return;

  let ticking = false;

  window.addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;

    requestAnimationFrame(() => {
      const y  = window.scrollY;
      const hH = hero.offsetHeight;

      if (y <= hH * 1.5) {
        // Farthest layer — dot grid barely moves (sticks behind)
        if (dotGrid)   dotGrid.style.transform   = `translateY(${y * 0.07}px)`;
        // Mid layer — orbs at medium speed (already handled by initParallax,
        // but we reinforce here for non-conflicting orb-1/orb-2 transforms)
        if (orb1) orb1.style.transform = `translateY(${y * 0.2}px) translate(${0}px, ${0}px)`;
        if (orb2) orb2.style.transform = `translateY(${y * 0.14}px)`;
        // Closest background layer — hero-right cards exit faster
        if (heroRight) heroRight.style.transform = `translateY(${y * 0.06}px)`;
      } else {
        if (dotGrid)   dotGrid.style.transform   = '';
        if (heroRight) heroRight.style.transform = '';
      }

      ticking = false;
    });
  }, { passive: true });
})();

/* ─── PREFOOTER CTA: WATERMARK PARALLAX ──────────────────── */
(function initWatermarkParallax() {
  const section = document.querySelector('.prefooter-cta');
  if (!section || !window.IntersectionObserver) return;

  let active = false;
  let ticking = false;

  const io = new IntersectionObserver(entries => {
    active = entries[0].isIntersecting;
  }, { threshold: 0 });
  io.observe(section);

  window.addEventListener('scroll', () => {
    if (!active || ticking) return;
    ticking = true;

    requestAnimationFrame(() => {
      const rect   = section.getBoundingClientRect();
      const center = rect.top + rect.height * 0.5 - window.innerHeight * 0.5;
      // Shift the ::before pseudo through a CSS custom property
      section.style.setProperty('--wm-y', `calc(-50% + ${center * 0.12}px)`);
      ticking = false;
    });
  }, { passive: true });
})();

/* ─── MAGNETIC ENHANCEMENT: STAT PILLS ──────────────────── */
(function initStatMagnetic() {
  if (window.matchMedia('(pointer: coarse)').matches) return;

  document.querySelectorAll('.stat-item').forEach(item => {
    item.addEventListener('mousemove', e => {
      const r  = item.getBoundingClientRect();
      const dx = (e.clientX - r.left - r.width  * 0.5) * 0.12;
      const dy = (e.clientY - r.top  - r.height * 0.5) * 0.12;
      item.style.transform = `translate(${dx}px, ${dy}px)`;
    });
    item.addEventListener('mouseleave', () => { item.style.transform = ''; });
  });
})();

/* ─── HERO CARD PERSPECTIVE TILT ─────────────────────────── */
// Uses `rotate` CSS property (separate from `transform`) so it
// composes cleanly with the floatCardA animation transform.
(function initHeroCardTilt() {
  if (window.matchMedia('(pointer: coarse)').matches) return;

  const propPreview = document.querySelector('.hero-prop-preview');
  if (!propPreview) return;

  let cx = 0, cy = 0, tx = 0, ty = 0, rafId;
  const lerp = (a, b, t) => a + (b - a) * t;

  propPreview.addEventListener('mousemove', e => {
    const r = propPreview.getBoundingClientRect();
    tx = (e.clientX - r.left) / r.width  - 0.5;
    ty = (e.clientY - r.top)  / r.height - 0.5;
    if (!rafId) tiltLoop();
  });

  propPreview.addEventListener('mouseleave', () => { tx = 0; ty = 0; });

  function tiltLoop() {
    cx = lerp(cx, tx, 0.1);
    cy = lerp(cy, ty, 0.1);

    // perspective + rotateX/Y via inline transform — this overrides floatCardA
    // only during hover (which is fine as it looks intentional)
    propPreview.style.transform =
      `perspective(700px) rotateY(${cx * 10}deg) rotateX(${-cy * 10}deg)`;

    const settled = Math.abs(cx - tx) < 0.003 && Math.abs(cy - ty) < 0.003;
    if (!settled) {
      rafId = requestAnimationFrame(tiltLoop);
    } else {
      propPreview.style.transform = '';
      rafId = null;
    }
  }
})();
