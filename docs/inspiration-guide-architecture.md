# Inspiration Guide Architecture

## Scope

- Repo reviewed on branch `main`.
- `hero-blog` fixed in commit `fced0ed`.
- `npm run build:json` and `npm run lint` pass after the fix.
- The referenced Excel/PDF functional attachments were not available as physical files in this environment, so the proposal below is based on:
  - the current repo state,
  - the authored requirements from the prompt,
  - the current `.aem.page` and `.aem.live` output.

## Current Diagnosis

### Working

- `hero-blog` is registered correctly in:
  - `component-definition.json`
  - `component-models.json`
  - `component-filters.json`
- `models/_section.json` is the correct source for the `section` insertion filter.
- `blocks/hero-blog/_hero-blog.json` does not define a duplicate `section` filter.
- The repo already contains a substantial first pass of the microsite blocks:
  - `hero-blog`
  - `featured-articles`
  - `blog-split-list`
  - `topic-tag-cloud`
  - `carousel-category-gallery`
  - `editorial-highlight-grid`
  - `grid-category-gallery`
  - `lead-subscription-form`
  - `editorial-split-article`
  - `editorial-article-content`
  - `editorial-article-banner`
  - `editorial-article-grid`
  - `recommended-hotels-grid`
- Shared helpers already exist in `scripts/iberostar/`:
  - `article-card.js`
  - `date-format.js`
  - `url-builder.js`
- There is already a data abstraction in `scripts/inspiration-data.js` with `mock` and `aem` modes.

### Broken or Risky

- Many blocks still behave like prototypes and replace the full authored DOM with `block.replaceChildren(...)` or `block.textContent = ''`.
- That pattern is risky for Universal Editor because it discards or relocates `data-aue-*` instrumentation instead of preserving it.
- `hero-blog` was failing for a real structural reason: the delivered HTML groups all five fields inside one nested branch, but the JS assumed five direct rows.
- Several blocks read `data-*` attributes directly instead of reading authored source cells or `data-aue-prop`, so they are likely to drift from actual UE-authored markup.
- `scripts/inspiration-data.js` still falls back to mock content for articles, and `recommended-hotels-grid` still depends on inline mock hotel data.
- The current `hero` block contains variants (`tag`, `article`, `blog`) but its implementation is not author-safe yet and still rebuilds the DOM aggressively.
- The current `header` and `footer` are generic boilerplate fragment loaders, not yet a microsite-grade navigation and footer system.

### Environment Reality

- Preview content at `https://main--inspiration-guide--iberostar-com.aem.page/index.plain.html?cache=off` contains the full `hero-blog` source values:
  - icon
  - title
  - title heading
  - subtitle
  - subtitle heading
- Live output at `https://main--inspiration-guide--iberostar-com.aem.live/` still shows mostly boilerplate content, so the microsite is not yet structurally implemented end to end.

## Hero Blog Fix

### Root Cause

- The subtitle was not missing from authored content.
- The subtitle was present in `.aem.page` output.
- The bug was in `blocks/hero-blog/hero-blog.js`, which only used direct-row indexing as fallback.
- In the actual markup, the block is delivered as one outer row containing one inner cell with five child nodes.

### Applied Fix

- `hero-blog.js` now:
  - reads `data-aue-prop` first when present,
  - falls back to nested field extraction when the block is delivered as a single source branch,
  - keeps the source DOM and appends a rendered `.hero-blog-content`,
  - stays idempotent,
  - sanitizes heading tags,
  - avoids painting technical values as visible text,
  - forces the hero icon image to eager loading.
- `hero-blog.css` now:
  - uses white background,
  - keeps the source hidden with `.hero-blog-source`,
  - is mobile-first,
  - aligns icon/title vertically on small screens and horizontally from `600px`,
  - preserves uppercase subtitle styling in CSS.

## Proposed Repo Structure

```text
blocks/
  hero-blog/
  hero/
  featured-articles/
  blog-split-list/
  topic-tag-cloud/
  carousel-category-gallery/
  editorial-highlight-grid/
  grid-category-gallery/
  editorial-split-article/
  editorial-article-content/
  editorial-article-banner/
  editorial-article-grid/
  recommended-hotels-grid/
  lead-subscription-form/
  header/
  footer/
  nav-language/
  nav-search/
  nav-hotels/
scripts/
  inspiration-data.js
  iberostar/
    article-card.js
    authoring.js
    dom.js
    heading.js
    media.js
    links.js
    carousel.js
    date-format.js
    url-builder.js
models/
  _section.json
  _page.json
  _text.json
docs/
  inspiration-guide-architecture.md
```

### New Shared Helpers To Add

- `scripts/iberostar/authoring.js`
  - get source rows safely
  - read by `data-aue-prop`
  - nested fallback by index
  - hide source without removing instrumentation
- `scripts/iberostar/heading.js`
  - sanitize heading tags
  - normalize `Paragraph` to `p`
- `scripts/iberostar/media.js`
  - extract `picture/img/svg`
  - eager/lazy toggling
  - alt fallbacks
- `scripts/iberostar/links.js`
  - normalize internal/external links
  - target and rel helpers
- `scripts/iberostar/carousel.js`
  - reusable controls, pagination, drag, keyboard support

## Reuse Strategy

### Reuse As-Is With Refactor

- `scripts/iberostar/article-card.js`
  - keep as the base article card factory
  - extend for featured, grid, split, related variants
- `scripts/inspiration-data.js`
  - keep as the data gateway
  - replace mock-only assumptions with article/hotel providers
- `featured-articles`
  - keep as Home featured cluster
- `editorial-highlight-grid`
  - keep as the main multi-card listing block with pagination/load-more
- `topic-tag-cloud`
  - keep as the shared tag cloud block for Home, Category, Tag, Article
- `grid-category-gallery`
  - keep as the shared category discovery grid
- `lead-subscription-form`
  - keep as the newsletter capture block

### Reuse As Variants

- `hero`
  - refactor into a safe authoring implementation and use for:
    - category hero
    - tag hero
    - article detail hero
- `blog-split-list`
  - use for Home featured article list and Category filtered list
- `editorial-highlight-grid`
  - use variants for:
    - Home editorial grid
    - Category/Tag listing grid
- `recommended-hotels-grid`
  - keep one block with `manual` and future `auto-destination` / `auto-article-context`

### Keep Separate

- `hero-blog`
  - keep independent from `hero`
  - it has a different authored contract and visual layout
- `header`
  - keep as the global microsite shell because EDS already expects `header`
- `footer`
  - keep as the global microsite shell because EDS already expects `footer`

## Backlog By Priority

### Phase 1

- Stabilize authoring-safe helper layer in `scripts/iberostar/authoring.js`.
- Refactor `hero` to stop replacing the full source DOM.
- Keep `hero-blog` as completed baseline.
- Decide the microsite `header`/`footer` shell strategy.

### Phase 2

- Harden Home blocks:
  - `featured-articles`
  - `blog-split-list`
  - `topic-tag-cloud`
  - `carousel-category-gallery`
  - `editorial-highlight-grid`
  - `grid-category-gallery`
  - `lead-subscription-form`

### Phase 3

- Implement Category and Tag pages using variants and contextual data:
  - `hero` variant `blog` for category
  - `hero` variant `tag`
  - `blog-split-list` auto-category
  - `editorial-highlight-grid` auto-category / auto-tag
  - `topic-tag-cloud` manual + auto

### Phase 4

- Implement Article page:
  - `hero` variant `article`
  - `editorial-article-content`
  - `editorial-article-banner`
  - `recommended-hotels-grid`
  - `editorial-article-grid`

### Phase 5

- Replace mock data with AEM-driven sources.
- Define JSON contracts for:
  - article list/index
  - article detail metadata
  - hotel recommendations
  - tags/category aggregation
- Add auto modes only where the data contract is stable.

## Block Plan

### `hero-blog`

- Files:
  - existing `blocks/hero-blog/hero-blog.js`
  - existing `blocks/hero-blog/hero-blog.css`
  - existing `blocks/hero-blog/_hero-blog.json`
- Model:
  - keep current five fields
- Filters:
  - `section`
- Behavior:
  - source preserved, rendered overlay appended
- SEO/A11y:
  - sanitized heading levels
  - decorative icon with empty alt
- Dependencies:
  - future `authoring.js`, `heading.js`, `media.js`

### `hero`

- Files:
  - keep current block
  - refactor JS/CSS
  - update `_hero.json`
- Model:
  - keep `variant`
  - add explicit fields per variant instead of relying on positional assumptions only
  - add navigation items for category hero
- Filters:
  - `section`
- Behavior:
  - no full DOM replacement
  - preserve source and render variant layer
- SEO/A11y:
  - exactly one `h1` per page
  - real `nav` for subcategory/tag navigation
- Dependencies:
  - `authoring.js`, `heading.js`, `media.js`, `links.js`

### `featured-articles`

- Files:
  - existing block and item model
- Model:
  - keep block config + nested article item filter
- Filters:
  - `featured-articles`
  - `section`
- Behavior:
  - reuse `article-card.js`
  - stop full source replacement
- SEO/A11y:
  - section headings configurable
  - linked card titles
- Dependencies:
  - `article-card.js`, `authoring.js`, `links.js`

### `blog-split-list`

- Files:
  - existing block
- Model:
  - add heading fields and optional CTA fields
  - keep `mode` and `maxItems`
- Filters:
  - `section`
- Behavior:
  - manual mode first
  - auto-category from page context later
- SEO/A11y:
  - featured item as `article`
  - secondary items in semantic list
- Dependencies:
  - `article-card.js` or lightweight shared article teaser helper

### `topic-tag-cloud`

- Files:
  - existing block
- Model:
  - keep title, mode, max tags
  - add optional explicit tag items if manual mode needs URLs/targets
- Filters:
  - `section`
- Behavior:
  - manual tags first
  - auto-frequency/auto-category when data index is ready
- SEO/A11y:
  - real links
  - `aria-label` per chip
- Dependencies:
  - `inspiration-data.js`, `links.js`

### `editorial-highlight-grid`

- Files:
  - existing block
- Model:
  - keep source/pageSize/ctaLabel
  - add variant field: `home`, `listing`
- Filters:
  - `section`
- Behavior:
  - shared listing block with load-more
  - manual first, then auto category/tag
- SEO/A11y:
  - card list in `ul/li`
  - load-more as real button
- Dependencies:
  - `article-card.js`, `inspiration-data.js`

### `grid-category-gallery`

- Files:
  - existing block + nested item model
- Model:
  - keep current header fields and card items
- Filters:
  - `grid-category-gallery`
  - `section`
- Behavior:
  - preserve source row instrumentation on each card
- SEO/A11y:
  - each card title and subtitle linked correctly
- Dependencies:
  - `authoring.js`, `media.js`, `links.js`

### `carousel-category-gallery`

- Files:
  - existing block
- Model:
  - keep nested cards or align with `grid-category-gallery` item shape
- Filters:
  - `section`
- Behavior:
  - shared carousel helper
- SEO/A11y:
  - buttons for prev/next
  - keyboard support
- Dependencies:
  - `carousel.js`, `media.js`, `links.js`

### `lead-subscription-form`

- Files:
  - existing block
- Model:
  - keep title, description, legal, background
  - add endpoint/config fields only if required by real integration
- Filters:
  - `section`
- Behavior:
  - preserve authored legal content
  - integrate with real newsletter endpoint later
- SEO/A11y:
  - labelled email input
  - required checkbox
- Dependencies:
  - `links.js`

### `editorial-split-article`

- Files:
  - existing block
- Model:
  - keep eyebrow/title/summary/link
  - add image alt and heading level
- Filters:
  - `section`
- Behavior:
  - use shared article teaser rendering
- SEO/A11y:
  - semantic article teaser with heading
- Dependencies:
  - `article-card.js` or `media.js`

### `editorial-article-content`

- Files:
  - existing block
- Model:
  - keep title/layout
  - optionally add TOC enablement later
- Filters:
  - `section`
- Behavior:
  - preserve rich text source
  - avoid flattening authored semantics
- SEO/A11y:
  - keep native headings, lists, quotes, tables
- Dependencies:
  - `authoring.js`

### `editorial-article-banner`

- Files:
  - existing block
- Model:
  - keep title, description, linkText, link
  - add variant field if needed for hotel promo vs editorial promo
- Filters:
  - `section`
- Behavior:
  - simple sticky/sidebar CTA block
- SEO/A11y:
  - single clear CTA
- Dependencies:
  - `links.js`

### `editorial-article-grid`

- Files:
  - existing block
- Model:
  - keep mode/sort/maxItems
  - add block title field
- Filters:
  - `section`
- Behavior:
  - related/latest listings
  - auto by tag/category first, article-context later
- SEO/A11y:
  - semantic list of related articles
- Dependencies:
  - `article-card.js`, `inspiration-data.js`

### `recommended-hotels-grid`

- Files:
  - existing block
- Model:
  - keep title/mode/maxItems
  - add optional source selector for article tags/destination context
- Filters:
  - `section`
- Behavior:
  - manual first
  - later resolve via hotel index and article/category context
- SEO/A11y:
  - cards as links
  - price treated as supplemental, not heading content
- Dependencies:
  - future hotel data provider

### `header`

- Files:
  - keep current `blocks/header/header.js`
  - likely add/update supporting nav blocks
- Model:
  - fragment-driven or nested navigation item strategy
- Filters:
  - global shell, not inserted in section flow
- Behavior:
  - two-level desktop nav
  - hamburger mobile nav
  - preserve fragment authoring or block item authoring
- SEO/A11y:
  - `nav` landmark
  - button toggles with `aria-expanded`
  - keyboard-close on `Escape`
- Dependencies:
  - `nav-language`, `nav-search`, `nav-hotels`, `links.js`

### `footer`

- Files:
  - keep current `blocks/footer/footer.js`
- Model:
  - fragment-driven first
  - decide whether to reuse Iberostar footer or define a microsite footer model
- Filters:
  - global shell
- Behavior:
  - keep generic loader until footer ownership is decided
- SEO/A11y:
  - semantic footer, real links
- Dependencies:
  - fragment block

## Recommended Next Implementation Order

1. Refactor `hero` and create shared authoring helpers.
2. Harden `featured-articles`, `blog-split-list`, `topic-tag-cloud`, `editorial-highlight-grid`.
3. Align `grid-category-gallery` and `carousel-category-gallery` on one card schema.
4. Implement microsite `header` and footer strategy.
5. Finish Article page blocks.
6. Replace mock article/hotel data with stable JSON/index endpoints.

## Notes

- Because the Excel/PDF functional files were not available from this environment, this document should be treated as a repo-grounded implementation plan, not as a final component inventory sign-off.
- Once those attachments are accessible, the next pass should reconcile:
  - exact block names,
  - per-page placement,
  - field-level authoring requirements,
  - any Figma-specific content edge cases.
