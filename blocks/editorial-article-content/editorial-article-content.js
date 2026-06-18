export default function decorate(block) {
  const layout = block.getAttribute('data-layout') || 'default';
  const title = block.getAttribute('data-title') || '';

  const article = document.createElement('article');
  article.className = `editorial-article-content ${layout}`;

  if (title) {
    const h2 = document.createElement('h2');
    h2.textContent = title;
    article.append(h2);
  }

  const content = document.createElement('div');
  content.className = 'editorial-article-content-body';

  [...block.children].forEach((row) => {
    const section = document.createElement('section');
    section.className = 'editorial-article-content-section';
    [...row.children].forEach((cell) => {
      section.append(...cell.childNodes);
    });
    content.append(section);
  });

  article.append(content);
  block.replaceChildren(article);
}
