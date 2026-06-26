/*
 * Fragment Block
 * Include content on a page as a fragment.
 * https://www.aem.live/developer/block-collection/fragment
 */

// eslint-disable-next-line import/no-cycle
import {
  decorateMain,
} from '../../scripts/scripts.js';

import {
  loadSections,
} from '../../scripts/aem.js';

const INSPIRATION_GUIDE_SEGMENT = '/inspiration-guide';

function normalizeContentPath(path) {
  const { pathname } = new URL(path, window.location);

  if (!pathname.startsWith('/content/')) {
    return pathname;
  }

  const [, , , ...sitePath] = pathname.split('/');
  return sitePath.length ? `/${sitePath.join('/')}` : '/';
}

function getInspirationGuideRoot() {
  const normalizedPath = normalizeContentPath(window.location.pathname).replace(/\/$/, '');
  const segmentIndex = normalizedPath.lastIndexOf(INSPIRATION_GUIDE_SEGMENT);

  if (segmentIndex < 0) {
    return '';
  }

  return normalizedPath.slice(0, segmentIndex + INSPIRATION_GUIDE_SEGMENT.length);
}

function normalizeFragmentRequestPath(path) {
  const normalizedPath = normalizeContentPath(path)
    .replace(/(\.plain)?\.html$/, '')
    .replace(/\/$/, '');
  const inspirationGuideRoot = getInspirationGuideRoot();

  if (!inspirationGuideRoot) {
    return normalizedPath;
  }

  const fragmentMatch = normalizedPath.match(/^\/[a-z]{2}-[a-z]{2}\/(nav|footer)$/i);
  if (fragmentMatch) {
    const [, fragmentName] = fragmentMatch;
    return `${inspirationGuideRoot}/${fragmentName.toLowerCase()}`;
  }

  return normalizedPath;
}

/**
 * Loads a fragment.
 * @param {string} path The path to the fragment
 * @returns {HTMLElement} The root element of the fragment
 */
export async function loadFragment(path) {
  if (path && path.startsWith('/') && !path.startsWith('//')) {
    // eslint-disable-next-line no-param-reassign
    path = normalizeFragmentRequestPath(path);
    const resp = await fetch(`${path}.plain.html`);
    if (resp.ok) {
      const html = await resp.text();
      const parsed = new DOMParser().parseFromString(html, 'text/html');
      const source = parsed.querySelector('main') || parsed.body;
      const main = document.createElement('main');

      if (source) {
        while (source.firstElementChild) {
          main.append(source.firstElementChild);
        }
      }

      // reset base path for media to fragment base
      const resetAttributeBase = (tag, attr) => {
        main.querySelectorAll(`${tag}[${attr}^="./media_"]`).forEach((elem) => {
          elem[attr] = new URL(elem.getAttribute(attr), new URL(path, window.location)).href;
        });
      };
      resetAttributeBase('img', 'src');
      resetAttributeBase('source', 'srcset');

      decorateMain(main);
      await loadSections(main);
      return main;
    }
  }
  return null;
}

export default async function decorate(block) {
  const link = block.querySelector('a');
  const path = link ? link.getAttribute('href') : block.textContent.trim();
  const fragment = await loadFragment(path);
  if (fragment) block.replaceChildren(...fragment.childNodes);
}
