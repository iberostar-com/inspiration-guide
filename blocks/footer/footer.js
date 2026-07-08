import { moveInstrumentation } from '../../scripts/scripts.js';
import { resolveFragmentPath } from '../../scripts/iberostar/fragments.js';
import { loadFragment } from '../fragment/fragment.js';

const DEFAULT_FOOTER_PATH = '/footer';
let accordionCount = 0;

function resolveFooterPath() {
  return resolveFragmentPath('footer', DEFAULT_FOOTER_PATH);
}

async function loadFooterFragment() {
  const primaryPath = resolveFooterPath();
  const fallbackPaths = [primaryPath, DEFAULT_FOOTER_PATH];

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

function decorateColumnAccordion(section) {
  const wrapper = section.querySelector('.default-content-wrapper');
  if (!wrapper) return;

  const titleEl = wrapper.querySelector('p, h2, h3, h4, h5, h6');
  if (!titleEl) return;

  const list = wrapper.querySelector('ul');
  if (!list) return;

  accordionCount += 1;
  const listId = `footer-links-${accordionCount}`;
  list.id = listId;

  const btn = document.createElement('button');
  btn.className = 'footer-accordion-toggle';
  btn.type = 'button';
  btn.setAttribute('aria-expanded', 'false');
  btn.setAttribute('aria-controls', listId);

  const titleSpan = document.createElement('span');
  titleSpan.className = 'footer-column-title';
  titleSpan.textContent = titleEl.textContent;

  const chevron = document.createElement('span');
  chevron.className = 'footer-accordion-chevron';
  chevron.setAttribute('aria-hidden', 'true');

  btn.append(titleSpan, chevron);

  // Transfer UE instrumentation so the rendered button remains editable
  moveInstrumentation(titleEl, btn);
  titleEl.replaceWith(btn);

  btn.addEventListener('click', () => {
    const expanded = btn.getAttribute('aria-expanded') === 'true';
    btn.setAttribute('aria-expanded', expanded ? 'false' : 'true');
  });
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
    links.className = 'footer-columns';

    columns.forEach((section, index) => {
      section.classList.add('footer-section', 'footer-column', `footer-column-${index + 1}`);
      decorateColumnAccordion(section);
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
