import decorateArticleContentTable from '../article-content-table/article-content-table.js';

/**
 * Decorates article-content-table instances created with the legacy XWalk name.
 * @param {Element} block The legacy block element
 */
export default function decorate(block) {
  block.classList.add('article-content-table');
  decorateArticleContentTable(block);
}
