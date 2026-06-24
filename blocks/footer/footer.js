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

function decorateFooterSections(footer) {
  const sections = [...footer.children];
  const sectionNames = ['footer-brand', 'footer-links', 'footer-meta'];

  sections.forEach((section, index) => {
    section.classList.add('footer-section');
    section.classList.add(sectionNames[index] || `footer-section-${index + 1}`);
  });
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
