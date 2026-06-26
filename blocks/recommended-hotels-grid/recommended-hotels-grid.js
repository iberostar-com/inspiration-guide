import { createHotelMiniCard } from '../hotel-mini-card/hotel-mini-card.js';

const MOCK_HOTELS = [
  {
    id: 'hotel-001',
    name: 'Iberostar Waves Bouganville Playa',
    destination: 'playas',
    location: 'Costa Adeje, Tenerife',
    priceFrom: 'Desde 80 € 2 personas / noche',
    stars: 4,
    tagLabel: 'Tag Label',
    image: 'https://picsum.photos/seed/hotel-001/1200/1600',
    href: '#',
  },
  {
    id: 'hotel-002',
    name: 'Iberostar Selection Playa de Palma',
    destination: 'playas',
    location: 'Playa de Palma, Mallorca',
    priceFrom: 'Desde 182 € 2 personas / noche',
    stars: 5,
    image: 'https://picsum.photos/seed/hotel-002/1200/1600',
    href: '#',
  },
  {
    id: 'hotel-003',
    name: 'Iberostar Waves Playa de Muro',
    destination: 'playas',
    location: 'Playa de Muro, Mallorca',
    priceFrom: 'Desde 182 € 2 personas / noche',
    stars: 4,
    image: 'https://picsum.photos/seed/hotel-003/1200/1600',
    href: '#',
  },
  {
    id: 'hotel-004',
    name: 'Iberostar Riviera',
    destination: 'playas',
    location: 'Cancun',
    priceFrom: 'Desde 260 € 2 personas / noche',
    stars: 5,
    tagLabel: 'Tag Label',
    image: 'https://picsum.photos/seed/hotel-004/1200/1600',
    href: '#',
  },
];

const FIELD_ORDER = ['image', 'hotelName', 'location', 'stars', 'priceFrom', 'link', 'tagLabel'];

function getDestinationFromPath() {
  const parts = window.location.pathname.split('/').filter(Boolean);
  const categoryIdx = parts.indexOf('category');
  return categoryIdx > -1 ? parts[categoryIdx + 2] || '' : '';
}

function getCells(row) {
  if (!row) return [];
  if (row.children.length > 1) return [...row.children];

  const nested = [...(row.children[0]?.children || [])];
  return nested.length ? nested : [...row.children];
}

function getField(row, propName) {
  const selector = `[data-aue-prop="${propName}"]`;
  const byProp = row.matches?.(selector) ? row : row.querySelector?.(selector);
  if (byProp) return byProp;

  const index = FIELD_ORDER.indexOf(propName);
  return index > -1 ? getCells(row)[index] || null : null;
}

function getText(row, propName, fallback = '') {
  return getField(row, propName)?.textContent?.trim() || fallback;
}

function getHref(row, propName) {
  const field = getField(row, propName);
  return field?.querySelector?.('a[href]')?.getAttribute('href')?.trim()
    || field?.textContent?.trim()
    || '#';
}

function getImage(row) {
  const field = getField(row, 'image');
  return field?.querySelector?.('img')?.src
    || field?.querySelector?.('a[href]')?.getAttribute('href')?.trim()
    || '';
}

function normalizeStars(value) {
  const parsed = Number.parseInt(`${value || ''}`.replace(/[^\d]/g, ''), 10);
  if (Number.isNaN(parsed)) return 0;
  return Math.max(0, Math.min(parsed, 5));
}

function fromManualRows(block) {
  return [...block.children].map((row, index) => ({
    id: `manual-hotel-${index + 1}`,
    href: getHref(row, 'link'),
    image: getImage(row),
    imageAlt: getText(row, 'imageAlt', ''),
    location: getText(row, 'location', ''),
    name: getText(row, 'hotelName', `Hotel ${index + 1}`),
    priceFrom: getText(row, 'priceFrom', ''),
    stars: normalizeStars(getText(row, 'stars', '')),
    tagLabel: getText(row, 'tagLabel', ''),
    target: '_self',
  }));
}

function fromAutoDestination(maxItems) {
  const destination = getDestinationFromPath();
  return MOCK_HOTELS
    .filter((hotel) => !destination || hotel.destination === destination)
    .slice(0, maxItems)
    .map((hotel) => ({
      ...hotel,
      imageAlt: hotel.name,
      target: '_self',
    }));
}

export default function decorate(block) {
  const mode = block.getAttribute('data-mode') || 'manual';
  const maxItems = Number.parseInt(block.getAttribute('data-max-items') || '12', 10);

  const items = mode === 'auto-destination'
    ? fromAutoDestination(maxItems)
    : fromManualRows(block).slice(0, maxItems);

  const wrapper = document.createElement('div');
  wrapper.className = 'recommended-hotels-grid-rendered';

  const list = document.createElement('ul');
  list.className = 'recommended-hotels-list';

  items.forEach((hotel) => {
    const li = document.createElement('li');
    li.className = 'recommended-hotels-item';
    li.append(createHotelMiniCard(hotel, 'vertical'));
    list.append(li);
  });

  wrapper.append(list);
  block.replaceChildren(wrapper);
}
