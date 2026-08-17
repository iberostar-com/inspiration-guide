import {
  createHotelMiniCard,
} from '../hotel-mini-card/hotel-mini-card.js';
import { getPlaceholder } from '../../scripts/iberostar/placeholders.js';
import { toPageHref } from '../../scripts/iberostar/page-links.js';
import {
  fetchHotelByCode,
  fetchHotelPriceByCode,
  getHotelsPublicHost,
  isValidHotelCode,
} from '../../scripts/iberostar/hotels-api.js';
import {
  getHotelPriceData,
  initHotelPriceLiveUpdate,
} from '../../scripts/iberostar/hotel-price-line.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

const DEFAULT_VISIBLE_COUNT = 4;
const CONFIG_FIELD_POSITIONS = {
  eyebrow: 0,
  gridCta_link: 3,
  gridCta_linkTarget: 4,
  gridCta_linkText: 2,
  title: 1,
};

function getSourceRows(block) {
  return [...block.children]
    .filter((child) => !child.classList.contains('recommended-dynamic-hotels-grid-rendered'));
}

function getPropElement(block, propName) {
  const selector = `[data-aue-prop="${propName}"]`;
  return getSourceRows(block)
    .map((row) => (row.matches?.(selector) ? row : row.querySelector?.(selector)))
    .find(Boolean) || null;
}

function getCells(row) {
  if (!row) return [];
  if (row.children.length > 1) return [...row.children];

  const nested = [...(row.children[0]?.children || [])];
  return nested.length ? nested : [...row.children];
}

function getAnchor(field) {
  if (field?.matches?.('a[href]')) return field;
  return field?.querySelector?.('a[href]') || null;
}

function isTargetValue(value) {
  return /^_(self|blank)$/i.test(`${value || ''}`.trim());
}

function hasConfigFields(row) {
  return Boolean(row.querySelector?.(
    '[data-aue-prop="eyebrow"], [data-aue-prop="title"], '
    + '[data-aue-prop="gridCta_linkText"], [data-aue-prop="gridCta_link"], '
    + '[data-aue-prop="gridCta_linkTarget"]',
  ));
}

function getConfigRows(block) {
  const rows = getSourceRows(block);
  const instrumented = rows.filter((row) => hasConfigFields(row));
  if (instrumented.length) return instrumented;

  const hasLegacyConfig = [
    'data-cta-link',
    'data-cta-link-target',
    'data-cta-link-text',
    'data-eyebrow',
    'data-title',
  ].some((attr) => block.hasAttribute(attr));
  if (hasLegacyConfig) return [];

  return rows.slice(0, Object.keys(CONFIG_FIELD_POSITIONS).length)
    .filter((row) => getCells(row).length === 1);
}

function getConfigField(block, propName, legacyAttr) {
  const prop = getPropElement(block, propName);
  if (prop) return prop;
  if (block.hasAttribute(legacyAttr)) return null;

  const rows = getConfigRows(block);
  const ctaLinkRow = rows.find((row) => {
    const href = getAnchor(row)?.getAttribute('href')?.trim();
    return href && !isTargetValue(href);
  });
  const ctaTargetRow = rows.find((row) => {
    const href = getAnchor(row)?.getAttribute('href')?.trim();
    return isTargetValue(href) || isTargetValue(row.textContent);
  });
  let row = rows[CONFIG_FIELD_POSITIONS[propName]];

  if (propName === 'gridCta_linkText') row = rows[2] || ctaLinkRow;
  if (propName === 'gridCta_link') row = ctaLinkRow || rows[3];
  if (propName === 'gridCta_linkTarget') row = ctaTargetRow || rows[4];

  const cells = getCells(row);
  return cells[cells.length - 1] || null;
}

function getConfigValue(block, propName, legacyAttr) {
  const field = getConfigField(block, propName, legacyAttr);
  if (field) return field.textContent?.trim() || '';

  const legacyValue = block.getAttribute(legacyAttr);
  return legacyValue?.trim() || '';
}

function getConfigHref(block, propName, legacyAttr) {
  const field = getConfigField(block, propName, legacyAttr);
  const legacyValue = block.getAttribute(legacyAttr);
  const hrefValue = getAnchor(field)?.getAttribute('href')?.trim();
  const textValue = field?.textContent?.trim();
  return (isTargetValue(hrefValue) ? '' : hrefValue)
    || legacyValue?.trim()
    || (isTargetValue(textValue) ? '' : textValue)
    || '';
}

function normalizeTarget(value) {
  return `${value || ''}`.trim().toLowerCase() === '_blank' ? '_blank' : '_self';
}

function getCtaConfig(block) {
  const field = getConfigField(block, 'gridCta_linkTarget', 'data-cta-link-target');
  const anchor = getAnchor(field);
  const target = anchor?.getAttribute('target')
    || getConfigValue(block, 'gridCta_linkTarget', 'data-cta-link-target');

  return {
    href: getConfigHref(block, 'gridCta_link', 'data-cta-link'),
    target: normalizeTarget(target),
    text: getConfigValue(block, 'gridCta_linkText', 'data-cta-link-text'),
  };
}

function hideSourceRows(rows) {
  rows.forEach((row) => {
    row.classList.add('recommended-dynamic-hotels-grid-source');
    row.setAttribute('aria-hidden', 'true');
  });
}

function isAuthoringPage(block) {
  return Boolean(block.closest('[data-aue-resource]') || document.querySelector('[data-aue-resource]'));
}

function getText(field) {
  return field?.textContent?.trim() || '';
}

function isDebugEnabled() {
  const query = new URLSearchParams(window.location.search).get('hotel-api-debug');
  return query === '1' || query?.toLowerCase() === 'true';
}

function getLocaleSegment(pathname = window.location.pathname) {
  const segments = `${pathname || ''}`.split('/').filter(Boolean);
  const segment = segments.find((item) => /^[a-z]{2}-[a-z]{2}$/i.test(item));
  return segment ? segment.toLowerCase() : '';
}

function createHotelHref(hotel) {
  if (!hotel?.slug) return '';
  const localeSegment = getLocaleSegment();
  const slug = `${hotel.slug}`.split('/').filter(Boolean).join('/').replace(/\.html$/i, '');
  if (!slug) return '';

  const path = localeSegment
    ? `/${localeSegment}/hotels/${slug}.html`
    : `/hotels/${slug}.html`;
  const publicHost = getHotelsPublicHost();

  return publicHost ? `${publicHost}${path}` : path;
}

function getItemHref(row) {
  const linkProp = row.querySelector('[data-aue-prop="cta_link"]');
  const link = getAnchor(linkProp);
  const href = link?.getAttribute('href')?.trim();
  const text = getText(linkProp);
  if (href && !isTargetValue(href)) return href;
  if (text && !isTargetValue(text)) return text;

  const cells = getCells(row);
  const fallback = cells
    .map((cell) => getAnchor(cell)?.getAttribute('href')?.trim() || getText(cell))
    .find((value) => {
      const normalized = `${value || ''}`.trim();
      return normalized
        && !isTargetValue(normalized)
        && (normalized.startsWith('/') || /^https?:\/\//i.test(normalized));
    });

  return fallback || '';
}

function getItemTarget(row) {
  const targetProp = row.querySelector('[data-aue-prop="cta_linkTarget"]');
  const link = getAnchor(targetProp);
  const target = link?.getAttribute('target') || getText(targetProp);
  return normalizeTarget(target);
}

function getHotelCodes(block) {
  const rows = getSourceRows(block);
  const configRows = new Set(getConfigRows(block));
  const itemRows = rows.filter((row) => !configRows.has(row));

  return itemRows
    .map((row) => {
      const hotelCodeProp = row.querySelector('[data-aue-prop="hotelCode"]');
      const destinationProp = row.querySelector('[data-aue-prop="destination"]');
      const tagLabelProp = row.querySelector('[data-aue-prop="tag_tagLabel"]');
      const cells = getCells(row);
      const authoredHotelCode = getText(hotelCodeProp || row.querySelector('[data-hotel-code]'));
      const positionalHotelCode = getText(cells[0]);
      const hotelCode = authoredHotelCode || positionalHotelCode;
      const destination = getText(destinationProp || row.querySelector('[data-destination]') || getCells(row)[1]);
      const tagLabel = getText(tagLabelProp || getCells(row)[4]);
      const href = getItemHref(row);
      const target = getItemTarget(row);
      const normalizedHotelCode = `${hotelCode || ''}`.trim();

      if (normalizedHotelCode && !isValidHotelCode(normalizedHotelCode)) {
        // eslint-disable-next-line no-console
        console.warn('[hotels-api] Invalid hotelCode, skipping hotel fetch', {
          hotelCode: normalizedHotelCode,
        });
      }

      return {
        destination: destination.trim(),
        href: href.trim(),
        hotelCode: normalizedHotelCode,
        source: row,
        target,
        tagLabel: tagLabel.trim(),
      };
    })
    .filter(({ hotelCode }) => isValidHotelCode(hotelCode));
}

function createNavButton(direction, label) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = `recommended-dynamic-hotels-${direction}`;
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
    dot.className = 'recommended-dynamic-hotels-dot';
    dot.classList.toggle('active', index === activePage);
    dot.setAttribute('aria-label', `${label} ${index + 1}`);
    dot.setAttribute('aria-current', index === activePage ? 'true' : 'false');
    dot.addEventListener('click', () => onSelect(index));
    container.append(dot);
  });
}

function createDesktopControls(labels) {
  const controls = document.createElement('div');
  controls.className = 'recommended-dynamic-hotels-pagination';

  const status = document.createElement('span');
  status.className = 'recommended-dynamic-hotels-status';
  status.setAttribute('aria-live', 'polite');

  const buttons = document.createElement('div');
  buttons.className = 'recommended-dynamic-hotels-pagination-buttons';
  buttons.append(
    createNavButton('prev', labels.previous),
    createNavButton('next', labels.next),
  );

  controls.append(status, buttons);
  return controls;
}

function createMobileControls(labels) {
  const controls = document.createElement('div');
  controls.className = 'recommended-dynamic-hotels-mobile-controls';

  const dots = document.createElement('div');
  dots.className = 'recommended-dynamic-hotels-dots';

  controls.append(
    createNavButton('prev', labels.previous),
    dots,
    createNavButton('next', labels.next),
  );
  return controls;
}

function setupSlider(list, desktopControls, mobileControls, labels) {
  const items = [...list.children];
  const desktopStatus = desktopControls.querySelector('.recommended-dynamic-hotels-status');
  const desktopPrev = desktopControls.querySelector('.recommended-dynamic-hotels-prev');
  const desktopNext = desktopControls.querySelector('.recommended-dynamic-hotels-next');
  const mobilePrev = mobileControls.querySelector('.recommended-dynamic-hotels-prev');
  const mobileNext = mobileControls.querySelector('.recommended-dynamic-hotels-next');
  const dots = mobileControls.querySelector('.recommended-dynamic-hotels-dots');
  let frame = 0;
  let currentIndex = 0;
  let visibleCount = DEFAULT_VISIBLE_COUNT;

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

function createHeader(labels) {
  const header = document.createElement('div');
  header.className = 'recommended-dynamic-hotels-grid-header';

  const copy = document.createElement('div');
  copy.className = 'recommended-dynamic-hotels-grid-copy';

  const eyebrow = document.createElement('p');
  eyebrow.className = 'recommended-dynamic-hotels-grid-eyebrow';
  eyebrow.textContent = labels.eyebrow;

  const title = document.createElement('h2');
  title.className = 'recommended-dynamic-hotels-grid-title';
  title.textContent = labels.title;

  copy.append(eyebrow, title);
  if (labels.cta.text && labels.cta.href) {
    const cta = document.createElement('a');
    cta.className = 'recommended-dynamic-hotels-grid-cta';
    cta.href = toPageHref(labels.cta.href);
    cta.textContent = labels.cta.text;
    if (labels.cta.target === '_blank') {
      cta.target = '_blank';
      cta.rel = 'noopener noreferrer';
    }
    copy.append(cta);
  }
  header.append(copy);
  return header;
}

function createEmptyState(message) {
  const empty = document.createElement('p');
  empty.className = 'recommended-dynamic-hotels-grid-empty';
  empty.textContent = message;
  return empty;
}

function createList(entries, labels) {
  const list = document.createElement('ul');
  list.className = 'recommended-dynamic-hotels-list';
  list.setAttribute('aria-label', labels.carousel);
  list.tabIndex = 0;

  entries.forEach(({ hotelData, source, analytics }) => {
    const card = createHotelMiniCard(hotelData, 'vertical');
    const item = document.createElement('li');
    item.className = 'recommended-dynamic-hotels-item';

    if (analytics?.hotelCode) item.dataset.analyticsHotelCode = analytics.hotelCode;
    if (analytics?.stars) item.dataset.analyticsStars = `${analytics.stars}`;
    if (analytics?.continent) item.dataset.analyticsContinent = analytics.continent;
    if (analytics?.country) item.dataset.analyticsCountry = analytics.country;
    if (analytics?.brand) item.dataset.analyticsBrand = analytics.brand;
    if (analytics?.category) item.dataset.analyticsCategory = analytics.category;
    if (analytics?.subcategory) item.dataset.analyticsSubcategory = analytics.subcategory;
    if (analytics?.segment) item.dataset.analyticsSegment = analytics.segment;
    if (analytics?.subsegment) item.dataset.analyticsSubsegment = analytics.subsegment;
    if (analytics?.onlyAdults) item.dataset.analyticsOnlyAdults = analytics.onlyAdults;
    if (analytics?.headquarter) item.dataset.analyticsHeadquarter = analytics.headquarter;
    if (analytics?.countryCode) item.dataset.analyticsCountryCode = analytics.countryCode;
    if (analytics?.area) item.dataset.analyticsArea = analytics.area;
    if (analytics?.zone) item.dataset.analyticsZone = analytics.zone;
    if (analytics?.city) item.dataset.analyticsCity = analytics.city;

    if (source) {
      moveInstrumentation(source, item);
      source.classList.add('recommended-dynamic-hotels-grid-source');
      source.setAttribute('aria-hidden', 'true');
      item.append(source);
    }

    item.append(card);
    list.append(item);
  });

  return list;
}

export default async function decorate(block) {
  initHotelPriceLiveUpdate();
  const existing = block.querySelector(':scope > .recommended-dynamic-hotels-grid-rendered');
  if (existing) {
    existing.sliderCleanup?.();
    existing.querySelectorAll('.recommended-dynamic-hotels-grid-source').forEach((row) => {
      row.classList.remove('recommended-dynamic-hotels-grid-source');
      row.removeAttribute('aria-hidden');
      block.insertBefore(row, existing);
    });
    existing.remove();
  }

  const [
    carousel,
    previous,
    next,
    goTo,
    of,
  ] = await Promise.all([
    getPlaceholder('hotelsCarousel', 'Recommended hotels'),
    getPlaceholder('carouselPrevious', 'Previous hotels'),
    getPlaceholder('carouselNext', 'Next hotels'),
    getPlaceholder('carouselGoTo', 'Go to hotel group'),
    getPlaceholder('carouselOf', 'of'),
  ]);

  const labels = {
    carousel,
    cta: getCtaConfig(block),
    eyebrow: getConfigValue(block, 'eyebrow', 'data-eyebrow'),
    goTo,
    next,
    of,
    previous,
    title: getConfigValue(block, 'title', 'data-title'),
  };

  const hotelCodesToFetch = getHotelCodes(block);

  if (isDebugEnabled()) {
    // eslint-disable-next-line no-console
    console.info('[recommended-dynamic-hotels-grid] Parsed hotel codes', {
      count: hotelCodesToFetch.length,
      codes: hotelCodesToFetch.map(({ hotelCode }) => hotelCode),
    });
  }

  const rendered = document.createElement('div');
  rendered.className = 'recommended-dynamic-hotels-grid-rendered';

  const header = createHeader(labels);
  const desktopControls = createDesktopControls(labels);
  header.append(desktopControls);
  rendered.append(header);

  if (!hotelCodesToFetch.length) {
    if (isAuthoringPage(block)) {
      rendered.append(createEmptyState('Add hotel codes to load hotels from GraphQL.'));
    }
    block.append(rendered);
    return;
  }

  const fetchPromises = hotelCodesToFetch.map(
    ({
      hotelCode,
      destination,
      href,
      source,
      tagLabel,
      target,
    }) => Promise.all([
      fetchHotelByCode(hotelCode),
      fetchHotelPriceByCode(hotelCode),
    ])
      .then(async ([hotel, price]) => {
        if (!hotel) return null;
        const hotelWithPrice = price
          ? { ...hotel, estimatedMinPrice: price.priceFrom, estimatedMinCurrency: price.currency }
          : hotel;
        const priceData = await getHotelPriceData(hotelWithPrice, hotelCode, price);
        const fallbackHref = createHotelHref(hotel);
        return {
          hotelData: {
            ctaText: '',
            href: href || fallbackHref,
            image: hotel.image || '',
            imageAlt: hotel.title || '',
            location: destination || hotel.destination || '',
            name: hotel.title || '',
            priceFrom: priceData?.text || '',
            priceData,
            stars: hotel.stars || 0,
            tagLabel: tagLabel || '',
            target,
          },
          analytics: {
            hotelCode,
            stars: hotel.stars || '',
            continent: hotel.continent || '',
            country: hotel.country || '',
            brand: hotel.brand || '',
            category: hotel.category || '',
            subcategory: hotel.subcategory || '',
            segment: hotel.segment || '',
            subsegment: hotel.subsegment || '',
            onlyAdults: hotel.isOnlyAdults == null ? '' : `${hotel.isOnlyAdults}`,
            headquarter: hotel.headquarter || '',
            countryCode: hotel.countryCode || '',
            area: hotel.area || '',
            zone: hotel.zone || '',
            city: hotel.city || '',
          },
          source,
        };
      })
      .catch(() => null),
  );

  const hotelEntries = await Promise.all(fetchPromises);
  const validHotels = hotelEntries.filter(Boolean);

  if (!validHotels.length) {
    if (isAuthoringPage(block)) {
      rendered.append(createEmptyState('No hotels found for the provided codes.'));
    }
    block.append(rendered);
    return;
  }

  const list = createList(validHotels, labels);
  const mobileControls = createMobileControls(labels);
  rendered.append(list, mobileControls);
  rendered.sliderCleanup = setupSlider(list, desktopControls, mobileControls, labels);

  hideSourceRows(getSourceRows(block));
  block.append(rendered);
}
