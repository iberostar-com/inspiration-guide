/*
 * Web analytics for the Inspiration Guide microsite.
 * Implements the Merkle tagging spec "IBS Guia Etiquetado Blog V1.0" (07/05/2026):
 * OneTrust (CMP) + Tealium iQ (utag.js) + GA4 ecommerce events.
 *
 * Load order required by the spec: OneTrust first, then utag_data, then utag.js.
 * OneTrust is injected during the lazy phase and utag.js during the delayed
 * phase to protect LCP/TBT. utag.link/view calls issued before utag.js is
 * ready are queued and flushed once it loads.
 */

import getEnvironmentConfig from './environment-config.js';

const ONETRUST_SRC = 'https://cdn.cookielaw.org/scripttemplates/otSDKStub.js';

const HOTEL_LIST_RENDERED = '.recommended-hotels-grid-rendered, .recommended-dynamic-hotels-grid-rendered';
const HOTEL_LIST_ITEM = '.recommended-hotels-item, .recommended-dynamic-hotels-item';

/**
 * Normalizes a value for the data layer: lowercase, no accents and none of
 * the characters forbidden by the spec (&=/\<>+, quotes, tildes, enies).
 * @param {string} value raw text
 * @returns {string}
 */
export function sanitizeValue(value) {
  return `${value ?? ''}`
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[&=/\\<>+"'’`´]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Lowercase + strip diacritics + collapse non-alphanumerics to single spaces.
 * Stricter than sanitizeValue: used for event_lbl, which the spec requires
 * fully normalized (e.g. "España" -> "espana", "Iberostar-Selection 5*" ->
 * "iberostar selection 5").
 * @param {string} value raw text
 * @returns {string}
 */
export function normalize(value) {
  return `${value || ''}`
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9 ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * AEM Core Components Link Accessibility injects a hidden span (e.g. class
 * `cmp-link__screen-reader-only`, "se abre en una pestaña nueva") inside
 * every <a target="_blank"> coming from shared header/footer/nav includes.
 * Plain textContent picks it up and pollutes event labels. Prefer the
 * explicit text span when present; otherwise strip known screen-reader-only
 * nodes from a clone before reading textContent.
 * @param {Element} element link/button element
 * @returns {string}
 */
export function getCleanText(element) {
  if (!element) return '';
  const textSpan = element.querySelector('.ibh-button__text, .cmp-link__text');
  if (textSpan) return (textSpan.textContent || '').trim();

  const clone = element.cloneNode(true);
  clone.querySelectorAll('.cmp-link__screen-reader-only, .screen-reader-only').forEach((node) => node.remove());
  return (clone.textContent || '').replace(/\s+/g, ' ').trim();
}

function textOf(element) {
  return sanitizeValue(element?.textContent || '');
}

// event_lbl per spec must be fully normalized (see `normalize`), built from
// text cleaned of accessibility noise (see `getCleanText`).
function labelOf(element) {
  return normalize(getCleanText(element));
}

function getMeta(name) {
  return document.querySelector(`meta[name="${name}"]`)?.content?.trim()
    || document.querySelector(`meta[property="${name}"]`)?.content?.trim()
    || '';
}

/**
 * Finds the nearest ancestor carrying `data-module-content`, a DOM-driven
 * alternative to hardcoding `module_content` per handler. No block sets this
 * attribute yet, so it currently resolves to null everywhere it's used.
 * @param {Element} element
 * @returns {Element|null}
 */
export function getModuleScope(element) {
  return element && element.closest ? element.closest('[data-module-content]') : null;
}

/**
 * Reads `module_content` from the nearest scope set via `data-module-content`.
 * @param {Element} element
 * @returns {string}
 */
export function getModuleContent(element) {
  const scope = getModuleScope(element);
  return scope ? scope.getAttribute('data-module-content') || '' : '';
}

/**
 * Reads an arbitrary data-* attribute from the nearest ancestor that has it.
 * @param {Element} element
 * @param {string} attr full attribute name, e.g. 'data-analytics-hotel-code'
 * @param {string} [fallback]
 * @returns {string}
 */
export function readDataAttr(element, attr, fallback = '') {
  if (!element) return fallback;
  const node = element.closest(`[${attr}]`);
  return node ? node.getAttribute(attr) || fallback : fallback;
}

function getLocaleFromPath() {
  const segments = window.location.pathname.split('/').filter(Boolean);
  const locale = segments.find((segment) => /^[a-z]{2}-[a-z]{2}$/i.test(segment));
  return (locale || document.documentElement.lang || 'en').toLowerCase();
}

function getEnvironment() {
  const { hostname } = window.location;
  if (hostname === 'localhost' || hostname === '127.0.0.1') return 'dev';
  if (hostname.endsWith('.aem.page') || /^author-p\d+/.test(hostname)) return 'stage';
  return 'prod';
}

/**
 * Analytics must not run while authoring (Universal Editor / author host)
 * nor on fragment pages, to avoid fake traffic in GA4.
 * @returns {boolean}
 */
function isTrackingDisabled() {
  return Boolean(
    document.querySelector('[data-aue-resource]')
    || /^author-p\d+/i.test(window.location.hostname)
    || getMeta('page-type').toLowerCase() === 'fragment',
  );
}

function getDeviceType() {
  const width = window.innerWidth || 0;
  if (width < 600) return 'mobile';
  if (width < 1024) return 'tablet';
  return 'desktop';
}

function getPageType() {
  const fromMeta = getMeta('page-type').toLowerCase();
  if (fromMeta && fromMeta !== 'default') return fromMeta;

  const path = window.location.pathname.toLowerCase();
  if (path.includes('/category/')) return 'category';
  if (path.includes('/tag/')) return 'tag';
  if (getMeta('article-publication-date') || getMeta('article-author-name')) return 'article';
  return fromMeta || 'home';
}

/**
 * Builds the universal data object (utag_data) with every value that can be
 * derived from the page. Per spec, fields that do not apply are omitted.
 * @returns {Object}
 */
export function buildPageData() {
  const url = new URL(window.location.href);
  const params = url.searchParams;

  const data = {
    screen_name: url.pathname.toLowerCase(),
    page_section: 'inspiration guide',
    page_category: sanitizeValue(getMeta('article-category').split(/[,:]/).pop()),
    page_type: getPageType(),
    page_platform: 'web',
    page_language: getLocaleFromPath(),
    page_domain: url.hostname.toLowerCase(),
    page_title: sanitizeValue(document.title),
    page_url: url.href,
    page_url_img: getMeta('og:image'),
    page_pathname: url.pathname.toLowerCase(),
    page_content_title: textOf(document.querySelector('main h1')),
    page_query_string: url.search.replace(/^\?/, ''),
    previous_page: document.referrer || '',
    device_type: getDeviceType(),
    environment: getEnvironment(),
    campaign_name: params.get('utm_campaign') || '',
    campaign_source: params.get('utm_source') || '',
    campaign_medium: params.get('utm_medium') || '',
    campaign_term: params.get('utm_term') || '',
    campaign_content: params.get('utm_content') || '',
    campaign_cp: params.get('cp') || '',
  };

  return Object.fromEntries(Object.entries(data).filter(([, value]) => value !== ''));
}

// ---------- data layer + event queue ----------

const pendingEvents = [];

/**
 * Opt-in only: off unless `?analyticsDebug=true` (or `=1`) is present in the
 * URL. Never enabled by default, so production/local consoles stay clean.
 * @returns {boolean}
 */
function isAnalyticsDebugEnabled() {
  const value = new URLSearchParams(window.location.search).get('analyticsDebug') || '';
  return value === '1' || value.toLowerCase() === 'true';
}

/**
 * Logs a fired event when `analyticsDebug` is enabled. No-op otherwise.
 * @param {'link'|'view'} method utag method used
 * @param {Object} data event payload
 */
function debugLog(method, data) {
  if (!isAnalyticsDebugEnabled()) return;
  // eslint-disable-next-line no-console
  console.log(`[analytics] utag.${method}`, data.tealium_event || '(no tealium_event)', data);
}

function isUtagReady() {
  return typeof window.utag !== 'undefined' && typeof window.utag.link === 'function';
}

/**
 * Merges new values into the global utag_data object so subsequent events
 * inherit the updated context (required by the spec for async events).
 * @param {Object} data key/value pairs to persist in the data layer
 */
export function updateDataLayer(data = {}) {
  window.utag_data = window.utag_data || {};
  Object.entries(data).forEach(([key, value]) => {
    // Event identity keys describe a single hit and must not persist as
    // global context, or later events would inherit a stale event name.
    if (key === 'tealium_event' || key.startsWith('event_')) return;
    if (value !== undefined && value !== null && value !== '') {
      window.utag_data[key] = value;
    }
  });
}

function flushPendingEvents() {
  while (pendingEvents.length) {
    const [method, data] = pendingEvents.shift();
    try {
      window.utag[method](data);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('[analytics] utag call failed', error);
    }
  }
}

/**
 * Fires an async event (utag.link). Queued until utag.js is available.
 * @param {Object} data event payload
 */
export function trackLink(data = {}) {
  updateDataLayer(data);
  debugLog('link', data);
  if (isUtagReady()) {
    window.utag.link(data);
  } else {
    pendingEvents.push(['link', data]);
  }
}

/**
 * Fires a virtual page view (utag.view) for dynamically replaced content.
 * @param {Object} data event payload
 */
export function trackView(data = {}) {
  updateDataLayer(data);
  debugLog('view', data);
  if (isUtagReady()) {
    window.utag.view(data);
  } else {
    pendingEvents.push(['view', data]);
  }
}

// ---------- consent (OneTrust) + tag manager (Tealium) ----------

/**
 * OneTrust domain-script and Tealium utag.js source, resolved per environment.
 * EDS has no build-time environment variables, so the equivalent is:
 *   1. page metadata override ("onetrust-domain-script" / "tealium-utag-src",
 *      settable per site via the bulk metadata sheet, no deploy needed), then
 *   2. the analytics section of environment-config.js (per cloud environment).
 * AEM mirrors this with the ONETRUST_DOMAIN_SCRIPT / TEALIUM_UTAG_SRC
 * Cloud Manager environment variables (see .tmp/GUIA-AEM-ONETRUST-ENV.md).
 * @returns {{oneTrustDomainScript: string, utagSrc: string}}
 */
function getAnalyticsConfig() {
  const config = getEnvironmentConfig().analytics || {};
  return {
    oneTrustDomainScript: getMeta('onetrust-domain-script') || config.oneTrustDomainScript || '',
    utagSrc: getMeta('tealium-utag-src') || config.utagSrc || '',
  };
}

/**
 * Injects the OneTrust CMP stub at the top of <head>. Must run before
 * Tealium so consent rules are in place when tags execute. Idempotent.
 */
export function initConsent() {
  if (isTrackingDisabled()) return;
  if (document.querySelector(`script[src="${ONETRUST_SRC}"]`)) return;

  const { oneTrustDomainScript } = getAnalyticsConfig();
  if (!oneTrustDomainScript) return;

  if (typeof window.OptanonWrapper !== 'function') {
    window.OptanonWrapper = function OptanonWrapper() {};
  }

  const script = document.createElement('script');
  script.src = ONETRUST_SRC;
  script.type = 'text/javascript';
  script.charset = 'UTF-8';
  script.setAttribute('data-document-language', 'true');
  script.setAttribute('data-domain-script', oneTrustDomainScript);
  document.head.prepend(script);
}

function loadTealium() {
  const { utagSrc: src } = getAnalyticsConfig();
  if (!src) return;
  if (document.querySelector(`script[src="${src}"]`)) return;

  const script = document.createElement('script');
  script.src = src;
  script.type = 'text/javascript';
  script.async = true;
  script.addEventListener('load', flushPendingEvents);
  document.head.append(script);
}

async function sha256(value) {
  const normalized = `${value || ''}`.trim().toLowerCase();
  if (!normalized || !window.crypto?.subtle) return '';
  const digest = await window.crypto.subtle.digest('SHA-256', new TextEncoder().encode(normalized));
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

// ---------- module tracking: header / footer / language ----------

// The language modal is mounted on <body>, so the structure (header|footer)
// is captured when the user clicks the trigger that opened it.
let languageContext = 'header';

function handleLanguageOption(actionable) {
  const option = actionable.closest('.nav-language-option-button');
  if (!option) return false;

  const locale = (option.getAttribute('href') || '').match(/\/([a-z]{2}-[a-z]{2})(?:\/|$)/i)?.[1]?.toLowerCase() || '';
  trackLink({
    tealium_event: 'change_language',
    event_cat: 'page info',
    event_act: 'change language',
    event_lbl: labelOf(option),
    event_purpose: 'information',
    event_structure: languageContext,
    module_name: 'intra module',
    module_content: 'information',
    ...(locale ? { page_language: locale } : {}),
  });
  return true;
}

function handleCurrencyOption(actionable) {
  const option = actionable.closest('.nav-language-currency-button');
  if (!option) return false;

  const code = `${option.dataset.currency || ''}`.trim().toUpperCase();
  trackLink({
    tealium_event: 'change_currency',
    event_cat: 'page info',
    event_act: 'change currency',
    event_lbl: normalize(code),
    event_purpose: 'information',
    event_structure: languageContext,
    module_name: 'intra module',
    module_content: 'information',
    ...(code ? { page_currency: code } : {}),
  });
  return true;
}

function handleHeaderClick(actionable) {
  if (!actionable.closest('header')) return false;
  if (actionable.closest('.nav-language-trigger')) return true;

  // IHG Rewards queda excluido del microsite EDS por decision de cliente
  // (PLAN-CIERRE-METRICAS-EDS): se absorbe el click para no disparar ni
  // ihg_one_rewards ni un main_menu espureo.
  const href = (actionable.getAttribute('href') || '').toLowerCase();
  const classes = `${actionable.className || ''}`.toLowerCase();
  if (href.includes('ihg') || classes.includes('ihg')) return true;

  const navItem = actionable.closest('.nav-item');
  const sectionLabel = textOf(navItem?.querySelector('.nav-stripe--parent .nav-stripe-label'));

  if (actionable.matches('.nav-stripe--parent')) {
    trackLink({
      tealium_event: 'main_menu',
      event_cat: 'menu',
      event_act: textOf(actionable),
      event_lbl: '',
      event_purpose: 'information',
      event_structure: 'header',
      module_name: 'menu',
      module_content: `main menu ${textOf(actionable)}`.trim(),
    });
    return true;
  }

  if (actionable.matches('a') && actionable.closest('#nav')) {
    const cleanLabel = getCleanText(actionable);
    const label = sanitizeValue(cleanLabel);
    if (!label) return false;
    trackLink({
      tealium_event: 'main_menu',
      event_cat: 'menu',
      event_act: sectionLabel || label,
      event_lbl: normalize(cleanLabel),
      event_purpose: 'information',
      event_structure: 'header',
      module_name: 'menu',
      module_content: sectionLabel ? `main menu ${sectionLabel}` : 'main menu',
    });
    return true;
  }

  return false;
}

function handleFooterClick(actionable) {
  if (!actionable.closest('footer')) return false;
  if (actionable.closest('.nav-language-trigger, .nav-language-option-button')) return true;
  if (!actionable.matches('a')) return false;

  trackLink({
    tealium_event: 'footer_module',
    event_cat: 'information',
    event_act: 'click',
    event_lbl: labelOf(actionable),
    event_purpose: 'information',
    event_structure: 'footer',
    module_name: 'footer',
    module_content: 'information',
  });
  return true;
}

// ---------- module tracking: blog blocks ----------

function handleBlogSplitList(actionable) {
  const card = actionable.closest('.blog-split-list .blog-split-featured, .blog-split-list .blog-split-item');
  if (!card || !actionable.matches('a')) return false;
  // Category chips navigate to the category page, not the article.
  if (actionable.matches('.blog-split-category')) return false;

  trackLink({
    tealium_event: 'inspiration_guide_module',
    event_cat: 'inspiration guide module',
    event_act: 'see article',
    event_lbl: labelOf(card.querySelector('h1, h2, h3, h4')) || labelOf(actionable),
    event_purpose: 'inspiration',
    event_structure: 'body',
    module_name: 'hero blog split list',
    module_content: 'inspiration guide',
  });
  return true;
}

function handleTopicTagCloud(actionable) {
  if (!actionable.matches('.topic-tag-cloud-chip')) return false;

  trackLink({
    tealium_event: 'inspiration_guide_module',
    event_cat: 'information',
    event_act: 'click',
    event_lbl: labelOf(actionable),
    event_purpose: 'information',
    event_structure: 'body',
    module_name: 'topic tag cloud',
    module_content: 'inspiration guide',
  });
  return true;
}

function handleCategoryGallery(actionable) {
  const gallery = actionable.closest('.carousel-category-gallery, .grid-category-gallery');
  if (!gallery || !actionable.matches('a')) return false;

  const card = actionable.closest('.carousel-category-gallery-card, .grid-category-gallery-card');
  const isViewAll = !card && !!actionable.closest('.grid-category-gallery-cta, .carousel-category-gallery-cta, [class$="-header"]');
  if (!card && !isViewAll) return false;

  trackLink({
    tealium_event: 'experience_module',
    event_cat: 'experiences',
    event_act: 'click',
    event_lbl: card
      ? labelOf(card.querySelector('h2, h3, h4, .grid-category-gallery-title')) || labelOf(card)
      : normalize('view all'),
    event_purpose: 'inspiration',
    event_structure: 'body',
    module_name: 'tabbed category gallery',
    module_content: 'iberostar experience',
  });
  return true;
}

function handleHeroEditorialNav(actionable) {
  if (!actionable.matches('.category-hero-subcategories-link')) return false;

  trackLink({
    tealium_event: 'inspiration_guide_module',
    event_cat: 'information',
    event_act: 'click',
    event_lbl: labelOf(actionable),
    event_purpose: 'information',
    event_structure: 'body',
    module_name: 'hero editorial navigation',
    module_content: 'destinations',
  });
  return true;
}

function handleHighlightGrid(actionable) {
  const grid = actionable.closest('.editorial-highlight-grid');
  if (!grid) return false;

  if (actionable.matches('.editorial-highlight-grid-more, .editorial-highlight-load-more')) {
    trackLink({
      tealium_event: 'inspiration_guide_module',
      event_cat: 'inspiration guide module',
      event_act: 'click',
      event_lbl: normalize('see more articles'),
      event_purpose: 'inspiration',
      event_structure: 'body',
      module_name: 'editorial highlight grid',
      module_content: 'inspiration guide',
    });
    return true;
  }

  const card = actionable.closest('.article-card, .editorial-highlight-card');
  if (!card || !actionable.matches('a')) return false;
  // Category chips navigate to the category page, not the article.
  if (actionable.matches('.article-card-category')) return false;

  trackLink({
    tealium_event: 'inspiration_guide_module',
    event_cat: 'inspiration guide module',
    event_act: 'see article',
    event_lbl: labelOf(card.querySelector('.article-card-title, h2, h3, h4')),
    event_purpose: 'inspiration',
    event_structure: 'body',
    module_name: 'editorial highlight grid',
    module_content: 'inspiration guide',
  });
  return true;
}

// One hotel_multimedia event per media container: repeated play/pause clicks
// on the same video must not inflate the metric.
const trackedMedia = new WeakSet();

function handleHeroMultimedia(target) {
  const container = target.closest('.article-content-video, .article-main-image');
  if (!container) return false;
  if (!target.closest('video, iframe, [class*="play"]')) return false;
  if (trackedMedia.has(container)) return true;
  trackedMedia.add(container);

  trackLink({
    tealium_event: 'hotel_multimedia',
    event_cat: 'hotel information',
    event_act: 'see gallery',
    event_lbl: '',
    event_purpose: 'inspiration',
    event_structure: 'body',
    module_name: 'hero article detail',
    module_content: 'inspiration guide',
  });
  return true;
}

function handleHeroViewHotels(actionable) {
  const miniCard = actionable.closest('.hotel-graphql-mini-card, .hotel-mini-card');
  const banner = actionable.closest('.editorial-article-banner');
  if (!miniCard && !banner) return false;
  if (miniCard && actionable.closest(HOTEL_LIST_ITEM)) return false;
  if (!actionable.matches('a')) return false;

  trackLink({
    tealium_event: 'inspiration_guide_module',
    event_cat: 'inspiration guide module',
    event_act: banner ? 'click' : '',
    event_lbl: normalize('view hotels'),
    event_purpose: 'inspiration',
    event_structure: 'body',
    module_name: 'hero article detail',
    module_content: 'inspiration guide',
  });
  return true;
}

function handleArticleContentCta(actionable) {
  if (!actionable.closest('.editorial-article-content')) return false;
  if (!actionable.matches('a.button, .button-wrapper a')) return false;

  trackLink({
    tealium_event: 'inspiration_guide_module',
    event_cat: 'inspiration guide module',
    event_act: 'click',
    event_lbl: normalize('check availability'),
    event_purpose: 'inspiration',
    event_structure: 'body',
    module_name: 'editorial article content',
    module_content: 'inspiration guide',
  });
  return true;
}

function handleArticleGrid(actionable) {
  const grid = actionable.closest('.editorial-article-grid');
  if (!grid || !actionable.matches('a')) return false;

  const card = actionable.closest('.editorial-article-grid-card');
  trackLink({
    tealium_event: 'guide_module',
    event_cat: 'product',
    event_act: 'click',
    event_lbl: card
      ? labelOf(card.querySelector('h2, h3, h4, [class$="-title"]')) || labelOf(actionable)
      : normalize('view_all'),
    event_purpose: 'inspiration',
    event_structure: 'body',
    module_name: 'editorial article grid',
    module_content: 'guides',
  });
  return true;
}

// ---------- GA4 ecommerce: recommended hotels grid ----------

function parsePrice(text) {
  const match = `${text || ''}`
    .replace(/[.,](?=\d{3}\b)/g, '')
    .match(/\d+(?:[.,]\d+)?/);
  return match ? match[0].replace(',', '.') : '';
}

// Stable product id: hotel code when available, otherwise the URL slug
// (identical across locales), and only as a last resort the localized name.
function getProductId(item, name) {
  if (item.dataset.analyticsHotelCode) return item.dataset.analyticsHotelCode;

  const href = item.querySelector('.hotel-mini-card-title a[href], a[href]')?.getAttribute('href') || '';
  const slug = href.split(/[?#]/)[0]
    .replace(/\/+$/, '')
    .split('/')
    .pop()
    ?.replace(/\.html?$/i, '') || '';

  return sanitizeValue(slug).replace(/\s+/g, '-') || name.replace(/\s+/g, '-');
}

function readProduct(item, index) {
  const title = item.querySelector('.hotel-mini-card-title');
  const name = sanitizeValue(getCleanText(title));
  const priceEl = item.querySelector('.hotel-mini-card-price');
  return {
    id: getProductId(item, name),
    name,
    // product_unit_price must stay in the market base currency: prefer the
    // base amount stamped by the dynamic blocks over the displayed text,
    // which may be converted to the visitor-selected currency.
    price: priceEl?.dataset.priceAmount || parsePrice(priceEl?.textContent),
    position: `${index + 1}`,
    stars: item.dataset.analyticsStars || '',
    location: textOf(item.querySelector('.hotel-mini-card-location')),
    continent: item.dataset.analyticsContinent || '',
    country: item.dataset.analyticsCountry || '',
    // Taxonomia ecommerce: el grid la obtiene de hotels_data.json del DAM
    // (via hotels-api.js) y la estampa como data-analytics-*; misma fuente
    // que las metricas de la home clasica de iberostar.com.
    brand: item.dataset.analyticsBrand || '',
    category: item.dataset.analyticsCategory || '',
    subcategory: item.dataset.analyticsSubcategory || '',
    segment: item.dataset.analyticsSegment || '',
    subsegment: item.dataset.analyticsSubsegment || '',
    onlyAdults: item.dataset.analyticsOnlyAdults || '',
    headquarter: item.dataset.analyticsHeadquarter || '',
    countryCode: item.dataset.analyticsCountryCode || '',
    area: item.dataset.analyticsArea || '',
    zone: item.dataset.analyticsZone || '',
    city: item.dataset.analyticsCity || '',
  };
}

function getProductListName() {
  const data = window.utag_data || {};
  return [data.page_section, data.page_type, 'recommended hotels grid'].filter(Boolean).join('|');
}

function fireViewItemList(rendered) {
  const products = [...rendered.querySelectorAll(HOTEL_LIST_ITEM)].map(readProduct);
  if (!products.length) return;

  trackLink({
    tealium_event: 'view_item_list',
    event_cat: 'ecommerce',
    event_act: '',
    event_lbl: '',
    event_purpose: 'inspiration',
    event_structure: 'impression',
    module_name: 'recommended hotels grid',
    module_content: 'hotels',
    product_list_name: getProductListName(),
    product_id: products.map((product) => product.id),
    product_name: products.map((product) => product.name),
    product_unit_price: products.map((product) => product.price),
    product_quantity: products.map(() => '1'),
    product_position: products.map((product) => product.position),
    ...(products.some((product) => product.brand)
      ? { product_brand: products.map((product) => product.brand) } : {}),
    ...(products.some((product) => product.category)
      ? { product_category: products.map((product) => product.category) } : {}),
    ...(products.some((product) => product.subcategory)
      ? { product_subcategory: products.map((product) => product.subcategory) } : {}),
  });
}

function handleHotelSelect(actionable) {
  const item = actionable.closest(HOTEL_LIST_ITEM);
  if (!item || !actionable.matches('a')) return false;

  const rendered = item.closest(HOTEL_LIST_RENDERED);
  const items = rendered ? [...rendered.querySelectorAll(HOTEL_LIST_ITEM)] : [item];
  const product = readProduct(item, Math.max(items.indexOf(item), 0));

  trackLink({
    tealium_event: 'select_item',
    event_cat: 'ecommerce',
    event_act: 'click product',
    event_lbl: normalize(product.name),
    event_purpose: 'inspiration',
    event_structure: 'body',
    module_name: 'recommended hotels grid',
    module_content: 'hotels',
    product_list_name: getProductListName(),
    product_id: [product.id],
    product_name: [product.name],
    product_unit_price: [product.price],
    product_quantity: ['1'],
    product_position: [product.position],
    ...(product.brand ? { product_brand: [product.brand] } : {}),
    ...(product.category ? { product_category: [product.category] } : {}),
    ...(product.subcategory ? { product_subcategory: [product.subcategory] } : {}),
    hotel_name: product.name,
    ...(item.dataset.analyticsHotelCode ? { hotel_sku: item.dataset.analyticsHotelCode } : {}),
    ...(product.stars ? { hotel_stars: product.stars } : {}),
    ...(product.brand ? { hotel_brand: product.brand } : {}),
    ...(product.segment ? { hotel_segment: product.segment } : {}),
    ...(product.subsegment ? { hotel_subsegment: product.subsegment } : {}),
    ...(product.onlyAdults ? { hotel_is_only_adults: product.onlyAdults } : {}),
    ...(product.headquarter ? { hotel_headquarter_final: product.headquarter } : {}),
    ...(product.location ? { destination_hotel: product.location } : {}),
    ...(product.continent ? { destination_continent: product.continent } : {}),
    ...(product.country ? { destination_country: product.country } : {}),
    ...(product.countryCode ? { destination_country_code: product.countryCode } : {}),
    ...(product.city ? { destination_city: product.city } : {}),
    ...(product.area ? { destination_area: product.area } : {}),
    ...(product.zone ? { destination_zone: product.zone } : {}),
  });
  return true;
}

function observeHotelLists() {
  if (typeof IntersectionObserver === 'undefined') return;

  const seen = new WeakSet();
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting || seen.has(entry.target)) return;
      seen.add(entry.target);
      observer.unobserve(entry.target);
      fireViewItemList(entry.target);
    });
    // 0.1 instead of a higher ratio so grids taller than the viewport still
    // report their impression.
  }, { threshold: 0.1 });

  const attach = () => {
    document.querySelectorAll(HOTEL_LIST_RENDERED).forEach((el) => {
      if (!seen.has(el)) observer.observe(el);
    });
  };

  attach();

  // Hotel grids can finish rendering after the delayed phase (GraphQL fetches).
  // Debounced re-scan, disconnected after a grace period to avoid observing
  // the whole DOM forever.
  let scanTimer = 0;
  const mutations = new MutationObserver(() => {
    window.clearTimeout(scanTimer);
    scanTimer = window.setTimeout(attach, 500);
  });
  mutations.observe(document.body, { childList: true, subtree: true });
  window.setTimeout(() => {
    mutations.disconnect();
    attach();
  }, 60000);
}

// ---------- newsletter ----------

const NEWSLETTER_ERROR_LABELS = {
  generic: 'generic error',
  email: 'invalid email',
  check: 'terms and conditions not accepted',
};

async function trackNewsletter(action, label, email) {
  trackLink({
    tealium_event: 'newsletter_module',
    event_cat: 'newsletter',
    event_act: action,
    event_lbl: normalize(label),
    event_purpose: 'inspiration',
    event_structure: 'body',
    module_name: 'lead subscription form',
    module_content: 'newsletter',
    user_email: await sha256(email),
  });
}

function initNewsletterTracking() {
  document.addEventListener('ibs:newsletter:success', (event) => {
    trackNewsletter('user suscribed', '', event.detail?.email);
  });
  document.addEventListener('ibs:newsletter:error', (event) => {
    trackNewsletter(
      'error user suscribed',
      NEWSLETTER_ERROR_LABELS[event.detail?.errorType] || NEWSLETTER_ERROR_LABELS.generic,
      event.detail?.email,
    );
  });
}

// ---------- click delegation ----------

const CLICK_HANDLERS = [
  handleLanguageOption,
  handleCurrencyOption,
  handleHeaderClick,
  handleFooterClick,
  handleHotelSelect,
  handleHeroViewHotels,
  handleBlogSplitList,
  handleTopicTagCloud,
  handleCategoryGallery,
  handleHeroEditorialNav,
  handleHighlightGrid,
  handleArticleGrid,
  handleArticleContentCta,
];

function onDocumentClick(event) {
  const target = event.target instanceof Element ? event.target : null;
  if (!target) return;

  const languageTrigger = target.closest('.nav-language-trigger');
  if (languageTrigger) {
    languageContext = languageTrigger.closest('footer') ? 'footer' : 'header';
    return;
  }

  if (handleHeroMultimedia(target)) return;

  const actionable = target.closest('a, button');
  if (!actionable) return;

  CLICK_HANDLERS.some((handler) => handler(actionable));
}

// ---------- bootstrap ----------

let initialized = false;

/**
 * Boots the analytics stack: consent, data layer, utag.js and all the
 * module/event listeners. Called from delayed.js (post-LCP phase).
 */
export default function initAnalytics() {
  if (initialized || isTrackingDisabled()) return;
  initialized = true;

  if (isAnalyticsDebugEnabled()) {
    // eslint-disable-next-line no-console
    console.log('[analytics] debug mode enabled (?analyticsDebug=true)');
  }

  initConsent();
  window.utag_data = { ...buildPageData(), ...(window.utag_data || {}) };
  loadTealium();

  document.addEventListener('click', onDocumentClick, { capture: true });
  observeHotelLists();
  initNewsletterTracking();
}
