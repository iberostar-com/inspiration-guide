import { resolveFragmentPath } from '../../scripts/iberostar/fragments.js';
import { loadFragment } from '../fragment/fragment.js';

const DEFAULT_FOOTER_PATH = '/footer';

function isLocalDev() {
  return window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
}

function getLocalFooterMockPath() {
  const [, locale] = window.location.pathname.match(/^\/([a-z]{2}-[a-z]{2})(?:\/|$)/i) || [];
  if (locale) {
    return `/drafts/${locale.toLowerCase()}/inspiration-guide/footer`;
  }
  return '/drafts/inspiration-guide/footer';
}

function resolveFooterPath() {
  return resolveFragmentPath('footer', DEFAULT_FOOTER_PATH);
}

async function loadFooterFragment() {
  const primaryPath = resolveFooterPath();
  const fallbackPaths = isLocalDev()
    ? [getLocalFooterMockPath(), '/drafts/inspiration-guide/footer', primaryPath, DEFAULT_FOOTER_PATH]
    : [primaryPath, DEFAULT_FOOTER_PATH];

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

function decorateFooterSections(footer) {
  const sections = [...footer.children];

  sections.forEach((section) => {
    section.classList.add('footer-section', 'footer-main', 'footer-brand');
  });
}

export default async function decorate(block) {
  const fragment = await loadFooterFragment();

  if (!fragment) return;

  block.textContent = '';

  const footer = document.createElement('div');
  footer.className = 'footer';

  while (fragment.firstElementChild) {
    footer.append(fragment.firstElementChild);
  }

  decorateFooterSections(footer);
  block.append(footer);
}
