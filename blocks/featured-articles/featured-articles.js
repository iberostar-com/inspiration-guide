import { createArticleCard } from '../../scripts/iberostar/article-card.js';

const HEADING_TAGS = new Set(['h2', 'h3', 'h4', 'h5', 'h6']);

function getRows(block) {
  return [...block.children];
}

function getCells(row) {
  return row.children.length ? [...row.children] : [row];
}

function sanitizeHeadingTag(tagName, fallback = 'h2') {
  const normalizedTag = `${tagName || fallback}`.trim().toLowerCase();
  return HEADING_TAGS.has(normalizedTag) ? normalizedTag : fallback;
}

function parseConfigRow(row) {
  const cells = getCells(row);
  if (cells.length < 5) return null;

  return {
    articleTitleHeading: sanitizeHeadingTag(cells[5]?.textContent, 'h3'),
    featuredBadgeText: cells[4]?.textContent.trim() || '',
    featuredTitle: cells[0]?.textContent.trim() || '',
    featuredTitleHeading: sanitizeHeadingTag(cells[1]?.textContent, 'h2'),
    latestTitle: cells[2]?.textContent.trim() || '',
    latestTitleHeading: sanitizeHeadingTag(cells[3]?.textContent, 'h2'),
  };
}

function parseArticleRow(row, index) {
  const cells = getCells(row);
  if (!cells.length) return null;

  const placement = cells[0]?.textContent.trim().toLowerCase() || (index === 0 ? 'featured' : 'latest');
  const article = {
    authorName: cells[9]?.textContent.trim() || '',
    category: cells[5]?.textContent.trim() || '',
    categoryUrl: cells[6]?.querySelector('a')?.href || cells[6]?.textContent.trim() || '',
    ctaText: cells[11]?.textContent.trim() || '',
    description: cells[2]?.textContent.trim() || '',
    image: cells[3]?.querySelector('img')?.src || '',
    imageAlt: cells[4]?.textContent.trim() || cells[3]?.querySelector('img')?.alt || '',
    publicationDate: cells[7]?.textContent.trim() || '',
    readTime: cells[8]?.textContent.trim() || '',
    title: cells[1]?.textContent.trim() || '',
    url: cells[10]?.querySelector('a')?.href || cells[10]?.textContent.trim() || '',
  };

  if (!article.title && !article.url && !article.image) return null;

  return {
    article,
    placement,
  };
}

function appendSectionHeading(section, title, headingTag, className) {
  if (!title) return;

  const heading = document.createElement(headingTag);
  heading.className = className;
  heading.textContent = title;
  section.append(heading);
}

export default function decorate(block) {
  const rows = getRows(block);
  const firstRowConfig = parseConfigRow(rows[0]);
  const config = firstRowConfig || {
    articleTitleHeading: 'h3',
    featuredBadgeText: '',
    featuredTitle: '',
    featuredTitleHeading: 'h2',
    latestTitle: '',
    latestTitleHeading: 'h2',
  };
  const articleRows = firstRowConfig ? rows.slice(1) : rows;
  const parsedArticles = articleRows.map(parseArticleRow).filter(Boolean);

  if (!parsedArticles.length) return;

  const featuredArticle = parsedArticles.find(({ placement }) => placement === 'featured')
    || parsedArticles[0];
  const latestArticles = parsedArticles
    .filter(({ article }) => article !== featuredArticle.article);

  const layout = document.createElement('div');
  layout.className = 'featured-articles-layout';

  if (featuredArticle) {
    const featuredSection = document.createElement('section');
    featuredSection.className = 'featured-articles-featured';
    appendSectionHeading(
      featuredSection,
      config.featuredTitle,
      config.featuredTitleHeading,
      'featured-articles-section-title',
    );
    featuredSection.append(createArticleCard(featuredArticle.article, {
      badgeText: config.featuredBadgeText,
      eagerImage: true,
      featured: true,
      headingTag: config.articleTitleHeading,
    }));
    layout.append(featuredSection);
  }

  if (latestArticles.length) {
    const latestSection = document.createElement('section');
    latestSection.className = 'featured-articles-latest';
    appendSectionHeading(
      latestSection,
      config.latestTitle,
      config.latestTitleHeading,
      'featured-articles-section-title',
    );

    const list = document.createElement('div');
    list.className = 'featured-articles-list';
    latestArticles.forEach(({ article }) => {
      list.append(createArticleCard(article, {
        headingTag: config.articleTitleHeading,
      }));
    });

    latestSection.append(list);
    layout.append(latestSection);
  }

  block.replaceChildren(layout);
}
