import {
  createHotelMiniCard,
  readHotelData,
} from '../hotel-mini-card/hotel-mini-card.js';
import { getTranslation } from '../../scripts/iberostar/i18n.js';

const HEADING_TAGS = new Set(['h2', 'h3']);
const DEFAULT_MAX_ITEMS = 3;
const MAX_ITEMS = 12;

function getSourceRows(block) {
  return [...block.children]
    .filter((child) => !child.classList.contains('recommended-hotels-grid-rendered'));
}

function getPropElement(root, propName) {
  const selector = `[data-aue-prop="${propName}"]`;
  if (root?.matches?.(selector)) return root;
  return root?.querySelector?.(selector) || null;
}

function getAnchor(root) {
  if (root?.matches?.('a[href]')) return root;
  return root?.querySelector?.('a[href]') || null;
}

function getImageElement(root) {
  if (root?.matches?.('img')) return root;
  return root?.querySelector?.('img') || null;
}

function unwrapContent(root) {
  let content = root;
  while (
    content?.children?.length === 1
    && content.firstElementChild?.tagName === 'DIV'
    && !content.firstElementChild.hasAttribute('data-aue-prop')
  ) {
    content = content.firstElementChild;
  }
  return content;
}

function getConfigRow(rows) {
  const props = ['eyebrow', 'title', 'cta_link', 'maxItems', 'cta_maxItems'];
  const byProp = rows.find(
    (row) => props.some((propName) => getPropElement(row, propName)),
  );
  if (byProp) return byProp;

  return rows.find((row) => unwrapContent(row)?.querySelector?.('h2, h3')) || null;
}

function getConfigText(row, propName, fallback = '') {
  return getPropElement(row, propName)?.textContent?.trim() || fallback;
}

function sanitizeHeadingTag(value, row) {
  const authoredHeading = unwrapContent(row)?.querySelector?.('h2, h3')?.tagName?.toLowerCase();
  const configuredTag = `${value || ''}`.trim().toLowerCase();
  if (HEADING_TAGS.has(configuredTag)) return configuredTag;
  return HEADING_TAGS.has(authoredHeading) ? authoredHeading : 'h2';
}

function normalizeMaxItems(value) {
  const parsed = Number.parseInt(`${value || DEFAULT_MAX_ITEMS}`, 10);
  if (Number.isNaN(parsed)) return DEFAULT_MAX_ITEMS;
  return Math.max(1, Math.min(parsed, MAX_ITEMS));
}

function getFallbackElements(row) {
  return [...(unwrapContent(row)?.children || [])];
}

function getFallbackMaxItems(row) {
  return getFallbackElements(row)
    .map((element) => element.textContent?.trim())
    .reverse()
    .find((value) => /^\d+$/.test(value || '')) || '';
}

function readConfig(block, configRow) {
  const fallbackElements = getFallbackElements(configRow);
  const heading = unwrapContent(configRow)?.querySelector?.('h2, h3');
  const fallbackAnchor = getAnchor(configRow);
  const ctaField = getPropElement(configRow, 'cta_link');
  const ctaAnchor = getAnchor(ctaField) || fallbackAnchor;
  const targetField = getConfigText(configRow, 'cta_linkTarget');
  const maxItems = block.getAttribute('data-max-items')?.trim()
    || getConfigText(configRow, 'cta_maxItems')
    || getConfigText(configRow, 'maxItems')
    || getFallbackMaxItems(configRow);

  return {
    ctaHref: block.getAttribute('data-cta-link')?.trim()
      || ctaAnchor?.getAttribute('href')?.trim()
      || '',
    ctaTarget: block.getAttribute('data-cta-link-target')?.trim()
      || ctaAnchor?.getAttribute('target')?.trim()
      || targetField
      || '_self',
    ctaText: block.getAttribute('data-cta-link-text')?.trim()
      || getConfigText(configRow, 'cta_linkText')
      || ctaAnchor?.textContent?.trim()
      || '',
    eyebrow: block.getAttribute('data-eyebrow')?.trim()
      || getConfigText(configRow, 'eyebrow')
      || fallbackElements[0]?.textContent?.trim()
      || '',
    maxItems: normalizeMaxItems(maxItems),
    title: block.getAttribute('data-title')?.trim()
      || getConfigText(configRow, 'title')
      || heading?.textContent?.trim()
      || '',
    titleType: sanitizeHeadingTag(
      block.getAttribute('data-title-type')?.trim()
        || getConfigText(configRow, 'titleType'),
      configRow,
    ),
  };
}

function hideSourceRows(rows) {
  rows.forEach((row) => {
    row.classList.add('recommended-hotels-grid-source');
    row.setAttribute('aria-hidden', 'true');
  });
}

function createCta(config) {
  if (!config.ctaText || !config.ctaHref) return null;

  const link = document.createElement('a');
  link.className = 'recommended-hotels-grid-cta';
  link.href = config.ctaHref;
  link.textContent = config.ctaText;
  if (config.ctaTarget === '_blank') {
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
  }
  return link;
}

function createHeader(config) {
  const header = document.createElement('div');
  header.className = 'recommended-hotels-grid-header';

  const copy = document.createElement('div');
  copy.className = 'recommended-hotels-grid-copy';

  if (config.eyebrow) {
    const eyebrow = document.createElement('p');
    eyebrow.className = 'recommended-hotels-grid-eyebrow';
    eyebrow.textContent = config.eyebrow;
    copy.append(eyebrow);
  }

  if (config.title) {
    const heading = document.createElement(config.titleType);
    heading.className = 'recommended-hotels-grid-title';
    heading.textContent = config.title;
    copy.append(heading);
  }

  const cta = createCta(config);
  if (cta) copy.append(cta);

  header.append(copy);
  return header;
}

function createNavButton(direction, label) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = `recommended-hotels-${direction}`;
  button.setAttribute('aria-label', label);
  button.innerHTML = '<span aria-hidden="true"></span>';
  return button;
}

function getSliderMetrics(list, items) {
  const styles = window.getComputedStyle(list);
  const gap = Number.parseFloat(styles.columnGap) || 16;
  const paddingStart = Number.parseFloat(styles.paddingInlineStart) || 0;
  const paddingEnd = Number.parseFloat(styles.paddingInlineEnd) || 0;
  const itemWidth = items[0]?.getBoundingClientRect().width || list.clientWidth;
  const contentWidth = list.clientWidth - paddingStart - paddingEnd;
  const visibleCount = Math.max(
    1,
    Math.floor((contentWidth + gap) / (itemWidth + gap) + 0.01),
  );

  return {
    gap,
    paddingStart,
    visibleCount,
  };
}

function getCurrentIndex(list, items, paddingStart) {
  const listLeft = list.getBoundingClientRect().left + paddingStart;
  return items.reduce((nearest, item, index) => {
    const distance = Math.abs(item.getBoundingClientRect().left - listLeft);
    return distance < nearest.distance ? { distance, index } : nearest;
  }, { distance: Number.POSITIVE_INFINITY, index: 0 }).index;
}

function scrollToIndex(list, items, index, paddingStart, behavior = 'smooth') {
  const target = items[index];
  if (!target) return;

  const listRect = list.getBoundingClientRect();
  const targetRect = target.getBoundingClientRect();
  const left = list.scrollLeft + targetRect.left - listRect.left - paddingStart;
  list.scrollTo({ behavior, left });
}

function createDots(container, pageCount, activePage, onSelect, label) {
  container.replaceChildren();
  Array.from({ length: pageCount }).forEach((_, index) => {
    const dot = document.createElement('button');
    dot.type = 'button';
    dot.className = 'recommended-hotels-dot';
    dot.classList.toggle('active', index === activePage);
    dot.setAttribute('aria-label', `${label} ${index + 1}`);
    dot.setAttribute('aria-current', index === activePage ? 'true' : 'false');
    dot.addEventListener('click', () => onSelect(index));
    container.append(dot);
  });
}

function setupSlider(list, desktopControls, mobileControls, labels) {
  const items = [...list.children];
  const desktopStatus = desktopControls.querySelector('.recommended-hotels-status');
  const desktopPrev = desktopControls.querySelector('.recommended-hotels-prev');
  const desktopNext = desktopControls.querySelector('.recommended-hotels-next');
  const mobilePrev = mobileControls.querySelector('.recommended-hotels-prev');
  const mobileNext = mobileControls.querySelector('.recommended-hotels-next');
  const dots = mobileControls.querySelector('.recommended-hotels-dots');
  let frame = 0;
  let currentIndex = 0;
  let visibleCount = 1;

  const sync = () => {
    const metrics = getSliderMetrics(list, items);
    visibleCount = Math.min(metrics.visibleCount, items.length);
    currentIndex = Math.min(
      getCurrentIndex(list, items, metrics.paddingStart),
      Math.max(0, items.length - visibleCount),
    );

    const end = Math.min(items.length, currentIndex + visibleCount);
    desktopStatus.textContent = `${currentIndex + 1} - ${end} ${labels.of} ${items.length}`;

    const atStart = currentIndex === 0;
    const atEnd = end >= items.length;
    [desktopPrev, mobilePrev].forEach((button) => {
      button.disabled = atStart;
    });
    [desktopNext, mobileNext].forEach((button) => {
      button.disabled = atEnd;
    });

    const pageCount = Math.ceil(items.length / visibleCount);
    const activePage = atEnd
      ? pageCount - 1
      : Math.min(Math.floor(currentIndex / visibleCount), pageCount - 1);
    createDots(
      dots,
      pageCount,
      activePage,
      (page) => {
        const target = Math.min(page * visibleCount, items.length - visibleCount);
        scrollToIndex(list, items, target, metrics.paddingStart);
      },
      labels.goTo,
    );

    const controlsHidden = items.length <= visibleCount;
    desktopControls.hidden = controlsHidden;
    mobileControls.hidden = controlsHidden;
  };

  const scheduleSync = () => {
    window.cancelAnimationFrame(frame);
    frame = window.requestAnimationFrame(sync);
  };

  const move = (direction) => {
    const metrics = getSliderMetrics(list, items);
    const target = Math.max(
      0,
      Math.min(
        currentIndex + direction * visibleCount,
        items.length - visibleCount,
      ),
    );
    scrollToIndex(list, items, target, metrics.paddingStart);
  };

  [desktopPrev, mobilePrev].forEach((button) => {
    button.addEventListener('click', () => move(-1));
  });
  [desktopNext, mobileNext].forEach((button) => {
    button.addEventListener('click', () => move(1));
  });

  list.addEventListener('scroll', scheduleSync, { passive: true });
  const resizeObserver = new ResizeObserver(scheduleSync);
  resizeObserver.observe(list);
  sync();

  return () => {
    resizeObserver.disconnect();
    window.cancelAnimationFrame(frame);
  };
}

function createDesktopControls(labels) {
  const controls = document.createElement('div');
  controls.className = 'recommended-hotels-pagination';

  const status = document.createElement('span');
  status.className = 'recommended-hotels-status';
  status.setAttribute('aria-live', 'polite');

  const buttons = document.createElement('div');
  buttons.className = 'recommended-hotels-pagination-buttons';
  buttons.append(
    createNavButton('prev', labels.previous),
    createNavButton('next', labels.next),
  );

  controls.append(status, buttons);
  return controls;
}

function createMobileControls(labels) {
  const controls = document.createElement('div');
  controls.className = 'recommended-hotels-mobile-controls';

  const dots = document.createElement('div');
  dots.className = 'recommended-hotels-dots';

  controls.append(
    createNavButton('prev', labels.previous),
    dots,
    createNavButton('next', labels.next),
  );
  return controls;
}

function createPlaceholderHotel(index) {
  return {
    ctaText: '',
    href: '',
    image: '',
    imageAlt: '',
    location: '',
    name: `Hotel ${index + 1}`,
    priceFrom: '',
    stars: 0,
    tagLabel: '',
    target: '_self',
  };
}

function copyAueAttributes(from, to) {
  [...from.attributes]
    .filter(({ name }) => name.startsWith('data-aue-') || name.startsWith('data-richtext-'))
    .forEach(({ name, value }) => {
      to.setAttribute(name, value);
    });
}

function getTextFromProps(root, names) {
  return names
    .map((name) => getPropElement(root, name)?.textContent?.trim())
    .find(Boolean) || '';
}

function getHrefFromProps(root, names) {
  return names
    .map((name) => {
      const field = getPropElement(root, name);
      return getAnchor(field)?.getAttribute('href')?.trim() || field?.textContent?.trim() || '';
    })
    .find(Boolean) || '';
}

function getImageFromProps(root, names) {
  return names
    .map((name) => {
      const field = getPropElement(root, name);
      return getImageElement(field)?.src || getAnchor(field)?.getAttribute('href')?.trim() || '';
    })
    .find(Boolean) || '';
}

function readGridHotelData(root) {
  const hasCardFields = Boolean(root.querySelector?.('[data-aue-prop^="card_"]'));
  const isHotelCardsRoot = root.matches?.('[data-aue-prop="hotels"]')
    || root.closest?.('[data-aue-prop="hotels"]');
  if (isHotelCardsRoot && !hasCardFields) return null;

  const fields = hasCardFields ? {
    ctaText: ['card_linkText'],
    href: ['card_link'],
    image: ['card_image'],
    imageAlt: ['card_imageAlt'],
    location: ['card_location'],
    name: ['card_hotelName'],
    priceFrom: ['card_priceFrom'],
    stars: ['card_stars'],
    tagLabel: ['card_tagLabel'],
    target: ['card_linkTarget'],
  } : {
    ctaText: ['cta_linkText'],
    href: ['cta_link'],
    image: ['media_image'],
    imageAlt: ['media_imageAlt'],
    location: ['hotel_location'],
    name: ['hotel_hotelName'],
    priceFrom: ['hotel_priceFrom'],
    stars: ['hotel_stars'],
    tagLabel: ['tag_tagLabel'],
    target: ['cta_linkTarget'],
  };
  const hotel = {
    ctaText: getTextFromProps(root, fields.ctaText),
    href: getHrefFromProps(root, fields.href),
    image: getImageFromProps(root, fields.image),
    imageAlt: getTextFromProps(root, fields.imageAlt),
    location: getTextFromProps(root, fields.location),
    name: getTextFromProps(root, fields.name),
    priceFrom: getTextFromProps(root, fields.priceFrom),
    stars: getTextFromProps(root, fields.stars),
    tagLabel: getTextFromProps(root, fields.tagLabel),
    target: getTextFromProps(root, fields.target) || '_self',
  };

  return hotel.image || hotel.name || hotel.href ? hotel : null;
}

function isAuthoringPage(block) {
  return Boolean(block.closest('[data-aue-resource]') || document.querySelector('[data-aue-resource]'));
}

function observeAuthorChanges(block) {
  block.recommendedHotelsObserver?.disconnect();
  if (!isAuthoringPage(block)) return;

  const observer = new MutationObserver(() => {
    observer.disconnect();
    // eslint-disable-next-line no-use-before-define
    decorate(block);
  });
  getSourceRows(block).forEach((row) => {
    observer.observe(row, {
      attributes: true,
      childList: true,
      characterData: true,
      subtree: true,
    });
  });
  block.recommendedHotelsObserver = observer;
}

function getHotelContainerRoots(block) {
  return [...block.querySelectorAll('[data-aue-prop="hotels"]')]
    .flatMap((container) => {
      const items = [...container.children]
        .filter((child) => child.querySelector?.(
          '[data-aue-prop="card_hotelName"], [data-aue-prop="card_image"], [data-aue-prop="card_link"], [data-aue-prop="hotel_hotelName"], [data-aue-prop="media_image"], [data-aue-prop="cta_link"]',
        ));
      return items.length ? items : [container];
    });
}

async function getLabels() {
  const [
    carousel,
    previous,
    next,
    goTo,
    of,
  ] = await Promise.all([
    getTranslation('hotelsCarousel', 'Recommended hotels'),
    getTranslation('carouselPrevious', 'Previous hotels'),
    getTranslation('carouselNext', 'Next hotels'),
    getTranslation('carouselGoTo', 'Go to hotel group'),
    getTranslation('carouselOf', 'of'),
  ]);

  return {
    carousel,
    goTo,
    next,
    of,
    previous,
  };
}

export default async function decorate(block) {
  block.recommendedHotelsObserver?.disconnect();
  const existing = block.querySelector(':scope > .recommended-hotels-grid-rendered');
  existing?.sliderCleanup?.();
  existing?.remove();

  const sourceRows = getSourceRows(block);
  const configRow = getConfigRow(sourceRows);
  const config = readConfig(block, configRow);
  const nestedHotelRoots = getHotelContainerRoots(block);
  const itemRows = sourceRows
    .filter((row) => row !== configRow)
    .filter((row) => !nestedHotelRoots.some((root) => root === row || row.contains(root)));
  const authoredHotels = [...nestedHotelRoots, ...itemRows]
    .map((row) => ({
      hotel: readGridHotelData(row) || readHotelData(row, 'vertical'),
      source: row,
    }))
    .filter(({ hotel }) => hotel?.image || hotel?.name || hotel?.href)
    .slice(0, config.maxItems);
  const placeholderCount = isAuthoringPage(block)
    ? Math.max(0, config.maxItems - authoredHotels.length)
    : 0;
  const hotels = [
    ...authoredHotels,
    ...Array.from({ length: placeholderCount }).map((_, index) => (
      { hotel: createPlaceholderHotel(authoredHotels.length + index), source: null }
    )),
  ];
  const labels = await getLabels();

  const wrapper = document.createElement('div');
  wrapper.className = 'recommended-hotels-grid-rendered';

  const header = createHeader(config);
  const desktopControls = createDesktopControls(labels);
  header.append(desktopControls);
  wrapper.append(header);

  const list = document.createElement('ul');
  list.className = 'recommended-hotels-list';
  list.setAttribute('aria-label', labels.carousel);
  list.tabIndex = 0;

  hotels.forEach(({ hotel, source }) => {
    const li = document.createElement('li');
    li.className = 'recommended-hotels-item';
    if (source) copyAueAttributes(source, li);
    li.append(createHotelMiniCard(hotel, 'vertical'));
    list.append(li);
  });

  const mobileControls = createMobileControls(labels);
  if (list.children.length) {
    wrapper.append(list, mobileControls);
    wrapper.sliderCleanup = setupSlider(list, desktopControls, mobileControls, labels);
  } else {
    desktopControls.hidden = true;
  }

  hideSourceRows(sourceRows);
  block.append(wrapper);
  observeAuthorChanges(block);
}
