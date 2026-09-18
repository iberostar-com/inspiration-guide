import { createArticleCard } from '../../scripts/iberostar/article-card.js';
import { resolveFinalAlt } from '../../scripts/iberostar/image-alt.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

const HEADING_TAGS = new Set(['h2', 'h3', 'h4', 'h5', 'h6']);

function getRows(block) {
  return [...block.children].filter((row) => !row.classList.contains('featured-articles-layout'));
}

// Unwraps the single nested wrapper div Universal Editor adds around cells.
function getCells(row) {
  if (!row) return [];
  if (row.children.length > 1) return [...row.children];
  const nested = [...(row.children[0]?.children || [])];
  return nested.length ? nested : [...row.children];
}

function sanitizeHeadingTag(tagName, fallback = 'h2') {
  const normalizedTag = `${tagName || fallback}`.trim().toLowerCase();
  return HEADING_TAGS.has(normalizedTag) ? normalizedTag : fallback;
}

// An article is authored as a child component (block/item), tagged with
// data-aue-model in Universal Editor and carrying article_* props.
function isArticleRow(row) {
  return !!(row.matches?.('[data-aue-model="featured-article"]')
    || row.querySelector?.('[data-aue-model="featured-article"]')
    || row.querySelector?.('[data-aue-prop^="article_"]')
    || row.querySelector?.('picture, img'));
}

function textByProp(row, prop) {
  return row.querySelector(`[data-aue-prop="${prop}"]`)?.textContent?.trim() || '';
}

function hrefByProp(row, prop) {
  const el = row.querySelector(`[data-aue-prop="${prop}"]`);
  if (!el) return '';
  return el.querySelector('a')?.href || el.textContent?.trim() || '';
}

// Reads block-level config text. Text fields carry data-aue-prop when authored;
// select fields (heading levels) are read positionally with safe defaults.
function readConfig(block) {
  const value = (prop) => block.querySelector(`[data-aue-prop="${prop}"]`)?.textContent?.trim() || '';
  const levels = getRows(block)
    .filter((row) => !isArticleRow(row))
    .map((row) => row.textContent?.trim().toLowerCase())
    .filter((text) => HEADING_TAGS.has(text));

  return {
    featuredTitle: value('featured_heading'),
    latestTitle: value('latest_heading'),
    featuredBadgeText: value('display_badge'),
    featuredTitleHeading: sanitizeHeadingTag(levels[0], 'h2'),
    latestTitleHeading: sanitizeHeadingTag(levels[1], 'h2'),
    articleTitleHeading: sanitizeHeadingTag(levels[2], 'h3'),
  };
}

function parseArticle(row, index) {
  const imageEl = row.querySelector('[data-aue-prop="article_image"]') || row.querySelector('picture, img');
  const img = imageEl?.querySelector?.('img') || (imageEl?.tagName === 'IMG' ? imageEl : null);
  const anchors = [...row.querySelectorAll('a[href]')];

  let placement = textByProp(row, 'article_placement').toLowerCase();
  if (placement !== 'featured' && placement !== 'latest') {
    const bare = getCells(row)
      .map((cell) => cell.textContent?.trim().toLowerCase())
      .find((text) => text === 'featured' || text === 'latest');
    placement = bare || (index === 0 ? 'featured' : 'latest');
  }

  const article = {
    authorName: textByProp(row, 'article_authorName'),
    category: textByProp(row, 'article_category'),
    categoryUrl: hrefByProp(row, 'article_categoryUrl') || anchors[0]?.href || '',
    ctaText: textByProp(row, 'article_cta'),
    description: textByProp(row, 'article_description'),
    image: img?.src || '',
    imageAlt: resolveFinalAlt(
      textByProp(row, 'article_imageAlt'),
      textByProp(row, 'article_imageautoalt') || textByProp(row, 'article_imageAutoAlt') || img?.alt || '',
    ),
    publicationDate: textByProp(row, 'article_publicationDate'),
    readTime: textByProp(row, 'article_readTime'),
    title: textByProp(row, 'article_title'),
    url: hrefByProp(row, 'article_url') || anchors[anchors.length - 1]?.href || '',
  };

  if (!article.title && !article.url && !article.image) return null;
  return { article, placement, row };
}

function appendSectionHeading(section, title, headingTag, className) {
  if (!title) return;
  const heading = document.createElement(headingTag);
  heading.className = className;
  heading.textContent = title;
  section.append(heading);
}

export default function decorate(block) {
  const config = readConfig(block);

  const parsedArticles = getRows(block)
    .filter(isArticleRow)
    .map((row, index) => parseArticle(row, index))
    .filter(Boolean);

  if (!parsedArticles.length) return;

  const featuredArticle = parsedArticles.find(({ placement }) => placement === 'featured')
    || parsedArticles[0];
  const latestArticles = parsedArticles.filter((item) => item !== featuredArticle);

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
    const card = createArticleCard(featuredArticle.article, {
      badgeText: config.featuredBadgeText,
      eagerImage: true,
      featured: true,
      headingTag: config.articleTitleHeading,
    });
    moveInstrumentation(featuredArticle.row, card);
    featuredSection.append(card);
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
    latestArticles.forEach((item) => {
      const card = createArticleCard(item.article, {
        headingTag: config.articleTitleHeading,
      });
      moveInstrumentation(item.row, card);
      list.append(card);
    });

    latestSection.append(list);
    layout.append(latestSection);
  }

  block.replaceChildren(layout);
}
