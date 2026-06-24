# Inspiration Guide Site Structure

## AEM Content Structure

Recommended public path structure for the microsite:

```text
/inspiration-guide/
  /nav
  /footer
  /home
  /category/
    /beach
    /city
    /family
  /tag/
    /wellness
    /gastronomy
    /sustainability
  /article/
    /best-beaches-in-mallorca
    /family-hotels-in-riviera-maya
```

If the project is mapped from AEM Author, the author-side source pages should resolve to these public paths through the normal EDS authoring path mapping.

## Required EDS Pages / Fragments

- `/inspiration-guide/nav`
  - dedicated fragment page for the microsite header
  - consumed by `blocks/header/header.js`
- `/inspiration-guide/footer`
  - dedicated fragment page for the microsite footer
  - consumed by `blocks/footer/footer.js`
- `/inspiration-guide/home`
  - Home page
- `/inspiration-guide/category/{slug}`
  - Category landing pages
- `/inspiration-guide/tag/{slug}`
  - Tag landing pages
- `/inspiration-guide/article/{slug}`
  - Article detail pages

## Required Page Metadata

Each microsite page should expose these metadata values:

- `nav`
  - recommended value: `/inspiration-guide/nav`
- `footer`
  - recommended value: `/inspiration-guide/footer`
- `page-type`
  - one of: `home`, `category`, `tag`, `article`, `fragment`
- `inspiration-data-mode`
  - `mock` during scaffold/prototype
  - `aem` when JSON/index endpoints are ready
- `inspiration-aem-data-url`
  - optional page-level data endpoint override

These fields are now available in [`models/_page.json`](/Users/josuerodriguez/aem/projects/p84-grscms-eds-inspiration-guide/models/_page.json).

## Header Fragment Authoring Shape

Recommended content shape for `/inspiration-guide/nav`:

1. Brand section
   - add one `header-brand` block
   - fields:
     - logo
     - logo alt
     - link
     - fallback label
2. Main navigation section
   - one top-level `ul`
   - each top-level item may contain:
     - parent link
     - nested `ul`
     - first nested item can be `Ver todos`
3. Utility blocks
   - `nav-hotels`
     - use for `Volver a Iberostar`
   - `nav-language`
     - current language + language options
   - `nav-search`
     - optional, only if search is part of the microsite scope

Important when authoring `/nav` and `/footer`:

- set `page-type = fragment`
- this prevents the global `header` and `footer` shell from being loaded while you edit the fragment page itself

## Footer Fragment Authoring Shape

Recommended content shape for `/inspiration-guide/footer`:

1. Brand / intro section
   - logo
   - descriptive copy
2. Footer links section
   - legal links
   - corporate links
   - editorial/microsite links
3. Meta section
   - copyright
   - locale/language notes
   - optional social links

## Required Repo Files

Global shell:

- [`blocks/header/header.js`](/Users/josuerodriguez/aem/projects/p84-grscms-eds-inspiration-guide/blocks/header/header.js)
- [`blocks/header/header.css`](/Users/josuerodriguez/aem/projects/p84-grscms-eds-inspiration-guide/blocks/header/header.css)
- [`blocks/footer/footer.js`](/Users/josuerodriguez/aem/projects/p84-grscms-eds-inspiration-guide/blocks/footer/footer.js)
- [`blocks/footer/footer.css`](/Users/josuerodriguez/aem/projects/p84-grscms-eds-inspiration-guide/blocks/footer/footer.css)
- [`models/_page.json`](/Users/josuerodriguez/aem/projects/p84-grscms-eds-inspiration-guide/models/_page.json)

Current reusable nav utility blocks:

- [`blocks/nav-hotels/`](/Users/josuerodriguez/aem/projects/p84-grscms-eds-inspiration-guide/blocks/nav-hotels)
- [`blocks/nav-language/`](/Users/josuerodriguez/aem/projects/p84-grscms-eds-inspiration-guide/blocks/nav-language)
- [`blocks/nav-search/`](/Users/josuerodriguez/aem/projects/p84-grscms-eds-inspiration-guide/blocks/nav-search)

Home blocks to evolve next:

- [`blocks/hero-blog/`](/Users/josuerodriguez/aem/projects/p84-grscms-eds-inspiration-guide/blocks/hero-blog)
- [`blocks/featured-articles/`](/Users/josuerodriguez/aem/projects/p84-grscms-eds-inspiration-guide/blocks/featured-articles)
- [`blocks/topic-tag-cloud/`](/Users/josuerodriguez/aem/projects/p84-grscms-eds-inspiration-guide/blocks/topic-tag-cloud)
- [`blocks/carousel-category-gallery/`](/Users/josuerodriguez/aem/projects/p84-grscms-eds-inspiration-guide/blocks/carousel-category-gallery)
- [`blocks/editorial-highlight-grid/`](/Users/josuerodriguez/aem/projects/p84-grscms-eds-inspiration-guide/blocks/editorial-highlight-grid)
- [`blocks/grid-category-gallery/`](/Users/josuerodriguez/aem/projects/p84-grscms-eds-inspiration-guide/blocks/grid-category-gallery)
- [`blocks/lead-subscription-form/`](/Users/josuerodriguez/aem/projects/p84-grscms-eds-inspiration-guide/blocks/lead-subscription-form)

## Local Draft Files

For local development without authored content, keep draft pages under:

```text
drafts/inspiration-guide/
  nav.plain.html
  footer.plain.html
  home.plain.html
```

The `nav` and `footer` draft fragments are enough to start validating the shell locally while the AEM-authored pages are being prepared.
