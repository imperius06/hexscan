/**
 * HexScan — Client-side router (History API)
 * Archivo: js/router.js
 *
 * Crea URLs canónicas por herramienta:
 *   /tools/subdomain-recon
 *   /tools/breach-checker
 *   ... etc.
 *
 * Sin dependencias. Compatible con tus scripts existentes (main.js, tool*.js).
 */

// ─── Mapa de rutas ────────────────────────────────────────────────────────────
// Cada entrada: slug → { sectionId en el DOM, title, description }
const ROUTES = {
  '': {
    sectionId: null,
    title: 'HexScan — Free Online Security Tools for Developers & Pentesters',
    description: 'Free online security tools: password generator, email breach checker, subdomain finder, IP lookup, HTTP header analyzer, directory scanner, CSP generator and Base64 decoder.',
    canonical: 'https://hexscan-tools.vercel.app/',
  },
  'password-generator': {
    sectionId: 'password',
    title: 'Password Generator — HexScan',
    description: 'Generate crypto-secure passwords instantly. Custom length, uppercase, lowercase, numbers and symbols.',
    canonical: 'https://hexscan-tools.vercel.app/tools/password-generator',
  },
  'breach-checker': {
    sectionId: 'breach',
    title: 'Breach Checker — HexScan',
    description: 'Check if your email appeared in a known data breach. Uses LeakCheck API. Your data is never stored.',
    canonical: 'https://hexscan-tools.vercel.app/tools/breach-checker',
  },
  'subdomain-recon': {
    sectionId: 'subdomains',
    title: 'Subdomain Recon — HexScan',
    description: 'Discover subdomains using passive sources: crt.sh Certificate Transparency Logs and HackerTarget API. No direct scanning.',
    canonical: 'https://hexscan-tools.vercel.app/tools/subdomain-recon',
  },
  'ip-analyzer': {
    sectionId: 'ipanalyzer',
    title: 'IP Analyzer — HexScan',
    description: 'Geolocation, reputation, open ports, and hosted domains for any IP address.',
    canonical: 'https://hexscan-tools.vercel.app/tools/ip-analyzer',
  },
  'http-headers': {
    sectionId: 'headers',
    title: 'HTTP Header Analyzer — HexScan',
    description: 'Full security audit of HTTP response headers. Scan any URL or paste headers manually.',
    canonical: 'https://hexscan-tools.vercel.app/tools/http-headers',
  },
  'exposure-check': {
    sectionId: 'exposure',
    title: 'Directory Exposure Checker — HexScan',
    description: 'Check 120 sensitive paths: configs, backups, APIs, admin panels, Git files and more.',
    canonical: 'https://hexscan-tools.vercel.app/tools/exposure-check',
  },
  'csp-generator': {
    sectionId: 'csp',
    title: 'CSP Generator — HexScan',
    description: 'Build a Content Security Policy header visually. Configure script-src, style-src, img-src and more.',
    canonical: 'https://hexscan-tools.vercel.app/tools/csp-generator',
  },
  'base64-jwt': {
    sectionId: 'base64',
    title: 'Base64 & JWT Decoder — HexScan',
    description: 'Encode, decode Base64 or decode a JWT token instantly. Client-side, nothing leaves your browser.',
    canonical: 'https://hexscan-tools.vercel.app/tools/base64-jwt',
  },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parseSlug(pathname) {
  // '/tools/subdomain-recon' → 'subdomain-recon'
  // '/' o '/tools/' → ''
  const m = pathname.match(/^\/tools\/([^/]+)\/?$/);
  return m ? m[1] : '';
}

function updateMeta(route) {
  document.title = route.title;

  _setMeta('name', 'description', route.description);
  _setMeta('property', 'og:title', route.title);
  _setMeta('property', 'og:description', route.description);
  _setMeta('property', 'og:url', route.canonical);
  _setMeta('name', 'twitter:title', route.title);
  _setMeta('name', 'twitter:description', route.description);

  // Canonical link
  let canonEl = document.querySelector('link[rel="canonical"]');
  if (!canonEl) {
    canonEl = document.createElement('link');
    canonEl.rel = 'canonical';
    document.head.appendChild(canonEl);
  }
  canonEl.href = route.canonical;
}

function _setMeta(attr, key, value) {
  let el = document.querySelector(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.content = value;
}

function scrollToSection(sectionId, instant) {
  if (!sectionId) return;
  const el = document.getElementById(sectionId);
  if (!el) return;
  const NAV_HEIGHT = 64; // altura de tu .site-header
  const top = el.getBoundingClientRect().top + window.scrollY - NAV_HEIGHT;
  window.scrollTo({ top, behavior: instant ? 'instant' : 'smooth' });
}

function markActiveNav(slug) {
  // Marca activo cualquier link con data-tool-slug
  document.querySelectorAll('[data-tool-slug]').forEach(el => {
    el.classList.toggle('nav-active', el.dataset.toolSlug === slug);
  });
  // También marca activo el chip del hero si lo tiene
  document.querySelectorAll('[data-hero-slug]').forEach(el => {
    el.classList.toggle('active', el.dataset.heroSlug === slug);
  });
}

// ─── Router ───────────────────────────────────────────────────────────────────

const HexRouter = {

  init() {
    const slug = parseSlug(window.location.pathname);
    const route = ROUTES[slug] ?? ROUTES[''];

    // Primera carga: reemplaza el state sin añadir al historial
    history.replaceState({ slug }, '', window.location.href);
    updateMeta(route);
    markActiveNav(slug);

    // Si entraron directo a /tools/subdomain-recon, scroll al section
    if (slug && route.sectionId) {
      // rAF doble para que el layout esté pintado antes del scroll
      requestAnimationFrame(() =>
        requestAnimationFrame(() => scrollToSection(route.sectionId, true))
      );
    }

    // Botón atrás / adelante
    window.addEventListener('popstate', (e) => {
      const s = e.state?.slug ?? parseSlug(window.location.pathname);
      const r = ROUTES[s] ?? ROUTES[''];
      updateMeta(r);
      markActiveNav(s);
      if (r.sectionId) scrollToSection(r.sectionId, false);
    });

    // Intercepta clicks en [data-tool-slug] — nav + hero chips
    document.addEventListener('click', (e) => {
      const link = e.target.closest('[data-tool-slug]');
      if (!link) return;
      e.preventDefault();
      this.go(link.dataset.toolSlug);
    });

    // Intercepta [data-hero-slug] — chips del hero
    document.addEventListener('click', (e) => {
      const chip = e.target.closest('[data-hero-slug]');
      if (!chip) return;
      e.preventDefault();
      this.go(chip.dataset.heroSlug);
    });
  },

  // Navega a una herramienta
  go(slug, { replace = false, scroll = true } = {}) {
    const route = ROUTES[slug];
    if (!route) {
      console.warn('[HexRouter] Slug desconocido:', slug);
      return;
    }
    const url = slug ? `/tools/${slug}` : '/';
    history[replace ? 'replaceState' : 'pushState']({ slug }, '', url);
    updateMeta(route);
    markActiveNav(slug);
    if (scroll && route.sectionId) scrollToSection(route.sectionId, false);
  },

  // Expone slugs para el futuro command palette
  get slugs() {
    return Object.entries(ROUTES)
      .filter(([s]) => s !== '')
      .map(([slug, r]) => ({ slug, title: r.title.split(' —')[0], sectionId: r.sectionId }));
  },
};

// Expón globalmente para que otros scripts puedan llamar HexRouter.go(...)
window.HexRouter = HexRouter;
