// Helpers
const $ = (sel, parent = document) => parent.querySelector(sel);
const $$ = (sel, parent = document) => Array.from(parent.querySelectorAll(sel));

// Safe localStorage access
const storage = {
  get(key, fallback = null) {
    try { return localStorage.getItem(key) ?? fallback; } catch { return fallback; }
  },
  set(key, value) {
    try { localStorage.setItem(key, value); } catch {}
  }
};

document.addEventListener('DOMContentLoaded', () => {
  // Año en footer
  const yearEl = $('#year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // Lazy loading para <img>
  document.querySelectorAll('img').forEach(img => {
    if (!img.hasAttribute('loading')) img.setAttribute('loading', 'lazy');
    img.decoding = 'async';
  });

  // ScrollReveal (si no reduce motion)
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!reduce && typeof ScrollReveal !== 'undefined') {
    const sr = ScrollReveal();
    sr.reveal('#sobre-mi .lead', { delay: 150, distance: '24px', origin: 'bottom', duration: 700, easing: 'ease-out' });
    sr.reveal('#conocimientos .col-md-6', { interval: 120, distance: '28px', origin: 'bottom', duration: 700, easing: 'ease-out' });
    sr.reveal('#proyectos .col-md-6, #proyectos .col-lg-4', { interval: 120, distance: '28px', origin: 'bottom', duration: 700, easing: 'ease-out' });
    sr.reveal('#contacto form, #contacto .card', { interval: 120, distance: '28px', origin: 'bottom', duration: 700, easing: 'ease-out' });
  }

  // Idioma (data-es / data-en) + persistencia
  (function setupLanguage() {
    const langBtn = $('#langBtn');
    let currentLang = storage.get('lang', 'es');

    function applyLang(lang) {
      currentLang = lang;
      document.documentElement.setAttribute('lang', lang === 'es' ? 'es' : 'en');
      if (langBtn) {
        langBtn.textContent = lang === 'es' ? 'EN' : 'ES';
        langBtn.setAttribute('aria-pressed', lang === 'en' ? 'true' : 'false');
      }

      document.querySelectorAll('[data-es]').forEach(el => {
        const newContent = el.getAttribute(`data-${lang}`);
        if (!newContent) return;
        if (newContent.includes('<')) el.innerHTML = newContent; else el.textContent = newContent;
      });

      storage.set('lang', currentLang);
    }

    langBtn?.addEventListener('click', () => {
      applyLang(currentLang === 'es' ? 'en' : 'es');
    });

    // Aplicar al cargar
    applyLang(currentLang);
  })();

  // Navbar: activar enlace según sección visible y cerrar en móvil
  (function setupActiveNav() {
    const navLinks = $$('.navbar .nav-link[href^="#"]');
    const sections = navLinks.map(a => $(a.getAttribute('href'))).filter(Boolean);

    if ('IntersectionObserver' in window) {
      const obs = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          const id = '#' + entry.target.id;
          const link = navLinks.find(a => a.getAttribute('href') === id);
          if (entry.isIntersecting) {
            navLinks.forEach(a => a.classList.remove('active'));
            link?.classList.add('active');
          }
        });
      }, { rootMargin: '-40% 0px -50% 0px', threshold: 0.1 });

      sections.forEach(sec => obs.observe(sec));
    }

    // Cerrar menú en móvil al navegar
    navLinks.forEach(link => {
      link.addEventListener('click', () => {
        const nav = $('#nav');
        if (nav?.classList.contains('show')) {
          const bsCollapse = window.bootstrap?.Collapse.getOrCreateInstance(nav);
          bsCollapse?.hide();
        }
      });
    });
  })();

  // Back to top
  (function setupBackToTop() {
    const btn = document.getElementById('backToTop');
    if (!btn) return;
    window.addEventListener('scroll', () => {
      btn.style.display = window.scrollY > 400 ? 'inline-flex' : 'none';
    });
    btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
  })();

  // Manejo de envío del formulario con fetch (Formspree) + multi-idioma
  (function setupFormspree() {
    const form = document.querySelector('#contacto form');
    const alertBox = document.getElementById('formAlert');
    if (!form || !alertBox) return;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const lang = document.documentElement.getAttribute('lang') === 'en' ? 'en' : 'es';
      const okMsg = alertBox.getAttribute(`data-${lang}-exito`) || (lang === 'en' ? 'Message sent.' : 'Mensaje enviado.');
      const errMsg = alertBox.getAttribute(`data-${lang}-error`) || (lang === 'en' ? 'Error sending.' : 'Error al enviar.');

      const data = new FormData(form);
      try {
        const res = await fetch(form.action, { method: form.method, body: data, headers: { 'Accept': 'application/json' } });
        if (res.ok) {
          form.reset();
          alertBox.className = 'alert alert-success mt-3';
          alertBox.textContent = okMsg;
        } else {
          throw new Error('Request failed');
        }
      } catch {
        alertBox.className = 'alert alert-danger mt-3';
        alertBox.textContent = errMsg;
      }
    });
  })();
});
