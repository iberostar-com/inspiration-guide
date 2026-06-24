import { getMetadata } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';

const DEFAULT_NAV_PATH = '/nav';
const DESKTOP_MEDIA = window.matchMedia('(width >= 900px)');

function normalizePath(path) {
  if (!path) return '';

  try {
    const normalized = new URL(path, window.location).pathname.replace(/\/$/, '');
    return normalized || '/';
  } catch (error) {
    return '';
  }
}

function normalizeFragmentPath(path) {
  if (!path) return '';

  const { pathname } = new URL(path, window.location);

  if (!pathname.startsWith('/content/')) {
    return pathname;
  }

  const [, , , ...sitePath] = pathname.split('/');
  return sitePath.length ? `/${sitePath.join('/')}` : '/';
}

function resolveFragmentPath(metaName, fallbackPath) {
  const metaValue = getMetadata(metaName);
  return metaValue ? normalizeFragmentPath(metaValue) : fallbackPath;
}

function setSectionExpanded(section, expanded) {
  section.setAttribute('aria-expanded', expanded ? 'true' : 'false');
  section.querySelector(':scope > .nav-section-header .nav-section-toggle')
    ?.setAttribute('aria-expanded', expanded ? 'true' : 'false');
}

function closeAllSections(navSections, exceptSection) {
  navSections.querySelectorAll('.nav-section-has-children').forEach((section) => {
    if (section !== exceptSection) {
      setSectionExpanded(section, false);
    }
  });
}

function toggleSection(section, navSections, forceExpanded) {
  const expanded = forceExpanded ?? section.getAttribute('aria-expanded') !== 'true';

  if (expanded) {
    closeAllSections(navSections, section);
  }

  setSectionExpanded(section, expanded);
}

function markViewAllItem(submenu) {
  const firstItem = submenu.querySelector(':scope > li:first-child');
  const label = firstItem?.querySelector('a')?.textContent?.trim()?.toLowerCase() || '';

  if (label.includes('ver todos')) {
    firstItem.classList.add('nav-section-view-all');
  }
}

function buildSectionHeader(item, navSections) {
  const link = item.querySelector(':scope > a');
  const submenu = item.querySelector(':scope > ul');

  if (!link || !submenu) {
    return;
  }

  item.classList.add('nav-section-has-children');
  setSectionExpanded(item, false);
  markViewAllItem(submenu);

  const header = document.createElement('div');
  header.className = 'nav-section-header';

  const toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.className = 'nav-section-toggle';
  toggle.setAttribute('aria-expanded', 'false');
  toggle.setAttribute('aria-label', `Toggle ${link.textContent.trim()} submenu`);

  link.insertAdjacentElement('beforebegin', header);
  header.append(link, toggle);

  toggle.addEventListener('click', (event) => {
    event.preventDefault();
    event.stopPropagation();
    toggleSection(item, navSections);
  });

  header.addEventListener('mouseenter', () => {
    if (DESKTOP_MEDIA.matches) {
      toggleSection(item, navSections, true);
    }
  });

  item.addEventListener('mouseleave', () => {
    if (DESKTOP_MEDIA.matches) {
      toggleSection(item, navSections, false);
    }
  });
}

function decorateNavSections(navSections) {
  const items = navSections.querySelectorAll(':scope .default-content-wrapper > ul > li');
  items.forEach((item) => buildSectionHeader(item, navSections));
}

function markActiveNavigation(nav) {
  const currentPath = normalizePath(window.location.pathname);

  nav.querySelectorAll('.nav-sections a[href]').forEach((link) => {
    const linkPath = normalizePath(link.getAttribute('href'));
    if (!linkPath) return;

    const isExactMatch = currentPath === linkPath;
    const isChildMatch = linkPath !== '/' && currentPath.startsWith(`${linkPath}/`);

    if (isExactMatch || isChildMatch) {
      link.classList.add('is-active');
      link.closest('li')?.classList.add('is-active');
      link.closest('.nav-section-has-children')?.classList.add('is-trail');
    }
  });
}

function setMenuExpanded(nav, expanded) {
  const button = nav.querySelector('.nav-hamburger button');
  const navSections = nav.querySelector('.nav-sections');

  nav.setAttribute('aria-expanded', expanded ? 'true' : 'false');
  document.body.style.overflowY = expanded && !DESKTOP_MEDIA.matches ? 'hidden' : '';

  if (button) {
    button.setAttribute('aria-label', expanded ? 'Close navigation' : 'Open navigation');
  }

  if (!expanded && navSections) {
    closeAllSections(navSections);
  }
}

function handleEscape(event) {
  if (event.code !== 'Escape') return;

  const nav = document.getElementById('nav');
  const navSections = nav?.querySelector('.nav-sections');

  if (!nav || !navSections) return;

  if (!DESKTOP_MEDIA.matches && nav.getAttribute('aria-expanded') === 'true') {
    setMenuExpanded(nav, false);
    nav.querySelector('.nav-hamburger button')?.focus();
    return;
  }

  closeAllSections(navSections);
}

function handleFocusOut(event) {
  const nav = event.currentTarget;
  const navSections = nav.querySelector('.nav-sections');

  if (navSections && !nav.contains(event.relatedTarget)) {
    closeAllSections(navSections);
  }
}

function buildNavTools(nav) {
  const tools = [...nav.querySelectorAll('.nav-hotels, .nav-language, .nav-search')];

  if (!tools.length) {
    return;
  }

  const navTools = document.createElement('div');
  navTools.className = 'nav-tools';
  tools.forEach((tool) => navTools.append(tool));
  nav.append(navTools);
}

function decorateBrand(nav) {
  const navBrand = nav.querySelector('.nav-brand');
  const brandLink = navBrand?.querySelector('a');

  if (!brandLink) return;

  brandLink.className = '';
  brandLink.closest('.button-wrapper')?.classList.remove('button-wrapper');
}

function groupNavChildren(nav) {
  ['brand', 'sections'].forEach((className, index) => {
    nav.children[index]?.classList.add(`nav-${className}`);
  });
}

function bindNavEvents(nav) {
  const hamburger = nav.querySelector('.nav-hamburger');

  hamburger?.addEventListener('click', () => {
    const expanded = nav.getAttribute('aria-expanded') === 'true';
    setMenuExpanded(nav, !expanded);
  });

  nav.addEventListener('focusout', handleFocusOut);
  window.addEventListener('keydown', handleEscape);
  DESKTOP_MEDIA.addEventListener('change', () => setMenuExpanded(nav, false));
}

function createHamburger() {
  const hamburger = document.createElement('div');
  hamburger.className = 'nav-hamburger';
  hamburger.innerHTML = `<button type="button" aria-controls="nav" aria-label="Open navigation">
    <span class="nav-hamburger-icon"></span>
  </button>`;
  return hamburger;
}

export default async function decorate(block) {
  const navPath = resolveFragmentPath('nav', DEFAULT_NAV_PATH);
  const fragment = await loadFragment(navPath);

  if (!fragment) return;

  block.textContent = '';

  const nav = document.createElement('nav');
  nav.id = 'nav';
  nav.setAttribute('aria-expanded', 'false');

  while (fragment.firstElementChild) {
    nav.append(fragment.firstElementChild);
  }

  groupNavChildren(nav);
  decorateBrand(nav);
  buildNavTools(nav);
  nav.prepend(createHamburger());

  const navSections = nav.querySelector('.nav-sections');
  if (navSections) {
    decorateNavSections(navSections);
  }

  markActiveNavigation(nav);
  bindNavEvents(nav);

  const navWrapper = document.createElement('div');
  navWrapper.className = 'nav-wrapper';
  navWrapper.append(nav);
  block.append(navWrapper);
}
