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

function getPropValues(container, propName, getter = (el) => el.textContent?.trim() || '') {
  if (!container) return [];

  const fields = [...container.querySelectorAll('[data-aue-prop]')]
    .filter((el) => {
      const prop = el.getAttribute('data-aue-prop') || '';
      return prop === propName || prop.endsWith(`_${propName}`);
    });

  return fields.map(getter).filter((value) => value !== '');
}

function getHrefFromField(field) {
  const anchor = field?.querySelector?.('a[href]');
  if (anchor) return anchor.getAttribute('href')?.trim() || '';
  return field?.textContent?.trim() || '';
}

function getItemsFromLinksContainer(linksContainer) {
  if (!linksContainer) return [];

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
  })).filter((item) => item.label);
}

function getHrefFromRow(row, prop, fallbackIndex) {
  const propEl = getPropElement(row, prop);
  const anchor = propEl?.querySelector?.('a[href]') || row.querySelector?.('a[href]');
  if (anchor) return anchor.getAttribute('href')?.trim() || '#';
  return getCellText(row, fallbackIndex) || '#';
}

function buildLinkItem(row) {
  const label = getPropElement(row, 'linkLabel')?.textContent?.trim() || getCellText(row, 0);
  if (!label) return null;

  const url = getHrefFromRow(row, 'linkUrl', 1);
  const newTab = getBoolFromRow(row, 'linkNewTab', 2);
  const nofollow = getBoolFromRow(row, 'linkNofollow', 3);

  const li = document.createElement('li');
  li.className = 'footer-links-item';
  const a = document.createElement('a');
  a.href = url;
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

  li.append(a);
  return li;
}

function collectGroups(block) {
  const groups = [...block.querySelectorAll('[data-aue-model="footer-links-group"]')]
    .filter((group) => !group.closest('.footer-links-rendered'));

  if (groups.length) {
    return groups.map((group) => ({
      titleElement: getPropElement(group, 'title') || group,
      sourceNodes: [group],
      linkRows: [...group.querySelectorAll('[data-aue-model="footer-link-item"]')],
      linksContainer: getLinksContainer(group),
    }));
  }

  const classGroups = [...block.querySelectorAll('.footer-links-group')]
    .filter((group) => !group.closest('.footer-links-rendered'));

  if (classGroups.length) {
    return classGroups.map((group) => ({
      titleElement: group.querySelector('.footer-links-group-title') || group.firstElementChild || group,
      sourceNodes: [group],
      linkRows: [...group.querySelectorAll('.footer-link-item')],
      linksContainer: group.querySelector('.footer-links-links') || null,
    }));
  }

  // Legacy fallback: first row is title, remaining rows are links.
  const rows = [...block.children].filter((row) => !row.classList.contains('footer-links-rendered'));
  if (!rows.length) return [];

  const titleRow = rows[0];
  return [{
    titleElement: getPropElement(titleRow, 'title') || titleRow,
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

/**
 * Footer Links block — renders multiple list groups (title + links)
 * with CSS-driven accordion behavior on mobile.
 * @param {Element} block The block element
 */
export default function decorate(block) {
  const groups = collectGroups(block);
  if (!groups.length) return;

  const rendered = document.createElement('div');
  rendered.className = 'footer-links-rendered';

  groups.forEach((group) => {
    const titleText = group.titleElement?.textContent?.trim() || '';
    const details = document.createElement('details');
    details.className = 'footer-links-group';
    details.open = false;

    const summary = document.createElement('summary');
    summary.className = 'footer-accordion-toggle';

    const titleSpan = document.createElement('span');
    titleSpan.className = 'footer-column-title';
    titleSpan.textContent = titleText;

    const chevron = document.createElement('span');
    chevron.className = 'footer-accordion-chevron';
    chevron.setAttribute('aria-hidden', 'true');

    summary.append(titleSpan, chevron);
    moveInstrumentation(group.titleElement, summary);

    const ul = document.createElement('ul');
    ul.className = 'footer-links-list';

    const containerItems = getItemsFromLinksContainer(group.linksContainer);
    if (containerItems.length) {
      containerItems.forEach((item) => {
        const li = buildLinkItemFromData(item);
        if (li) ul.append(li);
      });
    } else {
      const linkRows = group.linksContainer
        ? [...group.linksContainer.children]
        : group.linkRows;

      linkRows.forEach((row) => {
        const li = buildLinkItem(getModelElement(row, 'footer-link-item') || row);
        if (li) ul.append(li);
      });
    }

    details.append(summary, ul);
    rendered.append(details);

    group.sourceNodes.forEach((node) => node.setAttribute('aria-hidden', 'true'));
  });

  block.append(rendered);
  setupAccordionBehavior(rendered);
}
