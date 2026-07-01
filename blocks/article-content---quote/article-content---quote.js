import decorateArticleContentQuote from '../article-content-quote/article-content-quote.js';

/**
 * Decorates article-content-quote instances created with the legacy XWalk name.
 * @param {Element} block The legacy block element
 */
export default function decorate(block) {
  block.classList.add('article-content-quote');
  return decorateArticleContentQuote(block);
}
