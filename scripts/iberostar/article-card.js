import { formatDate, hasValidDate } from './date-format.js';
import { createResponsiveImage } from './media.js';
import { buildUrl } from './url-builder.js';

const ALLOWED_HEADING_TAGS = new Set(['h2', 'h3', 'h4', 'h5', 'h6']);

function sanitizeHeadingTag(tagName) {
  const normalizedTag = `${tagName || 'h3'}`.toLowerCase();
  return ALLOWED_HEADING_TAGS.has(normalizedTag) ? normalizedTag : 'h3';
}

function appendTextElement(parent, tagName, className, text) {
  if (!text) return null;

  const element = document.createElement(tagName);
  if (className) element.className = className;
  element.textContent = text;
  parent.append(element);
  return element;
}

function buildMetaItems(article) {
  const items = [];

  if (article.category) {
    items.push({
      className: 'article-card-category',
      label: article.category,
      url: article.categoryUrl,
    });
  }

  if (article.publicationDate) {
    items.push({
      className: 'article-card-date',
      label: hasValidDate(article.publicationDate)
        ? formatDate(article.publicationDate)
        : article.publicationDate,
    });
  }

  if (article.readTime) {
    items.push({
      className: 'article-card-read-time',
      label: article.readTime,
    });
  }

  return items;
}

export function normalizeArticleData(article = {}) {
  return {
    title: article.title?.trim() || '',
    description: article.description?.trim() || '',
    image: article.image?.trim() || '',
    imageAlt: article.imageAlt?.trim() || '',
    category: article.category?.trim() || '',
    categoryUrl: buildUrl(article.categoryUrl),
    publicationDate: article.publicationDate?.trim() || '',
    readTime: article.readTime?.trim() || '',
    authorName: article.authorName?.trim() || '',
    authorImage: article.authorImage?.trim() || '',
    url: buildUrl(article.url),
    ctaText: article.ctaText?.trim() || '',
  };
}

export function createArticleCard(
  article,
  {
    badgeText = '',
    eagerImage = false,
    featured = false,
    headingTag = 'h3',
  } = {},
) {
  const data = normalizeArticleData(article);
  const articleElement = document.createElement('article');
  articleElement.className = 'article-card';
  if (featured) articleElement.classList.add('article-card-featured');

  if (data.image) {
    const media = document.createElement('div');
    media.className = 'article-card-media';

    const picture = createResponsiveImage(
      data.image,
      data.imageAlt || data.title,
      eagerImage,
      [{ media: '(min-width: 900px)', width: featured ? '1200' : '750' }, { width: '600' }],
    );

    if (data.url) {
      const imageLink = document.createElement('a');
      imageLink.className = 'article-card-image-link';
      imageLink.href = data.url;
      imageLink.setAttribute('aria-label', data.title || 'Read article');
      imageLink.append(picture);
      media.append(imageLink);
    } else {
      media.append(picture);
    }

    articleElement.append(media);
  }

  const body = document.createElement('div');
  body.className = 'article-card-body';
  articleElement.append(body);

  if (badgeText) {
    appendTextElement(body, 'p', 'article-card-badge', badgeText);
  }

  const metaItems = buildMetaItems(data);
  if (metaItems.length) {
    const meta = document.createElement('div');
    meta.className = 'article-card-meta';

    metaItems.forEach((item) => {
      if (item.url) {
        const link = document.createElement('a');
        link.className = item.className;
        link.href = item.url;
        link.textContent = item.label;
        meta.append(link);
      } else {
        appendTextElement(meta, 'span', item.className, item.label);
      }
    });

    body.append(meta);
  }

  const title = data.title || data.ctaText;
  if (title) {
    const titleElement = document.createElement(sanitizeHeadingTag(headingTag));
    titleElement.className = 'article-card-title';

    if (data.url) {
      const titleLink = document.createElement('a');
      titleLink.href = data.url;
      titleLink.textContent = title;
      titleElement.append(titleLink);
    } else {
      titleElement.textContent = title;
    }

    body.append(titleElement);
  }

  appendTextElement(body, 'p', 'article-card-description', data.description);

  if (data.authorName) {
    const author = document.createElement('p');
    author.className = 'article-card-author';
    author.textContent = data.authorName;
    body.append(author);
  }

  if (data.url && data.ctaText) {
    const cta = document.createElement('a');
    cta.className = 'article-card-cta';
    cta.href = data.url;
    cta.textContent = data.ctaText;
    body.append(cta);
  }

  return articleElement;
}

export default createArticleCard;
