import decorateArticleContentVideo from '../article-content-video/article-content-video.js';

/**
 * Decorates article-content-video instances created with the legacy XWalk name.
 * @param {Element} block The legacy block element
 */
export default function decorate(block) {
  block.classList.add('article-content-video');
  return decorateArticleContentVideo(block);
}
