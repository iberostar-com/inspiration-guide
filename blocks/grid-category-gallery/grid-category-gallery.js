import { createResponsiveImage } from '../../scripts/iberostar/media.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

function createCard(row) {
  const cells = [...row.children];
  const picture = cells[0]?.querySelector('picture');
  const title = cells[1]?.textContent?.trim() || '';
  const subtitle = cells[2]?.textContent?.trim() || '';
  const link = cells[3]?.textContent?.trim() || '#';

  const li = document.createElement('li');
  li.className = 'grid-category-gallery-item';
  moveInstrumentation(row, li);

  // Entire card is a link
  const cardLink = document.createElement('a');
  cardLink.className = 'grid-category-gallery-card';
  cardLink.href = link;
  cardLink.setAttribute('aria-label', title || subtitle);

  if (picture) {
    const img = picture.querySelector('img');
    const media = document.createElement('div');
    media.className = 'grid-category-gallery-media';
    media.append(createResponsiveImage(
      img?.src,
      img?.alt || title,
      { preset: 'category-card' },
    ));
    cardLink.append(media);
  }

  const body = document.createElement('div');
  body.className = 'grid-category-gallery-body';

  if (subtitle) {
    const subtitleEl = document.createElement('p');
    subtitleEl.className = 'grid-category-gallery-subtitle';
    subtitleEl.textContent = subtitle;
    body.append(subtitleEl);
  }

  if (title) {
    const headingEl = document.createElement('h3');
    headingEl.className = 'grid-category-gallery-title';
    headingEl.textContent = title;
    body.append(headingEl);
  }

  cardLink.append(body);
  li.append(cardLink);
  return li;
}

function buildCarouselControls(list, items) {
  const controls = document.createElement('div');
  controls.className = 'grid-category-gallery-controls';

  const prev = document.createElement('button');
  prev.type = 'button';
  prev.className = 'grid-category-gallery-prev';
  prev.setAttribute('aria-label', 'Previous');
  prev.innerHTML = '<span aria-hidden="true"></span>';

  const next = document.createElement('button');
  next.type = 'button';
  next.className = 'grid-category-gallery-next';
  next.setAttribute('aria-label', 'Next');
  next.innerHTML = '<span aria-hidden="true"></span>';

  const updateButtons = () => {
    const { scrollLeft, scrollWidth, clientWidth } = list;
    prev.disabled = scrollLeft <= 0;
    next.disabled = scrollLeft + clientWidth >= scrollWidth - 1;
  };

  prev.addEventListener('click', () => {
    const itemWidth = items[0]?.offsetWidth || 0;
    list.scrollBy({ left: -(itemWidth + 16), behavior: 'smooth' });
  });

  next.addEventListener('click', () => {
    const itemWidth = items[0]?.offsetWidth || 0;
    list.scrollBy({ left: itemWidth + 16, behavior: 'smooth' });
  });

  list.addEventListener('scroll', updateButtons, { passive: true });
  updateButtons();

  controls.append(prev, next);
  return controls;
}

export default function decorate(block) {
  const title = block.getAttribute('data-title') || '';
  const subtitle = block.getAttribute('data-subtitle') || '';
  const ctaText = block.getAttribute('data-cta-text') || '';
  const ctaUrl = block.getAttribute('data-cta') || '';

  const rows = [...block.children];

  const wrapper = document.createElement('div');
  wrapper.className = 'grid-category-gallery';

  if (title || subtitle || ctaUrl) {
    const header = document.createElement('div');
    header.className = 'grid-category-gallery-header';

    const headerText = document.createElement('div');
    headerText.className = 'grid-category-gallery-header-text';

    if (title) {
      const titleEl = document.createElement('h2');
      titleEl.className = 'grid-category-gallery-heading';
      titleEl.textContent = title;
      headerText.append(titleEl);
    }

    if (subtitle) {
      const subtitleEl = document.createElement('p');
      subtitleEl.className = 'grid-category-gallery-subheading';
      subtitleEl.textContent = subtitle;
      headerText.append(subtitleEl);
    }

    header.append(headerText);

    if (ctaUrl) {
      const cta = document.createElement('a');
      cta.className = 'grid-category-gallery-cta';
      cta.href = ctaUrl;
      cta.textContent = ctaText || ctaUrl;
      header.append(cta);
    }

    wrapper.append(header);
  }

  const list = document.createElement('ul');
  list.className = 'grid-category-gallery-list';

  const items = rows.map((row) => {
    const li = createCard(row);
    list.append(li);
    return li;
  });

  wrapper.append(list);

  const controls = buildCarouselControls(list, items);
  wrapper.append(controls);

  block.replaceChildren(wrapper);
}
