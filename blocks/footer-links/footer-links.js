import { moveInstrumentation } from '../../scripts/scripts.js';

function getCellText(container, index) {
  const cells = [...container.children];
  return cells[index]?.textContent?.trim() || '';
}

function getPropElement(container, prop) {
  if (container?.matches?.(`[data-aue-prop="${prop}"]`)) return container;
  return container?.querySelector?.(`[data-aue-prop="${prop}"]`) || null;
}

function getModelElement(container, model) {
  if (container?.matches?.(`[data-aue-model="${model}"]`)) return container;
  return container?.querySelector?.(`[data-aue-model="${model}"]`) || null;
}

function getLinksContainer(group) {
  return getPropElement(group, 'links') || group.querySelector?.('[data-aue-prop="links"]') || null;
}

function getBoolFromRow(row, prop, fallbackIndex) {
  const propEl = getPropElement(row, prop);
  const text = (propEl?.textContent?.trim() || getCellText(row, fallbackIndex)).toLowerCase();
  return text === 'true' || text === 'on' || text === 'yes';
}

function isTrueValue(value = '') {
  const text = value.toLowerCase();
  return text === 'true' || text === 'on' || text === 'yes';
}

function getHrefFromField(field) {
  const anchor = field?.querySelector?.('a[href]');
  if (anchor) return anchor.getAttribute('href')?.trim() || '';
  return field?.textContent?.trim() || '';
}

function getPropValues(container, propName, getter = (el) => el.textContent?.trim() || '') {
  if (!container) return [];

  const fields = [...container.querySelectorAll('[data-aue-prop]')]
    .filter((el) => {
      const prop = el.getAttribute('data-aue-prop') || '';
      return prop === propName || prop.endsWith(`_${propName}`);
    });

  return fields.map(getter).filter((value) => value !== '');
}

function findNestedProp(container, propName) {
  return [...container.querySelectorAll('[data-aue-prop]')]
    .find((el) => {
      const prop = el.getAttribute('data-aue-prop') || '';
      return prop === propName || prop.endsWith(`_${propName}`);
    }) || null;
}

function getItemsFromLinksContainer(linksContainer) {
  if (!linksContainer) return [];

  // Strategy 1: Look for per-item wrappers in repeatable container data.
  const directItems = [...linksContainer.children]
    .filter((child) => findNestedProp(child, 'linkLabel'));

  if (directItems.length > 0) {
    return directItems
      .map((itemContainer) => {
        const labelEl = findNestedProp(itemContainer, 'linkLabel');
        const urlEl = findNestedProp(itemContainer, 'linkUrl');
        const newTabEl = findNestedProp(itemContainer, 'linkNewTab');
        const nofollowEl = findNestedProp(itemContainer, 'linkNofollow');

        const label = labelEl?.textContent?.trim() || '';
        const url = getHrefFromField(urlEl) || '#';
        const newTab = isTrueValue(newTabEl?.textContent || '');
        const nofollow = isTrueValue(nofollowEl?.textContent || '');

        return {
          label,
          url,
          newTab,
          nofollow,
          sourceNode: itemContainer,
        };
      })
      .filter((item) => item.label);
  }

  // Strategy 2: Flat prop list fallback.
  const labels = getPropValues(linksContainer, 'linkLabel');
  const urls = getPropValues(linksContainer, 'linkUrl', getHrefFromField);
  const newTabs = getPropValues(linksContainer, 'linkNewTab').map((v) => isTrueValue(v));
  const nofollows = getPropValues(linksContainer, 'linkNofollow').map((v) => isTrueValue(v));

  const size = Math.max(labels.length, urls.length);
  if (!size) return [];

  return Array.from({ length: size }, (_, i) => ({
    label: labels[i] || '',
    url: urls[i] || '#',
    newTab: newTabs[i] || false,
    nofollow: nofollows[i] || false,
    sourceNode: null,
  })).filter((item) => item.label);
}

function getHrefFromRow(row, prop, fallbackIndex) {
  const propEl = getPropElement(row, prop);
  const anchor = propEl?.querySelector?.('a[href]') || row.querySelector?.('a[href]');
  if (anchor) return anchor.getAttribute('href')?.trim() || '#';
  return getCellText(row, fallbackIndex) || '#';
}

function buildLinkItem(row) {
  if (!row) return null;

  // Try to find label via data-aue-prop first (Universal Editor)
  const labelProp = getPropElement(row, 'linkLabel') || row.querySelector('[data-aue-prop="linkLabel"]');
  const label = labelProp?.textContent?.trim() || getCellText(row, 0);
  if (!label) return null;

  // Find URL via data-aue-prop or fallback
  const urlProp = getPropElement(row, 'linkUrl') || row.querySelector('[data-aue-prop="linkUrl"]');
  const url = (urlProp && getHrefFromField(urlProp)) || getHrefFromRow(row, 'linkUrl', 1);

  // Find boolean flags
  const newTabProp = getPropElement(row, 'linkNewTab') || row.querySelector('[data-aue-prop="linkNewTab"]');
  const nofollowProp = getPropElement(row, 'linkNofollow') || row.querySelector('[data-aue-prop="linkNofollow"]');

  const newTab = newTabProp
    ? isTrueValue(newTabProp.textContent)
    : getBoolFromRow(row, 'linkNewTab', 2);
  const nofollow = nofollowProp
    ? isTrueValue(nofollowProp.textContent)
    : getBoolFromRow(row, 'linkNofollow', 3);

  const li = document.createElement('li');
  li.className = 'footer-links-item';
  const a = document.createElement('a');
  a.href = url || '#';
  a.textContent = label;

  if (newTab && nofollow) {
    a.target = '_blank';
    a.rel = 'noopener nofollow';
  } else if (newTab) {
    a.target = '_blank';
    a.rel = 'noopener';
  } else if (nofollow) {
    a.rel = 'nofollow';
  }

  moveInstrumentation(row, li);
  li.append(a);
  return li;
}

function buildLinkItemFromData(item) {
  const label = item?.label?.trim() || '';
  if (!label) return null;

  const li = document.createElement('li');
  li.className = 'footer-links-item';

  const a = document.createElement('a');
  a.href = item.url?.trim() || '#';
  a.textContent = label;

  if (item.newTab && item.nofollow) {
    a.target = '_blank';
    a.rel = 'noopener nofollow';
  } else if (item.newTab) {
    a.target = '_blank';
    a.rel = 'noopener';
  } else if (item.nofollow) {
    a.rel = 'nofollow';
  }

  if (item.sourceNode) {
    moveInstrumentation(item.sourceNode, li);
  }

  li.append(a);
  return li;
}

function collectGroups(block) {
  // Priority 1: Look for Universal Editor data-aue-model structure
  const groups = [...block.querySelectorAll('[data-aue-model="footer-links-group"]')]
    .filter((group) => !group.closest('.footer-links-rendered'));

  if (groups.length) {
    return groups.map((group) => {
      // Extract ONLY the title element (with data-aue-prop="title")
      const titleEl = getPropElement(group, 'title');
      const linksContainer = getLinksContainer(group);

      // Link items are child blocks (data-aue-model="footer-links-item")
      const linkRows = [...group.querySelectorAll('[data-aue-model="footer-links-item"]')];

      // Get title text from the title element only
      const titleText = titleEl?.textContent?.trim() || '';

      return {
        titleElement: titleEl,
        titleText,
        sourceNodes: [group],
        linkRows,
        linksContainer,
      };
    });
  }

  // Priority 2: Look for class-based structure (local test files)
  const classGroups = [...block.querySelectorAll('.footer-links-group')]
    .filter((group) => !group.closest('.footer-links-rendered'));

  if (classGroups.length) {
    return classGroups.map((group) => {
      const titleEl = group.querySelector('.footer-links-group-title') || group.firstElementChild;
      const titleText = titleEl?.textContent?.trim() || '';

      return {
        titleElement: titleEl,
        titleText,
        sourceNodes: [group],
        linkRows: [...group.querySelectorAll('.footer-link-item')],
        linksContainer: group.querySelector('.footer-links-links') || null,
      };
    });
  }

  // Priority 3: Legacy fallback - direct children as groups
  const rows = [...block.children].filter((row) => !row.classList.contains('footer-links-rendered'));
  if (!rows.length) return [];

  const titleRow = rows[0];
  const titleEl = getPropElement(titleRow, 'title') || titleRow;
  const titleText = titleEl?.textContent?.trim() || '';

  return [{
    titleElement: titleEl,
    titleText,
    sourceNodes: rows,
    linkRows: rows.slice(1),
    linksContainer: null,
  }];
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
    // Use pre-computed titleText to avoid getting whole group content
    const titleText = group.titleText || group.titleElement?.textContent?.trim() || '';
    if (!titleText) return; // Skip groups without title

    const details = document.createElement('details');
    details.className = 'footer-links-group';
    details.open = false;

    const summary = document.createElement('summary');
    summary.className = 'footer-accordion-toggle';

    const titleSpan = document.createElement('span');
    titleSpan.className = 'footer-column-title';
    titleSpan.textContent = titleText; // Only the title text

    const chevron = document.createElement('span');
    chevron.className = 'footer-accordion-chevron';
    chevron.setAttribute('aria-hidden', 'true');

    summary.append(titleSpan, chevron);
    // Move instrumentation ONLY from the title element
    if (group.titleElement) {
      moveInstrumentation(group.titleElement, titleSpan);
    }

    const ul = document.createElement('ul');
    ul.className = 'footer-links-list';

    // Strategy A: repeatable "links" container authored in List Group model.
    const containerItems = getItemsFromLinksContainer(group.linksContainer);
    if (containerItems.length > 0) {
      containerItems.forEach((item) => {
        const li = buildLinkItemFromData(item);
        if (li) ul.append(li);
      });
    } else {
      // Strategy B: legacy content with nested footer-links-item rows.
      const linkRows = group.linksContainer
        ? [...group.linksContainer.children]
        : group.linkRows;

      linkRows.forEach((row) => {
        const li = buildLinkItem(
          getModelElement(row, 'footer-links-item') || row,
        );
        if (li) ul.append(li);
      });
    }

    details.append(summary, ul);
    rendered.append(details);

    // Hide source nodes but preserve instrumentation
    group.sourceNodes.forEach((node) => node.setAttribute('aria-hidden', 'true'));
  });

  block.append(rendered);
  setupAccordionBehavior(rendered);
}
