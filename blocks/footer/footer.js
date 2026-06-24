import { getMetadata } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';

const DEFAULT_FOOTER_PATH = '/inspiration-guide/footer';

function resolveFooterPath() {
  const footerMeta = getMetadata('footer');
  return footerMeta ? new URL(footerMeta, window.location).pathname : DEFAULT_FOOTER_PATH;
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
