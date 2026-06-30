/**
 * Nav Search Link block: text label + search icon, linking to the search page.
 * Structure from AEM: cells[0]=linkText, cells[1]=link
 * @param {Element} block The nav-search block element
 */
export default function decorate(block) {
  const cells = Array.from(block.querySelectorAll(':scope > div > div'));
  const linkText = cells[0]?.textContent.trim() || 'Buscar';
  const link = cells[1]?.textContent.trim() || '/search';

  const a = document.createElement('a');
  a.href = link;

  const label = document.createElement('span');
  label.textContent = linkText;

  const icon = document.createElement('img');
  icon.src = '/icons/search.svg';
  icon.alt = '';
  icon.loading = 'lazy';
  icon.className = 'nav-search-icon';

  a.append(label, icon);
  block.replaceChildren(a);
}
