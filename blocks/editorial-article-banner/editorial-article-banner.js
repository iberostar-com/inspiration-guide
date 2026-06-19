export default function decorate(block) {
  const title = block.getAttribute('data-title') || '';
  const description = block.getAttribute('data-description') || '';
  const linkText = block.getAttribute('data-link-text') || '';
  const linkUrl = block.getAttribute('data-link') || '';

  const wrapper = document.createElement('div');
  wrapper.className = 'editorial-article-banner-content';

  if (title) {
    const titleEl = document.createElement('p');
    titleEl.className = 'editorial-article-banner-title';
    titleEl.textContent = title;
    wrapper.append(titleEl);
  }

  if (description) {
    const descEl = document.createElement('p');
    descEl.className = 'editorial-article-banner-description';
    descEl.textContent = description;
    wrapper.append(descEl);
  }

  if (linkUrl) {
    const link = document.createElement('a');
    link.className = 'editorial-article-banner-link';
    link.href = linkUrl;
    link.textContent = linkText || linkUrl;
    wrapper.append(link);
  }

  block.replaceChildren(wrapper);
}
