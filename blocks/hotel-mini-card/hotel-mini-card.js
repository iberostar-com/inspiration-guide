import { createOptimizedPicture } from '../../scripts/aem.js';

export default function decorate(block) {
  const list = document.createElement('ul');
  list.className = 'hotel-mini-card-list';

  [...block.children].forEach((row, index) => {
    const cells = [...row.children];
    const image = cells[0]?.querySelector('img')?.src || '';
    const hotelName = cells[1]?.textContent?.trim() || `Hotel ${index + 1}`;
    const location = cells[2]?.textContent?.trim() || '';
    const priceFrom = cells[3]?.textContent?.trim() || '';
    const href = cells[4]?.textContent?.trim() || '#';

    const li = document.createElement('li');
    li.className = 'hotel-mini-card-item';

    const article = document.createElement('article');
    article.className = 'hotel-mini-card';

    if (image) {
      const media = document.createElement('div');
      media.className = 'hotel-mini-card-media';
      media.append(createOptimizedPicture(image, hotelName, false, [{ width: '750' }]));
      article.append(media);
    }

    const body = document.createElement('div');
    body.className = 'hotel-mini-card-body';

    const h3 = document.createElement('h3');
    const a = document.createElement('a');
    a.href = href;
    a.textContent = hotelName;
    h3.append(a);

    body.append(h3);

    if (location) {
      const p = document.createElement('p');
      p.className = 'hotel-mini-card-location';
      p.textContent = location;
      body.append(p);
    }

    if (priceFrom) {
      const price = document.createElement('p');
      price.className = 'hotel-mini-card-price';
      price.textContent = `From ${priceFrom}`;
      body.append(price);
    }

    article.append(body);
    li.append(article);
    list.append(li);
  });

  block.replaceChildren(list);
}
