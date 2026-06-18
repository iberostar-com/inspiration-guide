import { createOptimizedPicture, decorateIcons } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

function createCard(row) {
  const cells = [...row.children];
  const icon = cells[0]?.textContent?.trim() || '';
  const picture = cells[1]?.querySelector('picture');
  const title = cells[2]?.textContent?.trim() || '';
  const link = cells[3]?.textContent?.trim() || '';

  const li = document.createElement('li');
  li.className = 'carousel-category-gallery-item';
  moveInstrumentation(row, li);

  const card = document.createElement(link ? 'a' : 'div');
  card.className = 'carousel-category-gallery-card';
  if (link) card.href = link;

  if (icon) {
    const iconSpan = document.createElement('span');
    iconSpan.className = `icon icon-${icon}`;
    card.append(iconSpan);
  }

  if (picture) {
    const media = document.createElement('div');
    media.className = 'carousel-category-gallery-media';
    const optimizedPic = createOptimizedPicture(
      picture.querySelector('img')?.src,
      title,
      false,
      [{ width: '300' }],
    );
    media.append(optimizedPic);
    card.append(media);
  }

  if (title) {
    const h3 = document.createElement('h3');
    h3.textContent = title;
    card.append(h3);
  }

  li.append(card);
  return li;
}

function addNavButtons(wrapper, list) {
  const nav = document.createElement('div');
  nav.className = 'carousel-category-gallery-nav';

  const prev = document.createElement('button');
  prev.type = 'button';
  prev.className = 'carousel-category-gallery-prev';
  prev.setAttribute('aria-label', 'Previous');

  const next = document.createElement('button');
  next.type = 'button';
  next.className = 'carousel-category-gallery-next';
  next.setAttribute('aria-label', 'Next');

  const scrollByCard = (direction) => {
    const card = list.querySelector('.carousel-category-gallery-item');
    const amount = (card?.getBoundingClientRect().width || 300) + 16;
    list.scrollBy({ left: amount * direction, behavior: 'smooth' });
  };

  prev.addEventListener('click', () => scrollByCard(-1));
  next.addEventListener('click', () => scrollByCard(1));

  nav.append(prev, next);
  wrapper.append(nav);
}

export default function decorate(block) {
  const title = block.getAttribute('data-title') || '';
  const subtitle = block.getAttribute('data-subtitle') || '';
  const maxItems = Number.parseInt(block.getAttribute('data-max-items') || '9', 10);

  const rows = [...block.children].slice(0, maxItems);

  const wrapper = document.createElement('div');
  wrapper.className = 'carousel-category-gallery';

  if (title || subtitle) {
    const header = document.createElement('div');
    header.className = 'carousel-category-gallery-header';
    if (title) {
      const h2 = document.createElement('h2');
      h2.textContent = title;
      header.append(h2);
    }
    if (subtitle) {
      const p = document.createElement('p');
      p.textContent = subtitle;
      header.append(p);
    }
    wrapper.append(header);
  }

  const list = document.createElement('ul');
  list.className = 'carousel-category-gallery-list';
  rows.forEach((row) => list.append(createCard(row)));
  wrapper.append(list);

  if (rows.length > 1) {
    addNavButtons(wrapper, list);
  }

  block.replaceChildren(wrapper);
  decorateIcons(wrapper);
}
