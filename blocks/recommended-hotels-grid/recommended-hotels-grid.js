import {
  createHotelMiniCard,
  readHotelData,
} from '../hotel-mini-card/hotel-mini-card.js';
import { getTranslation } from '../../scripts/iberostar/i18n.js';

const DEFAULT_VISIBLE_COUNT = 4;

function getSourceRows(block) {
  return [...block.children]
    .filter((child) => !child.classList.contains('recommended-hotels-grid-rendered'));
}

function hasConfigFields(row) {
  return Boolean(row.querySelector?.(
    '[data-aue-prop="eyebrow"], [data-aue-prop="title"], [data-aue-prop="cta_link"], [data-aue-prop="maxItems"], [data-aue-prop="cta_maxItems"], [data-aue-prop="hotels"]',
  ));
}

function hideSourceRows(rows) {
  rows.forEach((row) => {
    row.classList.add('recommended-hotels-grid-source');
    row.setAttribute('aria-hidden', 'true');
  });
}

function copyAueAttributes(from, to) {
  [...from.attributes]
    .filter(({ name }) => name.startsWith('data-aue-') || name.startsWith('data-richtext-'))
    .forEach(({ name, value }) => {
      to.setAttribute(name, value);
    });
}

function isAuthoringPage(block) {
  return Boolean(block.closest('[data-aue-resource]') || document.querySelector('[data-aue-resource]'));
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

function getAuthoredHotels(block) {
  const rows = getSourceRows(block);
  const itemRows = rows.filter((row) => !hasConfigFields(row));
  const hotels = itemRows
    .map((row, index) => {
      const hotel = readHotelData(row, 'vertical');
      const hasContent = hotel.image || hotel.name || hotel.href
        || hotel.location || hotel.priceFrom;
      if (hasContent) return { hotel, source: row };
      if (isAuthoringPage(block)) return { hotel: createPlaceholderHotel(index), source: row };
      return null;
    })
    .filter(Boolean);

  return {
    hotels,
    sourceRows: rows,
  };
}

function createNavButton(direction, label) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = `recommended-hotels-${direction}`;
  button.setAttribute('aria-label', label);
  button.innerHTML = '<span aria-hidden="true"></span>';
  return button;
}

function createHeader(labels) {
  const header = document.createElement('div');
  header.className = 'recommended-hotels-grid-header';

  const copy = document.createElement('div');
  copy.className = 'recommended-hotels-grid-copy';

  const eyebrow = document.createElement('p');
  eyebrow.className = 'recommended-hotels-grid-eyebrow';
  eyebrow.textContent = labels.eyebrow;

  const title = document.createElement('h2');
  title.className = 'recommended-hotels-grid-title';
  title.textContent = labels.title;

  copy.append(eyebrow, title);
  header.append(copy);
  return header;
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
    dot.className = 'recommended-hotels-dot';
    dot.classList.toggle('active', index === activePage);
    dot.setAttribute('aria-label', `${label} ${index + 1}`);
    dot.setAttribute('aria-current', index === activePage ? 'true' : 'false');
    dot.addEventListener('click', () => onSelect(index));
    container.append(dot);
  });
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

async function getLabels() {
  const [
    carousel,
    previous,
    next,
    goTo,
    of,
    eyebrow,
    title,
  ] = await Promise.all([
    getTranslation('hotelsCarousel', 'Recommended hotels'),
    getTranslation('carouselPrevious', 'Previous hotels'),
    getTranslation('carouselNext', 'Next hotels'),
    getTranslation('carouselGoTo', 'Go to hotel group'),
    getTranslation('carouselOf', 'of'),
    getTranslation('recommendedHotelsEyebrow', 'Hoteles mencionados en el artículo'),
    getTranslation('recommendedHotelsTitle', 'Hoteles recomendados'),
  ]);

  return {
    carousel,
    eyebrow,
    goTo,
    next,
    of,
    previous,
    title,
  };
}

export default async function decorate(block) {
  const existing = block.querySelector(':scope > .recommended-hotels-grid-rendered');
  existing?.sliderCleanup?.();
  existing?.remove();

  const { hotels, sourceRows } = getAuthoredHotels(block);
  const labels = await getLabels();

  const wrapper = document.createElement('div');
  wrapper.className = 'recommended-hotels-grid-rendered';

  const header = createHeader(labels);
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
    copyAueAttributes(source, li);
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
}
