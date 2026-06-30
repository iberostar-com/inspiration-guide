import decorateArticleContentImage from '../article-content-image/article-content-image.js';

/**
 * Decorates article-content-image instances created with the legacy XWalk name.
 * @param {Element} block The legacy block element
 */
export default function decorate(block) {
  block.classList.add('article-content-image');
  decorateArticleContentImage(block);
}
