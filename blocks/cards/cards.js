import { createResponsiveImage } from '../../scripts/iberostar/media.js';
import { moveInstrumentation } from '../../scripts/scripts.js';
import { getArticles } from '../../scripts/inspiration-data.js';

/**
 * Optimize images
 */
function optimizeImage(container) {
  container.querySelectorAll('picture > img').forEach((img) => {
    const optimizedImage = createResponsiveImage(img.src, img.alt, { preset: 'cards-highlight' });
    moveInstrumentation(img, optimizedImage.querySelector?.('img') || optimizedImage);
    img.closest('picture').replaceWith(optimizedImage);
  });
}

/**
 * Default highlight variant - image + text grid
 */
function decorateHighlight(block) {
  const authoredRows = [...block.children];
  if (authoredRows.length === 0) {
    return;
  }

  block.classList.add('cards-highlight');
  const ul = document.createElement('ul');

  authoredRows.forEach((row) => {
    const li = document.createElement('li');
    const card = document.createElement('div');
    card.className = 'cards-card';
    moveInstrumentation(row, li);

    // Process children (image + text + optional link)
    const children = [...row.children];
    let imageDiv = null;
    let textDiv = null;
    let linkDiv = null;

    children.forEach((div, idx) => {
      const picture = div.querySelector('picture');
      if (picture && !imageDiv) {
        imageDiv = div;
        imageDiv.className = 'cards-card-image';
      } else if (idx < children.length - 1 && !textDiv) {
        textDiv = div;
        textDiv.className = 'cards-card-body';
      } else {
        linkDiv = div;
      }
    });

    if (imageDiv) {
      card.appendChild(imageDiv);
      optimizeImage(imageDiv);
    }
    if (textDiv) {
      card.appendChild(textDiv);
    }
    if (linkDiv) {
      const link = linkDiv.textContent?.trim();
      if (link) {
        const a = document.createElement('a');
        a.href = link;
        a.className = 'cards-card-link';
        a.textContent = 'Read more';
        card.appendChild(a);
      }
    }

    li.appendChild(card);
    ul.append(li);
  });

  block.replaceChildren(ul);
}

function renderHighlightFromMock(block, articles) {
  block.classList.add('cards-highlight');
  const ul = document.createElement('ul');

  articles.forEach((article) => {
    const li = document.createElement('li');
    const card = document.createElement('article');
    card.className = 'cards-card';

    const imageDiv = document.createElement('div');
    imageDiv.className = 'cards-card-image';
    imageDiv.append(
      createResponsiveImage(
        article.image,
        article.title,
        { preset: 'cards-highlight' },
      ),
    );

    const bodyDiv = document.createElement('div');
    bodyDiv.className = 'cards-card-body';

    const title = document.createElement('h3');
    title.textContent = article.title;

    const summary = document.createElement('p');
    summary.textContent = article.summary;

    const link = document.createElement('a');
    link.className = 'cards-card-link';
    link.href = `/article/${article.id}`;
    link.textContent = 'Read more';

    bodyDiv.append(title, summary, link);
    card.append(imageDiv, bodyDiv);
    li.append(card);
    ul.append(li);
  });

  block.replaceChildren(ul);
}

/**
 * Overlay variant - image with text overlay on hover
 */
function decorateOverlay(block) {
  block.classList.add('cards-overlay');
  const ul = document.createElement('ul');

  [...block.children].forEach((row) => {
    const li = document.createElement('li');
    const card = document.createElement('div');
    card.className = 'cards-card overlay';
    moveInstrumentation(row, li);

    // Extract image and text
    const picture = row.querySelector('picture');
    const textContent = row.textContent?.split('\n').filter((t) => !t.includes('png') && !t.includes('jpg'))[0] || '';

    if (picture) {
      const picWrapper = document.createElement('div');
      picWrapper.className = 'cards-card-image';
      picWrapper.appendChild(picture.cloneNode(true));
      card.appendChild(picWrapper);
      optimizeImage(picWrapper);

      // Overlay text
      if (textContent) {
        const overlay = document.createElement('div');
        overlay.className = 'cards-overlay-text';
        overlay.innerHTML = textContent;
        card.appendChild(overlay);
      }
    }

    li.appendChild(card);
    ul.append(li);
  });

  block.replaceChildren(ul);
}

/**
 * Banner variant - horizontal layout (image left, text right)
 */
function decorateBanner(block) {
  block.classList.add('cards-banner');
  const ul = document.createElement('ul');

  [...block.children].forEach((row) => {
    const li = document.createElement('li');
    const card = document.createElement('div');
    card.className = 'cards-card banner';
    moveInstrumentation(row, li);

    const imageDiv = document.createElement('div');
    imageDiv.className = 'cards-card-image';

    const bodyDiv = document.createElement('div');
    bodyDiv.className = 'cards-card-body';

    // Separate image from text
    [...row.children].forEach((div) => {
      const picture = div.querySelector('picture');
      if (picture) {
        imageDiv.appendChild(picture.cloneNode(true));
        optimizeImage(imageDiv);
      } else if (div.textContent?.trim()) {
        bodyDiv.innerHTML += div.innerHTML;
      }
    });

    // Grid layout: image left, body right
    card.appendChild(imageDiv);
    card.appendChild(bodyDiv);

    li.appendChild(card);
    ul.append(li);
  });

  block.replaceChildren(ul);
}

export default async function decorate(block) {
  const variant = block.getAttribute('data-variant') || 'highlight';
  const rows = [...block.children];

  if (variant === 'highlight' && rows.length === 0) {
    const mockArticles = (await getArticles()).slice(0, 6);
    renderHighlightFromMock(block, mockArticles);
    return;
  }

  switch (variant) {
    case 'overlay':
      decorateOverlay(block);
      break;
    case 'banner':
      decorateBanner(block);
      break;
    default:
      decorateHighlight(block);
  }
}
