import { moveInstrumentation } from '../../scripts/scripts.js';

const LINK_FIELDS = ['linkLabel', 'linkUrl', 'linkNewTab', 'linkNofollow'];

function getCellText(container, index) {
  const cells = [...container.children];
  return cells[index]?.textContent?.trim() || '';
}

function getPropElement(container, prop) {
  if (container?.matches?.(`[data-aue-prop="${prop}"]`)) return container;
  return container?.querySelector?.(`[data-aue-prop="${prop}"]`) || null;
}

function isTrueValue(value = '') {
  const text = value.toLowerCase();
  return text === 'true' || text === 'on' || text === 'yes';
}

function getHrefFromField(field) {
  if (!field) return '';
  const anchor = field.querySelector?.('a[href]');
  if (anchor) return anchor.getAttribute('href')?.trim() || '';
  return field.textContent?.trim() || '';
}

/**
 * Extract links from a Universal Editor container multifield.
 * Fields are delivered in document order; each linkLabel starts a new item.
 */
function extractLinksFromAue(group) {
  const fieldEls = [...group.querySelectorAll('[data-aue-prop]')]
    .filter((el) => LINK_FIELDS.includes(el.getAttribute('data-aue-prop')));
  if (!fieldEls.length) return [];

  const items = [];
  let current = null;
  fieldEls.forEach((el) => {
    const name = el.getAttribute('data-aue-prop');
    if (name === 'linkLabel') {
      current = {
        labelEl: el, urlEl: null, newTabEl: null, nofollowEl: null,
      };
      items.push(current);
    }
    if (!current) return;
    if (name === 'linkUrl') current.urlEl = el;
    else if (name === 'linkNewTab') current.newTabEl = el;
    else if (name === 'linkNofollow') current.nofollowEl = el;
  });

  return items
    .map((it) => ({
      label: it.labelEl?.textContent?.trim() || '',
      url: getHrefFromField(it.urlEl) || '#',
      newTab: isTrueValue(it.newTabEl?.textContent || ''),
      nofollow: isTrueValue(it.nofollowEl?.textContent || ''),
      sourceNode: it.labelEl?.closest('[data-aue-resource]') || null,
    }))
    .filter((it) => it.label);
}

/**
 * Build a link from four consecutive value elements (label, url, newTab, nofollow).
 */
function valuesToLink(elems) {
  const label = elems[0]?.textContent?.trim() || '';
  if (!label) return null;
  return {
    label,
    url: getHrefFromField(elems[1]) || '#',
    newTab: isTrueValue(elems[2]?.textContent || ''),
    nofollow: isTrueValue(elems[3]?.textContent || ''),
    sourceNode: null,
  };
}

/**
 * Parse a Universal Editor container multifield cell where each item is
 * separated by an <hr> and its values are consecutive <p> elements.
 */
function parseHrDelimitedLinks(cell) {
  const links = [];
  let current = [];
  const flush = () => {
    if (current.length) {
      const link = valuesToLink(current);
      if (link) links.push(link);
      current = [];
    }
  };
  [...cell.children].forEach((el) => {
    if (el.tagName === 'HR') flush();
    else current.push(el);
  });
  flush();
  return links;
}

/**
 * Convert a row of value cells (label | url | newTab | nofollow) to a link.
 */
function rowToLink(row) {
  const label = getCellText(row, 0);
  if (!label) return null;
  return {
    label,
    url: getHrefFromField(row.children[1]) || '#',
    newTab: isTrueValue(getCellText(row, 2)),
    nofollow: isTrueValue(getCellText(row, 3)),
    sourceNode: row,
  };
}

/**
 * Build a link from four consecutive leaf cells (label, url, newTab, nofollow).
 */
function cellsToLink(cells) {
  const label = cells[0]?.textContent?.trim() || '';
  if (!label) return null;
  return {
    label,
    url: getHrefFromField(cells[1]) || '#',
    newTab: isTrueValue(cells[2]?.textContent || ''),
    nofollow: isTrueValue(cells[3]?.textContent || ''),
    sourceNode: cells[0] || null,
  };
}

/**
 * Normalize a group's links to a common shape regardless of authoring source.
 */
function extractLinks(group) {
  // 1) Universal Editor container multifield exposing data-aue-prop fields.
  const aueLinks = extractLinksFromAue(group);
  if (aueLinks.length) return aueLinks;

  // 2) Class-based item rows (previewed/legacy content).
  const classRows = [...group.querySelectorAll('.footer-link-item')];
  if (classRows.length) return classRows.map(rowToLink).filter(Boolean);

  // Identify (and exclude) the title cell from the link candidates.
  const titleEl = getPropElement(group, 'title')
    || group.querySelector?.('.footer-links-group-title')
    || group.firstElementChild;
  const rowChildren = [...group.children].filter((child) => {
    if (child === titleEl) return false;
    if (getPropElement(child, 'title')) return false;
    if (child.matches?.('.footer-links-group-title')) return false;
    return true;
  });

  // 3) Container multifield cell: items separated by <hr>, values in <p>.
  const hrCell = rowChildren.find((child) => child.querySelector?.(':scope > hr'));
  if (hrCell) return parseHrDelimitedLinks(hrCell);

  // 4) Item rows: each row carries up to four cells as one link.
  const itemRows = rowChildren.filter(
    (row) => row.children.length >= 2 && row.children.length <= LINK_FIELDS.length,
  );
  if (itemRows.length && itemRows.length === rowChildren.length) {
    return itemRows.map(rowToLink).filter(Boolean);
  }

  // 5) Flat fallback: a run of leaf cells chunked into groups of four.
  const leafCells = rowChildren
    .flatMap((child) => (child.querySelector(':scope > div') ? [...child.children] : [child]))
    .filter((cell) => !cell.querySelector(':scope > div'));
  const links = [];
  for (let i = 0; i < leafCells.length; i += LINK_FIELDS.length) {
    const link = cellsToLink(leafCells.slice(i, i + LINK_FIELDS.length));
    if (link) links.push(link);
  }
  return links;
}

function getGroupTitle(group) {
  const titleEl = getPropElement(group, 'title')
    || group.querySelector?.('.footer-links-group-title')
    || group.firstElementChild;
  return {
    titleElement: titleEl,
    titleText: titleEl?.textContent?.trim() || '',
  };
}

function buildLinkItem(link) {
  const label = link?.label?.trim();
  if (!label) return null;

  const li = document.createElement('li');
  li.className = 'footer-links-item';

  const a = document.createElement('a');
  a.href = link.url?.trim() || '#';
  a.textContent = label;

  if (link.newTab && link.nofollow) {
    a.target = '_blank';
    a.rel = 'noopener nofollow';
  } else if (link.newTab) {
    a.target = '_blank';
    a.rel = 'noopener';
  } else if (link.nofollow) {
    a.rel = 'nofollow';
  }

  if (link.sourceNode) {
    moveInstrumentation(link.sourceNode, li);
  }

  li.append(a);
  return li;
}

function collectGroups(block) {
  // Priority 1: Universal Editor group blocks (model or component attribute).
  const aueGroups = [...block.querySelectorAll('[data-aue-model="footer-links-group"], [data-aue-component="footer-links-group"]')]
    .filter((group) => !group.closest('.footer-links-rendered'));
  if (aueGroups.length) {
    return aueGroups.map((group) => ({
      ...getGroupTitle(group),
      sourceNodes: [group],
      links: extractLinks(group),
    }));
  }

  // Priority 2: Class-based group structure.
  const classGroups = [...block.querySelectorAll('.footer-links-group')]
    .filter((group) => !group.closest('.footer-links-rendered'));
  if (classGroups.length) {
    return classGroups.map((group) => ({
      ...getGroupTitle(group),
      sourceNodes: [group],
      links: extractLinks(group),
    }));
  }

  // Priority 3: each direct child is a group (unclassed delivered markup).
  const rows = [...block.children].filter((row) => !row.classList.contains('footer-links-rendered'));
  if (!rows.length) return [];
  return rows.map((group) => {
    const { titleElement, titleText } = getGroupTitle(group);
    return {
      titleElement,
      titleText,
      sourceNodes: [group],
      links: extractLinks(group),
    };
  }).filter((group) => group.titleText);
}

function setupAccordionBehavior(rendered) {
  const detailsList = [...rendered.querySelectorAll('.footer-links-group')];
  if (!detailsList.length) return;

  const desktopQuery = window.matchMedia('(min-width: 600px)');

  const syncExpandedState = (details) => {
    const summary = details.querySelector(':scope > .footer-accordion-toggle');
    if (!summary) return;
    summary.setAttribute('aria-expanded', details.open ? 'true' : 'false');
  };

  const applyViewportMode = () => {
    const isDesktop = desktopQuery.matches;

    detailsList.forEach((details) => {
      details.open = isDesktop;
      syncExpandedState(details);
    });
  };

  detailsList.forEach((details) => {
    const summary = details.querySelector(':scope > .footer-accordion-toggle');
    if (summary) {
      summary.setAttribute('role', 'button');
      syncExpandedState(details);
    }

    details.addEventListener('toggle', () => {
      if (desktopQuery.matches) {
        details.open = true;
      }

      if (!desktopQuery.matches && details.open) {
        detailsList.forEach((other) => {
          if (other !== details) {
            other.open = false;
            syncExpandedState(other);
          }
        });
      }

      syncExpandedState(details);
    });
  });

  if (desktopQuery.addEventListener) {
    desktopQuery.addEventListener('change', applyViewportMode);
  } else {
    desktopQuery.addListener(applyViewportMode);
  }

  applyViewportMode();
}

export default function decorate(block) {
  const groups = collectGroups(block);
  if (!groups.length) return;

  const rendered = document.createElement('div');
  rendered.className = 'footer-links-rendered';

  groups.forEach((group) => {
    if (!group.titleText) return; // Skip groups without title

    const details = document.createElement('details');
    details.className = 'footer-links-group';
    details.open = false;

    const summary = document.createElement('summary');
    summary.className = 'footer-accordion-toggle';

    const titleSpan = document.createElement('span');
    titleSpan.className = 'footer-column-title';
    titleSpan.textContent = group.titleText;

    const chevron = document.createElement('span');
    chevron.className = 'footer-accordion-chevron';
    chevron.setAttribute('aria-hidden', 'true');

    summary.append(titleSpan, chevron);
    if (group.titleElement) {
      moveInstrumentation(group.titleElement, titleSpan);
    }

    const ul = document.createElement('ul');
    ul.className = 'footer-links-list';
    group.links.forEach((link) => {
      const li = buildLinkItem(link);
      if (li) ul.append(li);
    });

    details.append(summary, ul);
    rendered.append(details);

    // Hide source nodes but preserve instrumentation
    group.sourceNodes.forEach((node) => node.setAttribute('aria-hidden', 'true'));
  });

  block.append(rendered);
  setupAccordionBehavior(rendered);
}
