import { createOptimizedPicture } from '../../scripts/aem.js';
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

  const card = document.createElement('div');
  card.className = 'grid-category-gallery-card';

  if (picture) {
    const media = document.createElement('div');
    media.className = 'grid-category-gallery-media';
    media.append(createOptimizedPicture(picture.querySelector('img')?.src, title, false, [{ width: '600' }]));
    card.append(media);
  }

  const body = document.createElement('div');
  body.className = 'grid-category-gallery-body';

  if (subtitle) {
    const subtitleLink = document.createElement('a');
    subtitleLink.className = 'grid-category-gallery-subtitle';
    subtitleLink.href = link;
    const p = document.createElement('p');
    p.textContent = subtitle;
    subtitleLink.append(p);
    body.append(subtitleLink);
  }

  if (title) {
    const titleLink = document.createElement('a');
    titleLink.className = 'grid-category-gallery-title';
    titleLink.href = link;
    const h3 = document.createElement('h3');
    h3.textContent = title;
    titleLink.append(h3);
    body.append(titleLink);
  }

  card.append(body);
  li.append(card);
  return li;
}

export default function decorate(block) {
  const title = block.getAttribute('data-title') || '';
  const subtitle = block.getAttribute('data-subtitle') || '';
  const ctaText = block.getAttribute('data-cta-text') || '';
  const ctaUrl = block.getAttribute('data-cta') || '';
  const maxItems = Number.parseInt(block.getAttribute('data-max-items') || '4', 10);

  const rows = [...block.children].slice(0, maxItems);

  const wrapper = document.createElement('div');
  wrapper.className = 'grid-category-gallery';

  if (title || subtitle || ctaUrl) {
    const header = document.createElement('div');
    header.className = 'grid-category-gallery-header';

    const headerText = document.createElement('div');
    if (title) {
      const h2 = document.createElement('h2');
      h2.textContent = title;
      headerText.append(h2);
    }
    if (subtitle) {
      const p = document.createElement('p');
      p.textContent = subtitle;
      headerText.append(p);
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
  rows.forEach((row) => list.append(createCard(row)));
  wrapper.append(list);

  block.replaceChildren(wrapper);
}
