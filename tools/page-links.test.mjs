/* eslint-env node */
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createContext, SourceTextModule } from 'node:vm';
import test from 'node:test';

const ROOT = fileURLToPath(new URL('../', import.meta.url));
const AUTHOR = 'https://author-p179213-e1886364.adobeaemcloud.com';
const LOCALES = ['es-es', 'de-de', 'pt-br', 'en-us', 'en-gb', 'fr-fr'];
const TYPES = { article: 'articles', category: 'category', tag: 'tag' };
const SLUG = 'los-mejores-atardeceres-alrededor-del-mundo';

async function load(entry, href, { document = {}, fetch, stubs = {} } = {}) {
  const context = createContext({
    URL,
    URLSearchParams,
    console,
    window: { location: new URL(href) },
    document: { querySelector: () => null, ...document },
    fetch,
  });
  const modules = new Map();
  async function loadModule(path) {
    if (modules.has(path)) return modules.get(path);
    const source = stubs[path] ?? await readFile(path, 'utf8');
    const module = new SourceTextModule(source, { context, identifier: path });
    modules.set(path, module);
    await module.link((specifier, parent) => (
      loadModule(resolve(dirname(parent.identifier), specifier))
    ));
    return module;
  }
  const module = await loadModule(resolve(ROOT, entry));
  await module.evaluate();
  return module.namespace;
}

function loadLinks(href, options) {
  return load('scripts/iberostar/page-links.js', href, options);
}

test('Confirmed article failure resolves to the real Author resource', async () => {
  const links = await loadLinks(`${AUTHOR}/content/inspiration-guide/es-es/inspiration-guide.html`);
  assert.equal(
    links.toPageHref(`/es-es/inspiration-guide/${SLUG}`, { pageType: 'article' }),
    `/content/inspiration-guide/es-es/inspiration-guide/articles/${SLUG}.html`,
  );
});

test('Explicit destination types resolve all six locales, including nested categories', async () => {
  await Promise.all(LOCALES.map(async (locale) => {
    const links = await loadLinks(`${AUTHOR}/${locale}/inspiration-guide/`);
    Object.entries(TYPES).forEach(([pageType, segment]) => {
      const suffix = pageType === 'category' ? 'destinos/playas' : 'shared-slug';
      const path = `/${locale}/inspiration-guide/${suffix}`;
      assert.equal(
        links.toPageHref(`${path}?wcmmode=disabled#title`, { pageType }),
        `/content/inspiration-guide/${locale}/inspiration-guide/${segment}/${suffix}.html?wcmmode=disabled#title`,
      );
    });
  }));
});

test('Real resource metadata takes precedence over content type and slug', async () => {
  const links = await loadLinks(`${AUTHOR}/es-es/inspiration-guide/`);
  assert.equal(links.toPageHref('/es-es/inspiration-guide/public-slug?x=1#title', {
    pageType: 'article',
    resourcePath: 'urn:aemconnection:/content/inspiration-guide/es-es/inspiration-guide/articles/NombreOriginal/jcr:content/root/section',
  }), '/content/inspiration-guide/es-es/inspiration-guide/articles/NombreOriginal.html?x=1#title');
});

test('Explicit Author references and already-structural paths remain idempotent', async () => {
  const links = await loadLinks(`${AUTHOR}/content/inspiration-guide/es-es/inspiration-guide.html`);
  Object.entries(TYPES).forEach(([pageType, segment]) => {
    const path = `/content/inspiration-guide/es-es/inspiration-guide/${segment}/slug.html?x=1#title`;
    assert.equal(links.toPageHref(path, { pageType }), path);
    assert.equal(links.toPageHref(links.toPageHref(path, { pageType })), path);
    assert.equal(
      links.toPageHref(`/es-es/inspiration-guide/${segment}/slug`, { pageType }),
      `/content/inspiration-guide/es-es/inspiration-guide/${segment}/slug.html`,
    );
  });
});

test('Preview, live, localhost and public domains never gain Author routing', async () => {
  await Promise.all([
    'https://main--inspiration-guide--iberostar-com.aem.page',
    'https://main--inspiration-guide--iberostar-com.aem.live',
    'https://www.iberostar.com',
    'http://localhost:3000',
  ].map(async (origin) => {
    const links = await loadLinks(`${origin}/es-es/inspiration-guide/`);
    Object.keys(TYPES).forEach((pageType) => {
      const path = `/es-es/inspiration-guide/${SLUG}?x=1#title`;
      assert.equal(links.toPageHref(path, {
        pageType,
        resourcePath: '/content/inspiration-guide/es-es/inspiration-guide/articles/internal',
      }), path);
    });
  }));
});

test('Unknown flattened destinations are never classified from their slug', async () => {
  const links = await loadLinks(`${AUTHOR}/es-es/inspiration-guide/`);
  ['hoteles', 'category', 'tag', SLUG].forEach((slug) => {
    const path = `/es-es/inspiration-guide/${slug}`;
    assert.equal(links.toPageHref(path), path);
  });
});

test('External, edit, DAM, fragment and non-HTTP links are unchanged', async () => {
  const links = await loadLinks(`${AUTHOR}/es-es/inspiration-guide/`);
  [
    'https://external.example/es-es/inspiration-guide/slug',
    'https://experience.adobe.com/#/aem/editor/canvas/slug',
    '/content/dam/inspiration-guide/image.jpg',
    '#title',
    'mailto:editor@example.com',
    'tel:123',
  ].forEach((href) => assert.equal(links.toPageHref(href, { pageType: 'article' }), href));
});

test('Tag chips resolve a public parent or a real authored parent without duplicate segments', async () => {
  const links = await loadLinks(`${AUTHOR}/es-es/inspiration-guide/`);
  const target = '/content/inspiration-guide/es-es/inspiration-guide/tag/travel.html';
  [
    '/es-es/inspiration-guide',
    `${AUTHOR}/es-es/inspiration-guide`,
    '/content/inspiration-guide/es-es/inspiration-guide/tag.html',
  ].forEach((parent) => assert.equal(links.appendPageSegment(parent, 'travel', { pageType: 'tag' }), target));
  const published = await loadLinks('https://www.iberostar.com/es-es/inspiration-guide/');
  assert.equal(
    published.appendPageSegment('/es-es/inspiration-guide', 'travel', { pageType: 'tag' }),
    '/es-es/inspiration-guide/travel',
  );
});

test('Home and guide roots use Author content paths without adding a content-type folder', async () => {
  const links = await loadLinks(`${AUTHOR}/es-es/inspiration-guide/`);
  ['/es-es', '/es-es/inspiration-guide/'].forEach((path) => {
    assert.equal(links.toPageHref(path), `/content/inspiration-guide${path.replace(/\/$/, '')}.html`);
  });
});

test('Repeated decoration preserves resolved href, UE attributes, target and SEO links', async () => {
  const links = await loadLinks(`${AUTHOR}/es-es/inspiration-guide/`);
  const href = links.toPageHref('/es-es/inspiration-guide/slug', { pageType: 'article' });
  const attributes = new Map([
    ['href', href],
    ['data-aue-resource', 'urn:aemconnection:/content/inspiration-guide/es-es/inspiration-guide/jcr:content/root/card'],
    ['target', '_blank'],
  ]);
  const anchor = {
    getAttribute: (name) => attributes.get(name),
    setAttribute: (name, value) => attributes.set(name, value),
  };
  const root = {
    querySelectorAll: (selector) => {
      assert.equal(selector, 'a[href]');
      return [anchor];
    },
  };
  links.decoratePageLinks(root);
  links.decoratePageLinks(root);
  assert.equal(attributes.get('href'), href);
  assert.equal(attributes.get('target'), '_blank');
  assert.ok(attributes.get('data-aue-resource').endsWith('/root/card'));
});

test('Shared article cards resolve article and category hrefs in Author, not Publish', async () => {
  await Promise.all([AUTHOR, 'https://www.iberostar.com'].map(async (origin) => {
    const cards = await load('scripts/iberostar/article-card.js', `${origin}/es-es/inspiration-guide/`, {
      stubs: {
        [resolve(ROOT, 'scripts/iberostar/media.js')]: 'export function createResponsiveImage() {}',
      },
    });
    const card = cards.normalizeArticleData({
      url: '/es-es/inspiration-guide/story',
      categoryUrl: '/es-es/inspiration-guide/destinos/playas',
    });
    const prefix = origin === AUTHOR ? '/content/inspiration-guide' : '';
    assert.equal(card.url, `${origin}${prefix}/es-es/inspiration-guide/${origin === AUTHOR ? 'articles/story.html' : 'story'}`);
    assert.equal(card.categoryUrl, `${origin}${prefix}/es-es/inspiration-guide/${origin === AUTHOR ? 'category/destinos/playas.html' : 'destinos/playas'}`);
  }));
});

test('Rendered breadcrumbs and metadata fetches use real categories only in Author', async () => {
  await Promise.all([AUTHOR, 'https://www.iberostar.com'].map(async (origin) => {
    const requests = [];
    const metadata = {
      'page-type': 'article',
      'article-category-path': '/es-es/inspiration-guide/destinos/playas',
    };
    const element = (tagName) => ({
      tagName,
      children: [],
      append(...nodes) { this.children.push(...nodes); },
      setAttribute() {},
      querySelector: () => null,
    });
    const block = element('div');
    const breadcrumbs = await load('blocks/breadcrumbs/breadcrumbs.js', `${origin}/es-es/inspiration-guide/story`, {
      document: { title: 'Story', createElement: element },
      fetch: async (path) => {
        requests.push(path);
        return { ok: false };
      },
      stubs: {
        [resolve(ROOT, 'scripts/aem.js')]: `export const getMetadata = (name) => (${JSON.stringify(metadata)})[name] || '';`,
        [resolve(ROOT, 'scripts/iberostar/i18n.js')]: 'export const getTranslation = async (key, fallback) => fallback;',
      },
    });
    await breadcrumbs.default(block);
    const expectedRoot = origin === AUTHOR
      ? '/content/inspiration-guide/es-es/inspiration-guide/category'
      : '/es-es/inspiration-guide';
    const extension = origin === AUTHOR ? '.html' : '';
    assert.deepEqual(requests, [
      `${expectedRoot}/destinos${extension}`,
      `${expectedRoot}/destinos/playas${extension}`,
    ]);
    const nav = block.children[0];
    assert.equal(nav.children[0].href, `${expectedRoot}/destinos/playas${extension}`);
    const list = nav.children[1];
    assert.equal(list.children[2].children[0].href, `${expectedRoot}/destinos${extension}`);
  }));
});

test('Article JSON keeps the real resource path alongside its public URL', async () => {
  const resourcePath = '/content/inspiration-guide/es-es/inspiration-guide/articles/NombreOriginal';
  const data = await load('scripts/inspiration-data.js', `${AUTHOR}/es-es/inspiration-guide/?aem-data-url=/articles.json`, {
    fetch: async () => ({
      ok: true,
      json: async () => ({
        items: [{ title: 'Story', slug: 'story', resourcePath }],
      }),
    }),
  });
  const [article] = await data.getArticles();
  assert.equal(article.url, '/es-es/inspiration-guide/story');
  assert.equal(article.resourcePath, resourcePath);
  const links = await loadLinks(`${AUTHOR}/es-es/inspiration-guide/`);
  assert.equal(
    links.toPageHref(article.url, { pageType: 'article', resourcePath: article.resourcePath }),
    `${resourcePath}.html`,
  );
});
