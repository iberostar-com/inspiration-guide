const HEADING_TAGS = ['h2', 'h3'];

let titleCount = 0;

function getSourceRows(block) {
  return [...block.children]
    .filter((child) => !child.classList.contains('article-content-table-rendered'));
}

function getPropElement(block, propName) {
  const selector = `[data-aue-prop="${propName}"]`;
  return getSourceRows(block)
    .map((row) => (row.matches?.(selector) ? row : row.querySelector?.(selector)))
    .find(Boolean) || null;
}

function getTextRows(block) {
  return getSourceRows(block).filter((row) => !row.querySelector('table'));
}

function getHeadingType(block) {
  const authoredValue = getPropElement(block, 'titleHeading')?.textContent?.trim().toLowerCase();
  if (HEADING_TAGS.includes(authoredValue)) return authoredValue;

  const rowValue = getTextRows(block)
    .map((row) => row.textContent?.trim().toLowerCase())
    .find((value) => HEADING_TAGS.includes(value));
  return rowValue || 'h2';
}

function getTitle(block) {
  const titleField = getPropElement(block, 'title');
  if (titleField) return titleField.textContent?.trim() || '';

  const semanticHeading = getSourceRows(block)
    .map((row) => row.querySelector('h2, h3'))
    .find(Boolean);
  if (semanticHeading) return semanticHeading.textContent?.trim() || '';

  return getTextRows(block)
    .map((row) => row.textContent?.trim())
    .find((value) => value && !HEADING_TAGS.includes(value.toLowerCase())) || '';
}

function normalizeTable(table) {
  if (!table.querySelector(':scope > thead')) {
    const tbody = table.querySelector(':scope > tbody');
    const firstRow = tbody
      ? tbody.querySelector(':scope > tr:first-child')
      : table.querySelector(':scope > tr:first-child');

    if (firstRow) {
      [...firstRow.querySelectorAll(':scope > td')].forEach((cell) => {
        const headingCell = document.createElement('th');
        [...cell.attributes].forEach((attribute) => {
          headingCell.setAttribute(attribute.name, attribute.value);
        });
        headingCell.scope = 'col';
        headingCell.append(...cell.childNodes);
        cell.replaceWith(headingCell);
      });

      const thead = document.createElement('thead');
      thead.append(firstRow);
      table.prepend(thead);
    }
  }

  const nakedRows = [...table.querySelectorAll(':scope > tr')];
  if (nakedRows.length) {
    const existingBody = table.querySelector(':scope > tbody');
    const tbody = existingBody || document.createElement('tbody');
    nakedRows.forEach((row) => tbody.append(row));
    if (!existingBody) table.append(tbody);
  }
}

function createTitle(title, headingType) {
  if (!title) return null;
  titleCount += 1;
  const heading = document.createElement(headingType);
  heading.className = 'article-content-table-title';
  heading.id = `article-content-table-title-${titleCount}`;
  heading.textContent = title;
  return heading;
}

export default function decorate(block) {
  block.querySelector(':scope > .article-content-table-rendered')?.remove();

  const sourceTable = getPropElement(block, 'text')?.querySelector('table')
    || getSourceRows(block).map((row) => row.querySelector('table')).find(Boolean);

  getSourceRows(block).forEach((row) => {
    row.classList.add('article-content-table-source');
    row.setAttribute('aria-hidden', 'true');
  });

  if (!sourceTable) return;

  const table = sourceTable.cloneNode(true);
  normalizeTable(table);
  table.querySelector(':scope > caption')?.remove();

  const rendered = document.createElement('div');
  rendered.className = 'article-content-table-rendered';

  const heading = createTitle(getTitle(block), getHeadingType(block));
  if (heading) {
    table.setAttribute('aria-labelledby', heading.id);
    rendered.append(heading);
  }

  const scroll = document.createElement('div');
  scroll.className = 'article-content-table-scroll';
  scroll.append(table);
  rendered.append(scroll);

  block.append(rendered);
}
