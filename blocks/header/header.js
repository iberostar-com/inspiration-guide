import { resolveFragmentPath } from '../../scripts/iberostar/fragments.js';
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

function setItemExpanded(item, expanded) {
  item.setAttribute('aria-expanded', expanded ? 'true' : 'false');
  item.querySelector(':scope > .nav-item-content > .nav-item-toggle')
    ?.setAttribute('aria-expanded', expanded ? 'true' : 'false');
}

function closeAllSections(navSections, exceptItem) {
  navSections.querySelectorAll('.nav-item-has-children').forEach((item) => {
    if (item !== exceptItem) {
      setItemExpanded(item, false);
    }
  });
}

function toggleItem(item, navSections, forceExpanded) {
  const expanded = forceExpanded ?? item.getAttribute('aria-expanded') !== 'true';

  if (expanded) {
    closeAllSections(navSections, item);
  }

  setItemExpanded(item, expanded);
}

function wireNavItem(item, navSections) {
  const content = item.querySelector(':scope > .nav-item-content');
  const toggle = content?.querySelector(':scope > .nav-item-toggle');

  toggle?.addEventListener('click', (event) => {
    event.preventDefault();
    event.stopPropagation();
    toggleItem(item, navSections);
  });

  content?.addEventListener('mouseenter', () => {
    if (DESKTOP_MEDIA.matches) {
      toggleItem(item, navSections, true);
    }
  });

  item.addEventListener('mouseleave', () => {
    if (DESKTOP_MEDIA.matches) {
      toggleItem(item, navSections, false);
    }
  });
}

function decorateNavSections(navSections) {
  navSections.querySelectorAll('.nav-item-has-children')
    .forEach((item) => wireNavItem(item, navSections));
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
      link.closest('.nav-item-dropdown-item')?.classList.add('is-active');
      link.closest('.nav-item-has-children')?.classList.add('is-trail');
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

async function loadNavFragment() {
  const primaryPath = resolveFragmentPath('nav', DEFAULT_NAV_PATH);
  const fallbackPaths = [primaryPath, DEFAULT_NAV_PATH];

  for (let i = 0; i < fallbackPaths.length; i += 1) {
    const path = fallbackPaths[i];
    // eslint-disable-next-line no-await-in-loop
    const fragment = await loadFragment(path);

    if (fragment) {
      return fragment;
    }
  }

  return null;
}

export default async function decorate(block) {
  const fragment = await loadNavFragment();

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
