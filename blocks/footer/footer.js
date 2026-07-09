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
    section.classList.add('footer-section');

    const hasBrand = section.querySelector('.header-brand-wrapper, .header-brand');
    const hasLinks = section.querySelector('.footer-links-wrapper, .footer-links');
    // The language selector arrives as a fragment, so its wrapper is nested a few
    // levels deep (default-content-wrapper > fragment > nav-language-container).
    // Match it (and legal) anywhere in the section, not just as a direct child.
    const navLanguageWrapper = section.querySelector('.nav-language-wrapper');
    const footerLegalWrapper = section.querySelector('.footer-legal-wrapper');
    const hasMeta = navLanguageWrapper || footerLegalWrapper || section.querySelector('.nav-language, .footer-legal');

    if (navLanguageWrapper || footerLegalWrapper) {
      let metaRow = section.querySelector(':scope > .footer-meta-row');

      if (!metaRow) {
        metaRow = document.createElement('div');
        metaRow.className = 'footer-meta-row';
        section.append(metaRow);
      }

      // Language first keeps the mobile column stack (language above legal);
      // on desktop CSS grid places legal left and language right regardless of order.
      if (navLanguageWrapper) {
        metaRow.append(navLanguageWrapper);
      }

      if (footerLegalWrapper) {
        metaRow.append(footerLegalWrapper);
      }

      // Remove the now-empty fragment/default-content wrappers left behind after
      // pulling the language selector out, so they don't add stray vertical space.
      section.querySelectorAll(':scope > .default-content-wrapper').forEach((wrapper) => {
        if (!wrapper.textContent.trim() && !wrapper.querySelector('img, picture, a, button, .block')) {
          wrapper.remove();
        }
      });
    }

    if (hasBrand) {
      section.classList.add('footer-brand');
    }

    if (hasLinks) {
      section.classList.add('footer-main');
    }

    if (hasMeta) {
      section.classList.add('footer-meta');
    }

    if (hasLinks && hasMeta) {
      section.classList.add('footer-main-combined');
    }
  });
}

async function hydrateFooterFragments(footer) {
  const fragmentBlocks = [...footer.querySelectorAll('.fragment')];

  for (let i = 0; i < fragmentBlocks.length; i += 1) {
    const fragmentBlock = fragmentBlocks[i];
    if (fragmentBlock.getAttribute('data-block-status') !== 'loaded') {
      const link = fragmentBlock.querySelector('a[href]');
      const path = link?.getAttribute('href');

      if (path) {
        // eslint-disable-next-line no-await-in-loop
        const fragment = await loadFragment(path);

        if (fragment) {
          fragmentBlock.replaceChildren(...fragment.childNodes);
        }
      }
    }
  }
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

  await hydrateFooterFragments(footer);
  decorateFooterSections(footer);
  block.append(footer);
}
