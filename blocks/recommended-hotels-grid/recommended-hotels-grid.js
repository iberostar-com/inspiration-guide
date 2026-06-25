import { createResponsiveImage } from '../../scripts/iberostar/media.js';

const MOCK_HOTELS = [
  {
    id: 'hotel-001',
    name: 'Iberostar Playa Azul',
    destination: 'playas',
    location: 'Caribe',
    priceFrom: '220 EUR',
    image: 'https://picsum.photos/seed/hotel-001/1200/800',
    href: '#',
  },
  {
    id: 'hotel-002',
    name: 'Iberostar Mountain Lodge',
    destination: 'montana',
    location: 'Pirineos',
    priceFrom: '180 EUR',
    image: 'https://picsum.photos/seed/hotel-002/1200/800',
    href: '#',
  },
  {
    id: 'hotel-003',
    name: 'Iberostar City Center',
    destination: 'ciudad',
    location: 'Madrid',
    priceFrom: '140 EUR',
    image: 'https://picsum.photos/seed/hotel-003/1200/800',
    href: '#',
  },
  {
    id: 'hotel-004',
    name: 'Iberostar Riviera',
    destination: 'playas',
    location: 'Cancun',
    priceFrom: '260 EUR',
    image: 'https://picsum.photos/seed/hotel-004/1200/800',
    href: '#',
  },
];

function getDestinationFromPath() {
  const parts = window.location.pathname.split('/').filter(Boolean);
  const categoryIdx = parts.indexOf('category');
  return categoryIdx > -1 ? parts[categoryIdx + 2] || '' : '';
}

function fromManualRows(block) {
  return [...block.children].map((row, index) => {
    const cells = [...row.children];
    return {
      id: `manual-hotel-${index + 1}`,
      name: cells[1]?.textContent?.trim() || `Hotel ${index + 1}`,
      location: cells[2]?.textContent?.trim() || '',
      priceFrom: cells[3]?.textContent?.trim() || '',
      image: cells[0]?.querySelector('img')?.src || '',
      href: cells[4]?.textContent?.trim() || '#',
    };
  });
}

function fromAutoDestination(maxItems) {
  const destination = getDestinationFromPath();
  return MOCK_HOTELS
    .filter((hotel) => !destination || hotel.destination === destination)
    .slice(0, maxItems);
}

function createHotelCard(hotel) {
  const li = document.createElement('li');
  li.className = 'recommended-hotels-item';

  const article = document.createElement('article');
  article.className = 'recommended-hotel-card';

  if (hotel.image) {
    const media = document.createElement('div');
    media.className = 'recommended-hotel-media';
    media.append(createResponsiveImage(hotel.image, hotel.name, false, [{ width: '750' }]));
    article.append(media);
  }

  const body = document.createElement('div');
  body.className = 'recommended-hotel-body';

  const h3 = document.createElement('h3');
  const a = document.createElement('a');
  a.href = hotel.href || '#';
  a.textContent = hotel.name;
  h3.append(a);

  body.append(h3);

  if (hotel.location) {
    const location = document.createElement('p');
    location.textContent = hotel.location;
    body.append(location);
  }

  if (hotel.priceFrom) {
    const price = document.createElement('p');
    price.className = 'recommended-hotel-price';
    price.textContent = `From ${hotel.priceFrom}`;
    body.append(price);
  }

  article.append(body);
  li.append(article);

  return li;
}

export default function decorate(block) {
  const mode = block.getAttribute('data-mode') || 'manual';
  const maxItems = Number.parseInt(block.getAttribute('data-max-items') || '12', 10);

  const items = mode === 'auto-destination'
    ? fromAutoDestination(maxItems)
    : fromManualRows(block).slice(0, maxItems);

  const wrapper = document.createElement('div');
  wrapper.className = 'recommended-hotels-grid';

  const list = document.createElement('ul');
  list.className = 'recommended-hotels-list';
  items.forEach((hotel) => list.append(createHotelCard(hotel)));

  wrapper.append(list);
  block.replaceChildren(wrapper);
}
