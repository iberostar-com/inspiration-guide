import { getMetadata } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';

const DEFAULT_FOOTER_PATH = '/footer';

function normalizeFragmentPath(path) {
  if (!path) return '';

  const { pathname } = new URL(path, window.location);

  if (!pathname.startsWith('/content/')) {
    return pathname;
  }

  const [, , , ...sitePath] = pathname.split('/');
  return sitePath.length ? `/${sitePath.join('/')}` : '/';
}

function resolveFooterPath() {
  const footerMeta = getMetadata('footer');
  return footerMeta ? normalizeFragmentPath(footerMeta) : DEFAULT_FOOTER_PATH;
}

function classifySections(sections) {
  if (!sections.length) {
    return { brand: null, columns: [], meta: null };
  }

  if (sections.length === 1) {
    return { brand: sections[0], columns: [], meta: null };
  }

  return {
    brand: sections[0],
    columns: sections.slice(1, -1),
    meta: sections[sections.length - 1],
  };
}

function decorateFooterSections(footer) {
  const sections = [...footer.children];
  const { brand, columns, meta } = classifySections(sections);

  footer.textContent = '';

  const main = document.createElement('div');
  main.className = 'footer-main';

  if (brand) {
    brand.classList.add('footer-section', 'footer-brand');
    main.append(brand);
  }

  if (columns.length) {
    const links = document.createElement('div');
    links.className = 'footer-links';

    columns.forEach((section, index) => {
      section.classList.add('footer-section', 'footer-column', `footer-column-${index + 1}`);
      links.append(section);
    });

    main.append(links);
  }

  footer.append(main);

  if (meta) {
    meta.classList.add('footer-section', 'footer-meta');
    footer.append(meta);
  }
}

export default async function decorate(block) {
  const footerPath = resolveFooterPath();
  const fragment = await loadFragment(footerPath);

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
