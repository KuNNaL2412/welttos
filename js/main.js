/* ═══════════════════════════════════════════════
   WELTTOS — MAIN JAVASCRIPT
═══════════════════════════════════════════════ */

/* ─── THEME SYSTEM ─── */
function getTheme() { return document.documentElement.getAttribute('data-theme') || 'dark'; }
function isDark() { return getTheme() === 'dark'; }

function toggleTheme() {
  const next = isDark() ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('wt-theme', next);
  const icon = document.getElementById('theme-icon');
  if (icon) icon.textContent = next === 'dark' ? '🌙' : '☀️';
}

// Initialize theme from localStorage immediately (avoids flash)
(function() {
  const saved = localStorage.getItem('wt-theme') || 'light';
  document.documentElement.setAttribute('data-theme', saved);
})();

/* ─── AI CANVAS BACKGROUND ─── */
(function() {
  const canvas = document.getElementById('bg-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let W, H, nodes = [];
  /* Adaptive node count: fewer nodes on mobile = less CPU = better TBT/INP */
  const N = window.innerWidth < 768 ? 45 : 90;

  const DARK = {
    nodePrimary:   { r: 255, g: 122, b: 101 },  /* tomato light */
    nodeSecondary: { r: 255, g: 128, b: 192 },  /* light pink */
    nodeAccent:    { r: 94,  g: 234, b: 212 },  /* light teal */
    lineColor:     'rgba(255,122,101,',
    lineAlpha:     0.38,
    nodeAlpha:     0.92,
    scanColor:     'rgba(255,122,101,',
    scanAlpha:     0.075,
    charColor:     'rgba(255,122,101,',
    charAlpha:     0.32
  };
  const LIGHT = {
    nodePrimary:   { r: 255, g: 92,  b: 69  },  /* tomato red */
    nodeSecondary: { r: 217, g: 70,  b: 168 },  /* raspberry pink */
    nodeAccent:    { r: 20,  g: 184, b: 166 },  /* teal */
    lineColor:     'rgba(255,92,69,',
    lineAlpha:     0.42,
    nodeAlpha:     0.95,
    scanColor:     'rgba(255,92,69,',
    scanAlpha:     0.065,
    charColor:     'rgba(255,92,69,',
    charAlpha:     0.28
  };

  function getT() { return isDark() ? DARK : LIGHT; }

  function resize() {
    W = canvas.width = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }
  window.addEventListener('resize', resize);
  resize();

  function randColor(t) {
    const p = Math.random();
    if (p < 0.45) return t.nodePrimary;
    if (p < 0.78) return t.nodeSecondary;
    return t.nodeAccent;
  }

  function initNodes() {
    nodes = [];
    const t = getT();
    for (let i = 0; i < N; i++) {
      nodes.push({
        x: Math.random() * W,
        y: Math.random() * H,
        vx: (Math.random() - .5) * .4,
        vy: (Math.random() - .5) * .4,
        r: Math.random() * 1.2 + 1.0,
        cr: randColor(t)
      });
    }
  }
  initNodes();

  const CHARS = ['0', '1', 'AI', '∇', 'σ', 'λ', '⊕', '∑', 'ML', 'NN', '→', '∫', 'π', '10', '01'];
  const floats = [];
  for (let i = 0; i < 20; i++) {
    floats.push({
      x: Math.random() * 1920,
      y: Math.random() * 1080,
      vy: -(Math.random() * .45 + .12),
      char: CHARS[Math.floor(Math.random() * CHARS.length)],
      size: Math.random() * 9 + 8
    });
  }

  function draw() {
    const t = getT();
    ctx.clearRect(0, 0, W, H);

    // Connection lines
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const dx = nodes[i].x - nodes[j].x;
        const dy = nodes[i].y - nodes[j].y;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d < 150) {
          ctx.beginPath();
          ctx.strokeStyle = t.lineColor + ((1 - d / 150) * t.lineAlpha) + ')';
          ctx.lineWidth = (1 - d / 150) * 0.8;
          ctx.moveTo(nodes[i].x, nodes[i].y);
          ctx.lineTo(nodes[j].x, nodes[j].y);
          ctx.stroke();
        }
      }
    }

    // Node dots
    nodes.forEach(n => {
      const { r, g, b } = n.cr;
      ctx.beginPath();
      ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${r},${g},${b},${t.nodeAlpha})`;
      ctx.fill();
      n.x += n.vx;
      n.y += n.vy;
      if (n.x < 0 || n.x > W) n.vx *= -1;
      if (n.y < 0 || n.y > H) n.vy *= -1;
    });

    // Floating chars
    floats.forEach(f => {
      ctx.font = `${f.size}px 'JetBrains Mono', monospace`;
      ctx.fillStyle = t.charColor + t.charAlpha + ')';
      ctx.fillText(f.char, f.x % W, f.y);
      f.y += f.vy;
      if (f.y < -20) {
        f.y = H + 10;
        f.x = Math.random() * W;
      }
    });

    // Horizontal scan line
    const now = Date.now();
    const sy = (now % 5500) / 5500 * H;
    const sg = ctx.createLinearGradient(0, sy - 28, 0, sy + 28);
    sg.addColorStop(0, t.scanColor + '0)');
    sg.addColorStop(0.5, t.scanColor + t.scanAlpha + ')');
    sg.addColorStop(1, t.scanColor + '0)');
    ctx.fillStyle = sg;
    ctx.fillRect(0, sy - 28, W, 56);

    requestAnimationFrame(draw);
  }

  new MutationObserver(() => {
    const t2 = getT();
    nodes.forEach(n => { n.cr = randColor(t2); });
  }).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

  draw();
})();

/* ─── SCROLL OBSERVER (fade-up animations) ─── */
function initObs() {
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        const el = e.target;
        const sibs = el.parentElement ? [...el.parentElement.querySelectorAll('.fu')] : [el];
        el.style.transitionDelay = (sibs.indexOf(el) * 90) + 'ms';
        el.classList.add('vis');
        obs.unobserve(el);
      }
    });
  }, { threshold: .08, rootMargin: '0px 0px -40px 0px' });
  document.querySelectorAll('.fu:not(.vis)').forEach(el => obs.observe(el));
}

/* ─── FAQ ACCORDION ─── */
function toggleFaq(btn) {
  const item = btn.closest('.faq-i');
  const open = item.classList.contains('open');
  document.querySelectorAll('.faq-i.open').forEach(i => i.classList.remove('open'));
  if (!open) item.classList.add('open');
}

/* ─── BUTTON RIPPLE EFFECT ─── */
function initRipple() {
  document.addEventListener('click', e => {
    const b = e.target.closest('.btn');
    if (!b) return;
    const r = b.getBoundingClientRect();
    const sz = Math.max(r.width, r.height) * 1.4;
    const el = document.createElement('span');
    el.className = 'ripple';
    el.style.cssText = `width:${sz}px;height:${sz}px;left:${e.clientX - r.left - sz / 2}px;top:${e.clientY - r.top - sz / 2}px;`;
    b.appendChild(el);
    setTimeout(() => el.remove(), 600);
  });
}

/* ─── HERO TYPEWRITER ─── */
function initTyper() {
  const phrases = [
    'AI & Tech Solutions — Built for Real Results',
    'Voice Agents that never sleep',
    'Find any document in plain English',
    'Smart gate access for housing societies',
    'Deployed in Pune, scaling across India'
  ];
  const el = document.getElementById('badge-text');
  if (!el) return;
  let pi = 0, ci = 0, del = false;
  function tick() {
    const ph = phrases[pi];
    if (!del) {
      el.textContent = ph.slice(0, ++ci);
      if (ci === ph.length) { del = true; setTimeout(tick, 2600); return; }
    } else {
      el.textContent = ph.slice(0, --ci);
      if (ci === 0) { del = false; pi = (pi + 1) % phrases.length; }
    }
    setTimeout(tick, del ? 26 : 44);
  }
  tick();
}

/* ─── NAV COMPACT ON SCROLL ─── */
window.addEventListener('scroll', () => {
  const nav = document.getElementById('main-nav');
  if (nav) nav.classList.toggle('compact', window.scrollY > 55);
}, { passive: true });

/* ═══════════════════════════════════════════════
   CUSTOM FORM SUBMISSION → REDIRECT TO THANK-YOU PAGE
═══════════════════════════════════════════════ */

function initContactForm() {
  const form = document.getElementById('contact-form');
  if (!form) return;

  form.addEventListener('submit', async function(e) {
    e.preventDefault();

    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = 'Sending…';

    try {
      const data = new FormData(form);
      const response = await fetch(form.action, {
        method: 'POST',
        body: data,
        headers: { 'Accept': 'application/json' }
      });

      if (response.ok) {
        form.reset();
        // Redirect to dedicated thank-you page (URL for ad conversion tracking)
        window.location.href = 'thank-you.html';
      } else {
        const json = await response.json().catch(() => ({}));
        alert(json.error || 'Something went wrong. Please try again or email us directly.');
      }
    } catch (err) {
      alert('Network error. Please check your connection and try again.');
      console.error(err);
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalText;
    }
  });
}

/* ─── INITIALIZE ON LOAD ─── */
document.addEventListener('DOMContentLoaded', () => {
  // Set theme icon based on current theme
  const icon = document.getElementById('theme-icon');
  if (icon) icon.textContent = isDark() ? '🌙' : '☀️';

  initObs();
  initRipple();
  initTyper();
  initContactForm();
});

/* ════════════════════════════════════════════════════════════
   MOBILE SIDEBAR NAVIGATION
═══════════════════════════════════════════════════════════ */

/* Lifts the sidebar + backdrop out of <nav> on mobile so no ancestor's
   transform/overflow/filter can break their position:fixed. Puts them
   back inside <nav> on desktop where they're not visible anyway. */
function adjustNavLayout() {
  const nav      = document.getElementById('main-nav');
  const sidebar  = document.getElementById('nav-sidebar');
  const backdrop = document.getElementById('sidebar-backdrop');
  if (!nav || !sidebar || !backdrop) return;

  const isMobile = window.matchMedia('(max-width: 900px)').matches;
  const isInBody = sidebar.parentElement === document.body;

  if (isMobile && !isInBody) {
    document.body.appendChild(sidebar);
    document.body.appendChild(backdrop);
  } else if (!isMobile && isInBody) {
    nav.appendChild(sidebar);
    nav.appendChild(backdrop);
  }
}

function initSidebar() {
  const btn      = document.getElementById('hamburger-btn');
  const sidebar  = document.getElementById('nav-sidebar');
  const backdrop = document.getElementById('sidebar-backdrop');

  if (!btn || !sidebar || !backdrop) return;

  // Position sidebar/backdrop correctly for current viewport BEFORE wiring up handlers
  adjustNavLayout();

  function openSidebar() {
    sidebar.classList.add('open');
    backdrop.classList.add('open');
    btn.classList.add('open');
    btn.setAttribute('aria-expanded', 'true');
    document.body.classList.add('sidebar-open');
  }

  function closeSidebar() {
    sidebar.classList.remove('open');
    backdrop.classList.remove('open');
    btn.classList.remove('open');
    btn.setAttribute('aria-expanded', 'false');
    document.body.classList.remove('sidebar-open');
  }

  function toggleSidebar() {
    if (sidebar.classList.contains('open')) closeSidebar();
    else openSidebar();
  }

  // Hamburger click
  btn.addEventListener('click', toggleSidebar);

  // Backdrop click → close
  backdrop.addEventListener('click', closeSidebar);

  // Auto-close on link click (so the next page loads with sidebar hidden)
  sidebar.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      closeSidebar();
      // Body unlock happens immediately so the new page loads with no scroll lock
    });
  });

  // Escape key closes sidebar
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && sidebar.classList.contains('open')) {
      closeSidebar();
    }
  });

  // Close sidebar if window resizes above mobile breakpoint + handle layout swap
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      if (window.innerWidth > 900 && sidebar.classList.contains('open')) {
        closeSidebar();
      }
      adjustNavLayout();
    }, 150);
  });
}

// Wire it up on DOM ready
document.addEventListener('DOMContentLoaded', initSidebar);
