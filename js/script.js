/* ============================================================
   Muthukumar B — Portfolio
   Interactions, reveal, magnetic cursor, counters
   ============================================================ */

(() => {
  const $ = (s, root = document) => root.querySelector(s);
  const $$ = (s, root = document) => Array.from(root.querySelectorAll(s));
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Loader ---------- */
  const loader = $('[data-loader]');
  const loaderCount = $('[data-loader-count]');

  const runLoader = () =>
    new Promise((resolve) => {
      let n = 0;
      const target = 100;
      const step = () => {
        n += Math.max(1, Math.round((target - n) * 0.08));
        if (n >= target) n = target;
        if (loaderCount) loaderCount.textContent = n;
        if (n < target) requestAnimationFrame(step);
        else {
          setTimeout(() => {
            loader?.classList.add('is-done');
            resolve();
          }, 300);
        }
      };
      requestAnimationFrame(step);
    });

  /* ---------- Year + coffee ---------- */
  const setMetaBits = () => {
    const y = $('[data-year]');
    if (y) y.textContent = new Date().getFullYear();
    const coffee = $('[data-coffee]');
    if (coffee) {
      // playful: pick a number that increments daily based on date
      const dayOfYear = Math.floor(
        (Date.now() - new Date(new Date().getFullYear(), 0, 0)) / 86400000
      );
      coffee.textContent = (dayOfYear + 1).toLocaleString();
    }
  };

  /* ---------- Nav scroll state + hide-on-scroll-down ---------- */
  const nav = $('[data-nav]');
  const toTop = $('[data-to-top]');
  let lastY = window.scrollY;
  let ticking = false;
  const onScroll = () => {
    const y = window.scrollY;
    if (nav) {
      nav.classList.toggle('is-scrolled', y > 30);
      // Hide when scrolling down past the hero, reveal on scroll up
      const goingDown = y > lastY + 4;
      const goingUp = y < lastY - 4;
      if (goingDown && y > 140) nav.classList.add('is-hidden');
      else if (goingUp) nav.classList.remove('is-hidden');
    }
    if (toTop) toTop.classList.toggle('is-visible', y > 500);
    lastY = y;
    ticking = false;
  };
  window.addEventListener(
    'scroll',
    () => {
      if (!ticking) {
        requestAnimationFrame(onScroll);
        ticking = true;
      }
    },
    { passive: true }
  );

  if (toTop) {
    toTop.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  /* Theme toggle is wired up in the inline <head> script for FOUC prevention. */
  const themeBtn = $('[data-theme-toggle]');
  if (themeBtn) {
    const syncAria = () => {
      const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
      themeBtn.setAttribute('aria-pressed', isDark);
    };
    syncAria();
    new MutationObserver(syncAria).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  }

  /* ---------- Mobile menu ---------- */
  const toggle = $('[data-nav-toggle]');
  const mobile = $('[data-mobile-menu]');
  if (toggle && mobile) {
    const close = () => {
      toggle.classList.remove('is-open');
      mobile.classList.remove('is-open');
      document.body.style.overflow = '';
    };
    toggle.addEventListener('click', () => {
      const open = !toggle.classList.contains('is-open');
      toggle.classList.toggle('is-open', open);
      mobile.classList.toggle('is-open', open);
      document.body.style.overflow = open ? 'hidden' : '';
    });
    $$('a', mobile).forEach((a) => a.addEventListener('click', close));
  }

  /* ---------- Reveal on scroll ---------- */
  const revealEls = $$('[data-reveal]');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('is-visible');
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: '0px 0px -8% 0px' }
    );
    revealEls.forEach((el) => io.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add('is-visible'));
  }

  /* ---------- Counters ---------- */
  const animateCounter = (el) => {
    const target = parseInt(el.dataset.counter, 10) || 0;
    const suffix = el.dataset.suffix || '';
    const duration = 1500;
    const start = performance.now();
    const ease = (t) => 1 - Math.pow(1 - t, 3);
    const tick = (now) => {
      const p = Math.min(1, (now - start) / duration);
      el.textContent = Math.round(target * ease(p));
      if (suffix) el.dataset.suffix = suffix;
      if (p < 1) requestAnimationFrame(tick);
      else el.textContent = target;
    };
    requestAnimationFrame(tick);
  };
  if ('IntersectionObserver' in window) {
    const cio = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            animateCounter(e.target);
            cio.unobserve(e.target);
          }
        });
      },
      { threshold: 0.4 }
    );
    $$('[data-counter]').forEach((el) => cio.observe(el));
  }

  /* ---------- Magnetic buttons ---------- */
  const isCoarse = window.matchMedia('(pointer: coarse)').matches;
  if (!isCoarse && !prefersReduced) {
    $$('[data-magnetic]').forEach((el) => {
      el.addEventListener('mousemove', (e) => {
        const r = el.getBoundingClientRect();
        const x = e.clientX - (r.left + r.width / 2);
        const y = e.clientY - (r.top + r.height / 2);
        el.style.transform = `translate(${x * 0.18}px, ${y * 0.25}px)`;
      });
      el.addEventListener('mouseleave', () => {
        el.style.transform = '';
      });
    });
  }

  /* ---------- Card spotlight ---------- */
  $$('.card').forEach((card) => {
    card.addEventListener('mousemove', (e) => {
      const r = card.getBoundingClientRect();
      const mx = ((e.clientX - r.left) / r.width) * 100;
      const my = ((e.clientY - r.top) / r.height) * 100;
      card.style.setProperty('--mx', mx + '%');
      card.style.setProperty('--my', my + '%');
    });
  });

  /* ---------- Hero parallax blobs ---------- */
  if (!prefersReduced) {
    const blobs = $$('.hero__blob');
    window.addEventListener('mousemove', (e) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 30;
      const y = (e.clientY / window.innerHeight - 0.5) * 30;
      blobs.forEach((b, i) => {
        const k = i === 0 ? 1 : -1;
        b.style.translate = `${x * k}px ${y * k}px`;
      });
    });
  }

  /* ---------- Contact form (mailto fallback) ---------- */
  const form = $('[data-form]');
  const hint = $('[data-form-hint]');
  const btnText = $('[data-form-btn-text]');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const fd = new FormData(form);
      const name = (fd.get('name') || '').toString().trim();
      const email = (fd.get('email') || '').toString().trim();
      const type = (fd.get('type') || '').toString().trim();
      const message = (fd.get('message') || '').toString().trim();

      if (!name || !email || !message) {
        if (hint) {
          hint.textContent = 'Please fill in name, email and message.';
          hint.classList.add('is-error');
          hint.classList.remove('is-success');
        }
        return;
      }

      const subject = encodeURIComponent(`Enquiry — ${type || 'General'} — ${name}`);
      const body = encodeURIComponent(
        `Hi Muthukumar,\n\n${message}\n\n— ${name}\n${email}`
      );
      const mailto = `mailto:bmuthukumar206@gmail.com?subject=${subject}&body=${body}`;

      if (btnText) btnText.textContent = 'Opening mail…';
      window.location.href = mailto;

      if (hint) {
        hint.textContent = "Thanks! Your mail client should open. If not, write me directly at bmuthukumar206@gmail.com";
        hint.classList.add('is-success');
        hint.classList.remove('is-error');
      }
      setTimeout(() => {
        if (btnText) btnText.textContent = 'Send enquiry';
      }, 2500);
    });
  }

  /* ---------- Boot ---------- */
  setMetaBits();
  onScroll();

  if (prefersReduced) {
    loader?.classList.add('is-done');
    revealEls.forEach((el) => el.classList.add('is-visible'));
  } else {
    runLoader();
  }
})();
