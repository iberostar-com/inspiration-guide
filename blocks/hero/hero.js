import { resolveFinalAlt } from '../../scripts/iberostar/image-alt.js';

/**
 * Decorate hero block with semantic HTML
 * Supports 4 variants: default, tag, article, blog
 * @param {Element} block The hero block element
 */

/**
 * Default hero: image + alt + text
 * Structure from AEM: cells[0]=image, cells[1]=alt, cells[2]=text
 */
function decorateDefaultHero(block) {
  const cells = Array.from(block.querySelectorAll(':scope > div > div'));

  if (cells.length === 0) return;

  // Extract image and alt
  const img = cells[0]?.querySelector('img');
  let textCell = cells[2];
  if (img && cells[1]) {
    const autoAltCell = ['image_autoalt', 'imageAutoAlt'].includes(cells[2]?.dataset?.aueProp) ? cells[2] : null;
    img.alt = resolveFinalAlt(cells[1].textContent?.trim() || '', autoAltCell?.textContent?.trim() || img.alt || '');
    cells[1].remove();
    autoAltCell?.remove();
    textCell = autoAltCell ? cells[3] : cells[2];
  }

  // Ensure text is wrapped in semantic heading
  if (textCell) {
    let h1 = textCell.querySelector('h1');
    if (!h1) {
      h1 = document.createElement('h1');
      h1.textContent = textCell.textContent;
      textCell.replaceChildren(h1);
    }
  }

  // Remove empty divs
  Array.from(block.querySelectorAll('div:empty')).forEach((el) => {
    el.remove();
  });

  block.classList.add('hero-default');
}

/**
 * Tag hero: H1 title only, centered, no image
 * Structure from AEM: cells[0]=title
 */
function decorateTagHero(block) {
  const cells = Array.from(block.querySelectorAll(':scope > div > div'));

  if (cells.length === 0) return;

  const titleCell = cells[0];
  let h1 = titleCell?.querySelector('h1');
  if (!h1) {
    h1 = document.createElement('h1');
    h1.textContent = titleCell?.textContent || 'Tag';
  }

  // Remove image if any
  block.querySelector('img')?.remove();

  // Keep H1 only
  const wrapper = document.createElement('div');
  wrapper.className = 'hero hero-tag';
  wrapper.appendChild(h1);
  block.replaceChildren(wrapper);
}

/**
 * Article hero: image + metadata + title + subtitle
 * Structure from AEM: cells[0]=image, cells[1]=metadata, cells[2]=title, cells[3]=subtitle
 */
function decorateArticleHero(block) {
  const cells = Array.from(block.querySelectorAll(':scope > div > div'));

  if (cells.length === 0) return;

  const wrapper = document.createElement('div');
  wrapper.className = 'hero hero-article';

  // Image (featured)
  const img = cells[0]?.querySelector('img');
  if (img) {
    const imgWrapper = document.createElement('div');
    imgWrapper.className = 'hero-image';
    imgWrapper.appendChild(img);
    wrapper.appendChild(imgWrapper);
  }

  // Metadata
  if (cells[1] && cells[1].textContent.trim()) {
    const metadata = document.createElement('div');
    metadata.className = 'hero-metadata';
    metadata.innerHTML = cells[1].innerHTML;
    wrapper.appendChild(metadata);
  }

  // Title as H1
  const h1 = document.createElement('h1');
  h1.textContent = cells[2]?.textContent || 'Article';
  h1.className = 'hero-title';
  wrapper.appendChild(h1);

  // Subtitle
  if (cells[3] && cells[3].textContent.trim()) {
    const subtitle = document.createElement('p');
    subtitle.className = 'hero-subtitle';
    subtitle.innerHTML = cells[3].innerHTML;
    wrapper.appendChild(subtitle);
  }

  block.replaceChildren(wrapper);
}

/**
 * Blog hero: image + title + subtitle + nav links
 * Structure from AEM: cells[0]=image, cells[1]=title, cells[2]=subtitle, cells[3+]=nav
 */
function decorateBlogHero(block) {
  const cells = Array.from(block.querySelectorAll(':scope > div > div'));

  if (cells.length === 0) return;

  const wrapper = document.createElement('div');
  wrapper.className = 'hero hero-blog';

  // Image
  const img = cells[0]?.querySelector('img');
  if (img) {
    const imgWrapper = document.createElement('div');
    imgWrapper.className = 'hero-image';
    imgWrapper.appendChild(img);
    wrapper.appendChild(imgWrapper);
  }

  // Title
  const h1 = document.createElement('h1');
  h1.textContent = cells[1]?.textContent || 'Category';
  h1.className = 'hero-title';
  wrapper.appendChild(h1);

  // Subtitle
  if (cells[2] && cells[2].textContent.trim()) {
    const subtitle = document.createElement('p');
    subtitle.className = 'hero-subtitle';
    subtitle.textContent = cells[2].textContent;
    wrapper.appendChild(subtitle);
  }

  // Nav links (if present)
  if (cells[3]) {
    const navList = cells[3].querySelector('ul');
    if (navList) {
      const nav = document.createElement('nav');
      nav.className = 'hero-nav';
      nav.appendChild(navList);
      wrapper.appendChild(nav);
    }
  }

  block.replaceChildren(wrapper);
}

export default async function decorate(block) {
  const variant = block.getAttribute('data-variant') || 'default';

  switch (variant) {
    case 'tag':
      decorateTagHero(block);
      break;
    case 'article':
      decorateArticleHero(block);
      break;
    case 'blog':
      decorateBlogHero(block);
      break;
    default:
      decorateDefaultHero(block);
  }
}
