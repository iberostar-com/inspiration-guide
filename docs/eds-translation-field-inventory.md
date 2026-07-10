# EDS Translation Field Inventory

## 1. Resumen ejecutivo
Este inventario consolida campos de modelos XWalk, lecturas en JS (incluyendo fallback por indice), metadatos de helix-query y placeholders para definir reglas de traduccion AEM/Trados en Inspiration Guide.

Totales consolidados:
- translate: 89
- do_not_translate: 78
- review: 75

## 2. Estructura de contenido asumida
/content/inspiration-guide/{lang}-{country}/inspiration-guide

## 3. Lista de bloques inspeccionados
- article-content-image
- article-content-quote
- article-content-table
- article-content-video
- article-main-image
- blog-split-list
- breadcrumbs
- cards
- carousel-category-gallery
- category-hero
- columns
- editorial-article-banner
- editorial-article-content
- editorial-article-grid
- editorial-highlight-grid
- editorial-split-article
- featured-articles
- footer-legal
- footer-links
- form
- fragment
- global-models
- grid-category-gallery
- header-brand
- hero
- hero-blog
- hero-tag-name
- hotel-graphql-mini-card
- hotel-mini-card
- lead-subscription-form
- nav-hotels
- nav-item
- nav-language
- nav-search
- recommended-dynamic-hotels-grid
- recommended-hotels-grid
- topic-tag-cloud

## 4. Tabla por bloque
| block | file | property | source | type/model component | classification | reason | example if found |
| --- | --- | --- | --- | --- | --- | --- | --- |
| article-content-image | blocks/article-content-image/_article-content-image.json | alignment | blocks/article-content-image/_article-content-image.json | select | review | Ambiguous field usage; validate if value is visible text or technical metadata. |  |
| article-content-image | blocks/article-content-image/_article-content-image.json | caption | blocks/article-content-image/_article-content-image.json | text | translate | Editorial text shown to end users (including rich text, labels, and visible copy). |  |
| article-content-image | blocks/article-content-image/_article-content-image.json | image | blocks/article-content-image/_article-content-image.json | reference | do_not_translate | Technical/structural field, identifier, boolean/date/number, or asset reference. |  |
| article-content-image | blocks/article-content-image/_article-content-image.json | imageAlt | blocks/article-content-image/_article-content-image.json | text | translate | Editorial text shown to end users (including rich text, labels, and visible copy). |  |
| article-content-quote | blocks/article-content-quote/_article-content-quote.json | attribution | blocks/article-content-quote/_article-content-quote.json | text | translate | Editorial text shown to end users (including rich text, labels, and visible copy). |  |
| article-content-quote | blocks/article-content-quote/_article-content-quote.json | text | blocks/article-content-quote/_article-content-quote.json | richtext | translate | Editorial text shown to end users (including rich text, labels, and visible copy). |  |
| article-content-table | blocks/article-content-table/_article-content-table.json | classes | blocks/article-content-table/_article-content-table.json | multiselect | review | Ambiguous field usage; validate if value is visible text or technical metadata. |  |
| article-content-table | blocks/article-content-table/_article-content-table.json | text | blocks/article-content-table/_article-content-table.json | richtext | translate | Editorial text shown to end users (including rich text, labels, and visible copy). |  |
| article-content-table | blocks/article-content-table/_article-content-table.json | title | blocks/article-content-table/_article-content-table.json | text | translate | Editorial text shown to end users (including rich text, labels, and visible copy). |  |
| article-content-table | blocks/article-content-table/_article-content-table.json | titleHeading | blocks/article-content-table/_article-content-table.json | select | review | Ambiguous field usage; validate if value is visible text or technical metadata. |  |
| article-content-video | blocks/article-content-video/_article-content-video.json | alignment | blocks/article-content-video/_article-content-video.json | select | review | Ambiguous field usage; validate if value is visible text or technical metadata. |  |
| article-content-video | blocks/article-content-video/_article-content-video.json | caption | blocks/article-content-video/_article-content-video.json | text | translate | Editorial text shown to end users (including rich text, labels, and visible copy). |  |
| article-content-video | blocks/article-content-video/_article-content-video.json | poster | blocks/article-content-video/_article-content-video.json | reference | do_not_translate | Technical/structural field, identifier, boolean/date/number, or asset reference. |  |
| article-content-video | blocks/article-content-video/_article-content-video.json | posterAlt | blocks/article-content-video/_article-content-video.json | text | translate | Editorial text shown to end users (including rich text, labels, and visible copy). |  |
| article-content-video | blocks/article-content-video/_article-content-video.json | videoDam | blocks/article-content-video/_article-content-video.json | aem-content | do_not_translate | Technical/structural field, identifier, boolean/date/number, or asset reference. |  |
| article-content-video | blocks/article-content-video/_article-content-video.json | videoType | blocks/article-content-video/_article-content-video.json | select | do_not_translate | Technical/structural field, identifier, boolean/date/number, or asset reference. |  |
| article-content-video | blocks/article-content-video/_article-content-video.json | youtubeVideoId | blocks/article-content-video/_article-content-video.json | text | do_not_translate | Technical/structural field, identifier, boolean/date/number, or asset reference. |  |
| article-main-image | blocks/article-main-image/_article-main-image.json | caption | blocks/article-main-image/_article-main-image.json | text | translate | Editorial text shown to end users (including rich text, labels, and visible copy). |  |
| article-main-image | blocks/article-main-image/_article-main-image.json | image | blocks/article-main-image/_article-main-image.json | reference | do_not_translate | Technical/structural field, identifier, boolean/date/number, or asset reference. |  |
| article-main-image | blocks/article-main-image/_article-main-image.json | imageAlt | blocks/article-main-image/_article-main-image.json | text | translate | Editorial text shown to end users (including rich text, labels, and visible copy). |  |
| blog-split-list | blocks/blog-split-list/_blog-split-list.json | article_authorImage | blocks/blog-split-list/_blog-split-list.json | reference | review | Ambiguous field usage; validate if value is visible text or technical metadata. |  |
| blog-split-list | blocks/blog-split-list/_blog-split-list.json | article_authorName | blocks/blog-split-list/_blog-split-list.json | text | translate | Editorial text shown to end users (including rich text, labels, and visible copy). |  |
| blog-split-list | blocks/blog-split-list/_blog-split-list.json | article_category | blocks/blog-split-list/_blog-split-list.json | text | review | Authorable URL/path or content reference can require locale-aware decision. |  |
| blog-split-list | blocks/blog-split-list/_blog-split-list.json | article_categoryUrl | blocks/blog-split-list/_blog-split-list.json | aem-content | review | Authorable URL/path or content reference can require locale-aware decision. |  |
| blog-split-list | blocks/blog-split-list/_blog-split-list.json | article_description | blocks/blog-split-list/_blog-split-list.json | text | translate | Editorial text shown to end users (including rich text, labels, and visible copy). |  |
| blog-split-list | blocks/blog-split-list/_blog-split-list.json | article_image | blocks/blog-split-list/_blog-split-list.json | reference | do_not_translate | Technical/structural field, identifier, boolean/date/number, or asset reference. |  |
| blog-split-list | blocks/blog-split-list/_blog-split-list.json | article_imageAlt | blocks/blog-split-list/_blog-split-list.json | text | translate | Editorial text shown to end users (including rich text, labels, and visible copy). |  |
| blog-split-list | blocks/blog-split-list/_blog-split-list.json | article_placement | blocks/blog-split-list/_blog-split-list.json | select | review | Ambiguous field usage; validate if value is visible text or technical metadata. |  |
| blog-split-list | blocks/blog-split-list/_blog-split-list.json | article_publicationDate | blocks/blog-split-list/_blog-split-list.json | text | translate | Editorial text shown to end users (including rich text, labels, and visible copy). |  |
| blog-split-list | blocks/blog-split-list/_blog-split-list.json | article_readTime | blocks/blog-split-list/_blog-split-list.json | text | translate | Editorial text shown to end users (including rich text, labels, and visible copy). |  |
| blog-split-list | blocks/blog-split-list/_blog-split-list.json | article_title | blocks/blog-split-list/_blog-split-list.json | text | translate | Editorial text shown to end users (including rich text, labels, and visible copy). |  |
| blog-split-list | blocks/blog-split-list/_blog-split-list.json | article_url | blocks/blog-split-list/_blog-split-list.json | aem-content | review | Authorable URL/path or content reference can require locale-aware decision. |  |
| blog-split-list | blocks/blog-split-list/_blog-split-list.json | featuredArticlePath | blocks/blog-split-list/_blog-split-list.json | aem-content | review | Authorable URL/path or content reference can require locale-aware decision. |  |
| blog-split-list | blocks/blog-split-list/_blog-split-list.json | featuredArticleTitleHeading | blocks/blog-split-list/_blog-split-list.json | select | review | Ambiguous field usage; validate if value is visible text or technical metadata. |  |
| blog-split-list | blocks/blog-split-list/_blog-split-list.json | featuredBadge | blocks/blog-split-list/_blog-split-list.json | text | translate | Editorial text shown to end users (including rich text, labels, and visible copy). |  |
| blog-split-list | blocks/blog-split-list/_blog-split-list.json | featuredLabel | blocks/blog-split-list/_blog-split-list.json | text | translate | Editorial text shown to end users (including rich text, labels, and visible copy). |  |
| blog-split-list | blocks/blog-split-list/_blog-split-list.json | featuredLabelHeading | blocks/blog-split-list/_blog-split-list.json | select | review | Ambiguous field usage; validate if value is visible text or technical metadata. |  |
| blog-split-list | blocks/blog-split-list/_blog-split-list.json | filterTags | blocks/blog-split-list/_blog-split-list.json | aem-tag | review | Could be rendered label or technical taxonomy ID depending on implementation. |  |
| blog-split-list | blocks/blog-split-list/_blog-split-list.json | latestArticleTitleHeading | blocks/blog-split-list/_blog-split-list.json | select | review | Ambiguous field usage; validate if value is visible text or technical metadata. |  |
| blog-split-list | blocks/blog-split-list/_blog-split-list.json | latestLabel | blocks/blog-split-list/_blog-split-list.json | text | translate | Editorial text shown to end users (including rich text, labels, and visible copy). |  |
| blog-split-list | blocks/blog-split-list/_blog-split-list.json | latestLabelHeading | blocks/blog-split-list/_blog-split-list.json | select | review | Ambiguous field usage; validate if value is visible text or technical metadata. |  |
| breadcrumbs | blocks/breadcrumbs/_breadcrumbs.json | currentLabel | blocks/breadcrumbs/_breadcrumbs.json | text | translate | Editorial text shown to end users (including rich text, labels, and visible copy). |  |
| breadcrumbs | blocks/breadcrumbs/_breadcrumbs.json | homeLabel | blocks/breadcrumbs/_breadcrumbs.json | text | translate | Editorial text shown to end users (including rich text, labels, and visible copy). |  |
| breadcrumbs | blocks/breadcrumbs/_breadcrumbs.json | homeUrl | blocks/breadcrumbs/_breadcrumbs.json | aem-content | review | Authorable URL/path or content reference can require locale-aware decision. |  |
| cards | blocks/cards/_cards.json | image | blocks/cards/_cards.json | reference | do_not_translate | Technical/structural field, identifier, boolean/date/number, or asset reference. |  |
| cards | blocks/cards/_cards.json | link | blocks/cards/_cards.json | text | review | Authorable URL/path or content reference can require locale-aware decision. |  |
| cards | blocks/cards/_cards.json | text | blocks/cards/_cards.json | richtext | translate | Editorial text shown to end users (including rich text, labels, and visible copy). |  |
| carousel-category-gallery | blocks/carousel-category-gallery/_carousel-category-gallery.json | eyebrow | blocks/carousel-category-gallery/_carousel-category-gallery.json | text | translate | Editorial text shown to end users (including rich text, labels, and visible copy). |  |
| carousel-category-gallery | blocks/carousel-category-gallery/_carousel-category-gallery.json | icon | blocks/carousel-category-gallery/_carousel-category-gallery.json | text | do_not_translate | Technical/structural field, identifier, boolean/date/number, or asset reference. |  |
| carousel-category-gallery | blocks/carousel-category-gallery/_carousel-category-gallery.json | image | blocks/carousel-category-gallery/_carousel-category-gallery.json | reference | do_not_translate | Technical/structural field, identifier, boolean/date/number, or asset reference. |  |
| carousel-category-gallery | blocks/carousel-category-gallery/_carousel-category-gallery.json | link | blocks/carousel-category-gallery/_carousel-category-gallery.json | aem-content | review | Authorable URL/path or content reference can require locale-aware decision. |  |
| carousel-category-gallery | blocks/carousel-category-gallery/_carousel-category-gallery.json | maxItems | blocks/carousel-category-gallery/_carousel-category-gallery.json | number | do_not_translate | Technical/structural field, identifier, boolean/date/number, or asset reference. |  |
| carousel-category-gallery | blocks/carousel-category-gallery/_carousel-category-gallery.json | title | blocks/carousel-category-gallery/_carousel-category-gallery.json | text | translate | Editorial text shown to end users (including rich text, labels, and visible copy). |  |
| category-hero | blocks/category-hero/_category-hero.json | description | blocks/category-hero/_category-hero.json | richtext | translate | Editorial text shown to end users (including rich text, labels, and visible copy). |  |
| category-hero | blocks/category-hero/_category-hero.json | pretitle | blocks/category-hero/_category-hero.json | text | translate | Editorial text shown to end users (including rich text, labels, and visible copy). |  |
| category-hero | blocks/category-hero/_category-hero.json | subcategoriesHeadingTag | blocks/category-hero/_category-hero.json | select | review | Could be rendered label or technical taxonomy ID depending on implementation. |  |
| category-hero | blocks/category-hero/_category-hero.json | subcategory1Url | blocks/category-hero/_category-hero.json | aem-content | review | Authorable URL/path or content reference can require locale-aware decision. |  |
| category-hero | blocks/category-hero/_category-hero.json | subcategory2Url | blocks/category-hero/_category-hero.json | aem-content | review | Authorable URL/path or content reference can require locale-aware decision. |  |
| category-hero | blocks/category-hero/_category-hero.json | subcategory3Url | blocks/category-hero/_category-hero.json | aem-content | review | Authorable URL/path or content reference can require locale-aware decision. |  |
| category-hero | blocks/category-hero/_category-hero.json | subcategory4Url | blocks/category-hero/_category-hero.json | aem-content | review | Authorable URL/path or content reference can require locale-aware decision. |  |
| category-hero | blocks/category-hero/_category-hero.json | subcategory5Url | blocks/category-hero/_category-hero.json | aem-content | review | Authorable URL/path or content reference can require locale-aware decision. |  |
| category-hero | blocks/category-hero/_category-hero.json | subcategory6Url | blocks/category-hero/_category-hero.json | aem-content | review | Authorable URL/path or content reference can require locale-aware decision. |  |
| category-hero | blocks/category-hero/_category-hero.json | subcategory7Url | blocks/category-hero/_category-hero.json | aem-content | review | Authorable URL/path or content reference can require locale-aware decision. |  |
| category-hero | blocks/category-hero/_category-hero.json | subcategory8Url | blocks/category-hero/_category-hero.json | aem-content | review | Authorable URL/path or content reference can require locale-aware decision. |  |
| category-hero | blocks/category-hero/_category-hero.json | subcategory9Url | blocks/category-hero/_category-hero.json | aem-content | review | Authorable URL/path or content reference can require locale-aware decision. |  |
| category-hero | blocks/category-hero/_category-hero.json | title | blocks/category-hero/_category-hero.json | text | translate | Editorial text shown to end users (including rich text, labels, and visible copy). |  |
| category-hero | blocks/category-hero/_category-hero.json | url | blocks/category-hero/_category-hero.json | aem-content | review | Authorable URL/path or content reference can require locale-aware decision. |  |
| columns | blocks/columns/_columns.json | columns | blocks/columns/_columns.json | text | do_not_translate | Technical/structural field, identifier, boolean/date/number, or asset reference. |  |
| columns | blocks/columns/_columns.json | rows | blocks/columns/_columns.json | text | do_not_translate | Technical/structural field, identifier, boolean/date/number, or asset reference. |  |
| editorial-article-banner | blocks/editorial-article-banner/_editorial-article-banner.json | description | blocks/editorial-article-banner/_editorial-article-banner.json | textarea | translate | Editorial text shown to end users (including rich text, labels, and visible copy). |  |
| editorial-article-banner | blocks/editorial-article-banner/_editorial-article-banner.json | link | blocks/editorial-article-banner/_editorial-article-banner.json | aem-content | review | Authorable URL/path or content reference can require locale-aware decision. |  |
| editorial-article-banner | blocks/editorial-article-banner/_editorial-article-banner.json | linkTarget | blocks/editorial-article-banner/_editorial-article-banner.json | select | do_not_translate | Technical/structural field, identifier, boolean/date/number, or asset reference. |  |
| editorial-article-banner | blocks/editorial-article-banner/_editorial-article-banner.json | linkText | blocks/editorial-article-banner/_editorial-article-banner.json | text | translate | Editorial text shown to end users (including rich text, labels, and visible copy). |  |
| editorial-article-banner | blocks/editorial-article-banner/_editorial-article-banner.json | title | blocks/editorial-article-banner/_editorial-article-banner.json | text | translate | Editorial text shown to end users (including rich text, labels, and visible copy). |  |
| editorial-article-content | blocks/editorial-article-content/_editorial-article-content.json | text | blocks/editorial-article-content/_editorial-article-content.json | richtext | translate | Editorial text shown to end users (including rich text, labels, and visible copy). |  |
| editorial-article-grid | blocks/editorial-article-grid/_editorial-article-grid.json | cardCtaLabel | blocks/editorial-article-grid/_editorial-article-grid.json | text | translate | Editorial text shown to end users (including rich text, labels, and visible copy). |  |
| editorial-article-grid | blocks/editorial-article-grid/_editorial-article-grid.json | category | blocks/editorial-article-grid/_editorial-article-grid.json | text | review | Authorable URL/path or content reference can require locale-aware decision. |  |
| editorial-article-grid | blocks/editorial-article-grid/_editorial-article-grid.json | ctaTarget | blocks/editorial-article-grid/_editorial-article-grid.json | select | do_not_translate | Technical/structural field, identifier, boolean/date/number, or asset reference. |  |
| editorial-article-grid | blocks/editorial-article-grid/_editorial-article-grid.json | eyebrow | blocks/editorial-article-grid/_editorial-article-grid.json | text | translate | Editorial text shown to end users (including rich text, labels, and visible copy). |  |
| editorial-article-grid | blocks/editorial-article-grid/_editorial-article-grid.json | eyebrowHeading | blocks/editorial-article-grid/_editorial-article-grid.json | select | review | Ambiguous field usage; validate if value is visible text or technical metadata. |  |
| editorial-article-grid | blocks/editorial-article-grid/_editorial-article-grid.json | image | blocks/editorial-article-grid/_editorial-article-grid.json | reference | do_not_translate | Technical/structural field, identifier, boolean/date/number, or asset reference. |  |
| editorial-article-grid | blocks/editorial-article-grid/_editorial-article-grid.json | link | blocks/editorial-article-grid/_editorial-article-grid.json | text | review | Authorable URL/path or content reference can require locale-aware decision. |  |
| editorial-article-grid | blocks/editorial-article-grid/_editorial-article-grid.json | manualArticle1 | blocks/editorial-article-grid/_editorial-article-grid.json | aem-content | review | Authorable URL/path or content reference can require locale-aware decision. |  |
| editorial-article-grid | blocks/editorial-article-grid/_editorial-article-grid.json | manualArticle2 | blocks/editorial-article-grid/_editorial-article-grid.json | aem-content | review | Authorable URL/path or content reference can require locale-aware decision. |  |
| editorial-article-grid | blocks/editorial-article-grid/_editorial-article-grid.json | manualArticle3 | blocks/editorial-article-grid/_editorial-article-grid.json | aem-content | review | Authorable URL/path or content reference can require locale-aware decision. |  |
| editorial-article-grid | blocks/editorial-article-grid/_editorial-article-grid.json | mode | blocks/editorial-article-grid/_editorial-article-grid.json | select | do_not_translate | Technical/structural field, identifier, boolean/date/number, or asset reference. |  |
| editorial-article-grid | blocks/editorial-article-grid/_editorial-article-grid.json | title | blocks/editorial-article-grid/_editorial-article-grid.json | text | translate | Editorial text shown to end users (including rich text, labels, and visible copy). |  |
| editorial-article-grid | blocks/editorial-article-grid/_editorial-article-grid.json | titleHeading | blocks/editorial-article-grid/_editorial-article-grid.json | select | review | Ambiguous field usage; validate if value is visible text or technical metadata. |  |
| editorial-highlight-grid | blocks/editorial-highlight-grid/_editorial-highlight-grid.json | article | blocks/editorial-highlight-grid/_editorial-highlight-grid.json | aem-content | review | Ambiguous field usage; validate if value is visible text or technical metadata. |  |
| editorial-highlight-grid | blocks/editorial-highlight-grid/_editorial-highlight-grid.json | cardHeading | blocks/editorial-highlight-grid/_editorial-highlight-grid.json | select | review | Ambiguous field usage; validate if value is visible text or technical metadata. |  |
| editorial-highlight-grid | blocks/editorial-highlight-grid/_editorial-highlight-grid.json | ctaLabel | blocks/editorial-highlight-grid/_editorial-highlight-grid.json | text | translate | Editorial text shown to end users (including rich text, labels, and visible copy). |  |
| editorial-highlight-grid | blocks/editorial-highlight-grid/_editorial-highlight-grid.json | pageSize | blocks/editorial-highlight-grid/_editorial-highlight-grid.json | number | do_not_translate | Technical/structural field, identifier, boolean/date/number, or asset reference. |  |
| editorial-highlight-grid | blocks/editorial-highlight-grid/_editorial-highlight-grid.json | source | blocks/editorial-highlight-grid/_editorial-highlight-grid.json | select | review | Ambiguous field usage; validate if value is visible text or technical metadata. |  |
| editorial-highlight-grid | blocks/editorial-highlight-grid/_editorial-highlight-grid.json | title | blocks/editorial-highlight-grid/_editorial-highlight-grid.json | text | translate | Editorial text shown to end users (including rich text, labels, and visible copy). |  |
| editorial-highlight-grid | blocks/editorial-highlight-grid/_editorial-highlight-grid.json | titleHeading | blocks/editorial-highlight-grid/_editorial-highlight-grid.json | select | review | Ambiguous field usage; validate if value is visible text or technical metadata. |  |
| editorial-highlight-grid | blocks/editorial-highlight-grid/_editorial-highlight-grid.json | variant | blocks/editorial-highlight-grid/_editorial-highlight-grid.json | select | do_not_translate | Technical/structural field, identifier, boolean/date/number, or asset reference. |  |
| editorial-split-article | blocks/editorial-split-article/_editorial-split-article.json | eyebrow | blocks/editorial-split-article/_editorial-split-article.json | text | translate | Editorial text shown to end users (including rich text, labels, and visible copy). |  |
| editorial-split-article | blocks/editorial-split-article/_editorial-split-article.json | text | blocks/editorial-split-article/_editorial-split-article.json | richtext | translate | Editorial text shown to end users (including rich text, labels, and visible copy). |  |
| editorial-split-article | blocks/editorial-split-article/_editorial-split-article.json | title | blocks/editorial-split-article/_editorial-split-article.json | text | translate | Editorial text shown to end users (including rich text, labels, and visible copy). |  |
| editorial-split-article | blocks/editorial-split-article/_editorial-split-article.json | titleHeading | blocks/editorial-split-article/_editorial-split-article.json | select | review | Ambiguous field usage; validate if value is visible text or technical metadata. |  |
| featured-articles | blocks/featured-articles/_featured-articles.json | article_authorName | blocks/featured-articles/_featured-articles.json | text | translate | Editorial text shown to end users (including rich text, labels, and visible copy). |  |
| featured-articles | blocks/featured-articles/_featured-articles.json | article_category | blocks/featured-articles/_featured-articles.json | text | review | Authorable URL/path or content reference can require locale-aware decision. |  |
| featured-articles | blocks/featured-articles/_featured-articles.json | article_categoryUrl | blocks/featured-articles/_featured-articles.json | aem-content | review | Authorable URL/path or content reference can require locale-aware decision. |  |
| featured-articles | blocks/featured-articles/_featured-articles.json | article_cta | blocks/featured-articles/_featured-articles.json | text | translate | Editorial text shown to end users (including rich text, labels, and visible copy). |  |
| featured-articles | blocks/featured-articles/_featured-articles.json | article_description | blocks/featured-articles/_featured-articles.json | text | translate | Editorial text shown to end users (including rich text, labels, and visible copy). |  |
| featured-articles | blocks/featured-articles/_featured-articles.json | article_image | blocks/featured-articles/_featured-articles.json | reference | do_not_translate | Technical/structural field, identifier, boolean/date/number, or asset reference. |  |
| featured-articles | blocks/featured-articles/_featured-articles.json | article_imageAlt | blocks/featured-articles/_featured-articles.json | text | translate | Editorial text shown to end users (including rich text, labels, and visible copy). |  |
| featured-articles | blocks/featured-articles/_featured-articles.json | article_placement | blocks/featured-articles/_featured-articles.json | select | review | Ambiguous field usage; validate if value is visible text or technical metadata. |  |
| featured-articles | blocks/featured-articles/_featured-articles.json | article_publicationDate | blocks/featured-articles/_featured-articles.json | text | translate | Editorial text shown to end users (including rich text, labels, and visible copy). |  |
| featured-articles | blocks/featured-articles/_featured-articles.json | article_readTime | blocks/featured-articles/_featured-articles.json | text | translate | Editorial text shown to end users (including rich text, labels, and visible copy). |  |
| featured-articles | blocks/featured-articles/_featured-articles.json | article_title | blocks/featured-articles/_featured-articles.json | text | translate | Editorial text shown to end users (including rich text, labels, and visible copy). |  |
| featured-articles | blocks/featured-articles/_featured-articles.json | article_url | blocks/featured-articles/_featured-articles.json | aem-content | review | Authorable URL/path or content reference can require locale-aware decision. |  |
| featured-articles | blocks/featured-articles/_featured-articles.json | display_articleHeading | blocks/featured-articles/_featured-articles.json | select | review | Ambiguous field usage; validate if value is visible text or technical metadata. |  |
| featured-articles | blocks/featured-articles/_featured-articles.json | display_badge | blocks/featured-articles/_featured-articles.json | text | translate | Editorial text shown to end users (including rich text, labels, and visible copy). |  |
| featured-articles | blocks/featured-articles/_featured-articles.json | featured_heading | blocks/featured-articles/_featured-articles.json | text | translate | Visible section heading copy. |  |
| featured-articles | blocks/featured-articles/_featured-articles.json | featured_headingLevel | blocks/featured-articles/_featured-articles.json | select | review | Heading tag/level selector; content-neutral but UX-related. |  |
| featured-articles | blocks/featured-articles/_featured-articles.json | latest_heading | blocks/featured-articles/_featured-articles.json | text | translate | Visible section heading copy. |  |
| featured-articles | blocks/featured-articles/_featured-articles.json | latest_headingLevel | blocks/featured-articles/_featured-articles.json | select | review | Heading tag/level selector; content-neutral but UX-related. |  |
| footer-legal | blocks/footer-legal/_footer-legal.json | linkLabel | blocks/footer-legal/_footer-legal.json | text | translate | Editorial text shown to end users (including rich text, labels, and visible copy). |  |
| footer-legal | blocks/footer-legal/_footer-legal.json | linkNofollow | blocks/footer-legal/_footer-legal.json | checkbox | do_not_translate | Technical/structural field, identifier, boolean/date/number, or asset reference. |  |
| footer-legal | blocks/footer-legal/_footer-legal.json | linkTarget | blocks/footer-legal/_footer-legal.json | select | do_not_translate | Technical/structural field, identifier, boolean/date/number, or asset reference. |  |
| footer-legal | blocks/footer-legal/_footer-legal.json | linkUrl | blocks/footer-legal/_footer-legal.json | aem-content | review | Ambiguous field usage; validate if value is visible text or technical metadata. |  |
| footer-links | blocks/footer-links/_footer-links.json | linkLabel | blocks/footer-links/_footer-links.json | text | translate | Editorial text shown to end users (including rich text, labels, and visible copy). |  |
| footer-links | blocks/footer-links/_footer-links.json | linkNofollow | blocks/footer-links/_footer-links.json | checkbox | do_not_translate | Technical/structural field, identifier, boolean/date/number, or asset reference. |  |
| footer-links | blocks/footer-links/_footer-links.json | links | blocks/footer-links/_footer-links.json | container | review | Ambiguous field usage; validate if value is visible text or technical metadata. |  |
| footer-links | blocks/footer-links/_footer-links.json | linkTarget | blocks/footer-links/_footer-links.json | select | do_not_translate | Technical/structural field, identifier, boolean/date/number, or asset reference. |  |
| footer-links | blocks/footer-links/_footer-links.json | linkUrl | blocks/footer-links/_footer-links.json | aem-content | review | Ambiguous field usage; validate if value is visible text or technical metadata. |  |
| footer-links | blocks/footer-links/_footer-links.json | title | blocks/footer-links/_footer-links.json | text | translate | Editorial text shown to end users (including rich text, labels, and visible copy). |  |
| form | blocks/form/_form.json | action | blocks/form/_form.json | text | do_not_translate | Technical/structural field, identifier, boolean/date/number, or asset reference. |  |
| form | blocks/form/_form.json | method | blocks/form/_form.json | text | do_not_translate | Technical/structural field, identifier, boolean/date/number, or asset reference. |  |
| form | blocks/form/_form.json | variant | blocks/form/_form.json | select | do_not_translate | Technical/structural field, identifier, boolean/date/number, or asset reference. |  |
| fragment | blocks/fragment/_fragment.json | reference | blocks/fragment/_fragment.json | aem-content | do_not_translate | Technical/structural field, identifier, boolean/date/number, or asset reference. |  |
| global-models | models/_button.json | article-author-description | models/_page.json | text | translate | Editorial text shown to end users (including rich text, labels, and visible copy). |  |
| global-models | models/_button.json | article-author-image | models/_page.json | reference | do_not_translate | Technical/structural field, identifier, boolean/date/number, or asset reference. |  |
| global-models | models/_button.json | article-author-name | models/_page.json | text | translate | Editorial text shown to end users (including rich text, labels, and visible copy). |  |
| global-models | models/_button.json | article-category | models/_page.json | aem-tag | review | Authorable URL/path or content reference can require locale-aware decision. |  |
| global-models | models/_button.json | article-image | models/_page.json | reference | do_not_translate | Technical/structural field, identifier, boolean/date/number, or asset reference. |  |
| global-models | models/_button.json | article-image-alt | models/_page.json | text | translate | Editorial text shown to end users (including rich text, labels, and visible copy). |  |
| global-models | models/_button.json | article-internal-name | models/_page.json | text | do_not_translate | Internal editorial identifier, not user-facing copy. |  |
| global-models | models/_button.json | article-publication-date | models/_page.json | date-time | do_not_translate | Technical/structural field, identifier, boolean/date/number, or asset reference. |  |
| global-models | models/_button.json | article-read-time | models/_page.json | text | translate | Editorial text shown to end users (including rich text, labels, and visible copy). |  |
| global-models | models/_button.json | article-tags | models/_page.json | aem-tag | review | Authorable URL/path or content reference can require locale-aware decision. |  |
| global-models | models/_button.json | article-update-date | models/_page.json | date-time | do_not_translate | Technical/structural field, identifier, boolean/date/number, or asset reference. |  |
| global-models | models/_button.json | article-visible | models/_page.json | boolean | do_not_translate | Technical/structural field, identifier, boolean/date/number, or asset reference. |  |
| global-models | models/_button.json | footer | models/_page.json | aem-content | do_not_translate | Technical/structural field, identifier, boolean/date/number, or asset reference. |  |
| global-models | models/_button.json | image | models/_image.json | reference | do_not_translate | Technical/structural field, identifier, boolean/date/number, or asset reference. |  |
| global-models | models/_button.json | imageAlt | models/_image.json | text | translate | Editorial text shown to end users (including rich text, labels, and visible copy). |  |
| global-models | models/_button.json | inspiration-data-mode | models/_page.json | select | do_not_translate | Technical/structural field, identifier, boolean/date/number, or asset reference. |  |
| global-models | models/_button.json | jcr:description | models/_page.json | text | translate | Editorial text shown to end users (including rich text, labels, and visible copy). |  |
| global-models | models/_button.json | jcr:title | models/_page.json | text | translate | Editorial text shown to end users (including rich text, labels, and visible copy). |  |
| global-models | models/_button.json | keywords | models/_page.json | text | review | SEO keywords are metadata; usually localized but governance-dependent. |  |
| global-models | models/_button.json | link | models/_button.json | aem-content | review | Authorable URL/path or content reference can require locale-aware decision. |  |
| global-models | models/_button.json | linkText | models/_button.json | text | translate | Editorial text shown to end users (including rich text, labels, and visible copy). |  |
| global-models | models/_button.json | linkTitle | models/_button.json | text | translate | Accessible/tooltip label text potentially visible to users. |  |
| global-models | models/_button.json | linkType | models/_button.json | select | do_not_translate | Technical/structural field, identifier, boolean/date/number, or asset reference. |  |
| global-models | models/_button.json | name | models/_section.json | text | do_not_translate | Technical/structural field, identifier, boolean/date/number, or asset reference. |  |
| global-models | models/_button.json | nav | models/_page.json | aem-content | do_not_translate | Technical/structural field, identifier, boolean/date/number, or asset reference. |  |
| global-models | models/_button.json | page-type | models/_page.json | select | do_not_translate | Technical/structural field, identifier, boolean/date/number, or asset reference. |  |
| global-models | models/_button.json | style | models/_section.json | multiselect | do_not_translate | Technical/structural field, identifier, boolean/date/number, or asset reference. |  |
| global-models | models/_button.json | title | models/_title.json | text | translate | Editorial text shown to end users (including rich text, labels, and visible copy). |  |
| global-models | models/_button.json | titleType | models/_title.json | select | review | Ambiguous field usage; validate if value is visible text or technical metadata. |  |
| grid-category-gallery | blocks/grid-category-gallery/_grid-category-gallery.json | cta | blocks/grid-category-gallery/_grid-category-gallery.json | aem-content | review | Ambiguous field usage; validate if value is visible text or technical metadata. |  |
| grid-category-gallery | blocks/grid-category-gallery/_grid-category-gallery.json | ctaText | blocks/grid-category-gallery/_grid-category-gallery.json | text | translate | Editorial text shown to end users (including rich text, labels, and visible copy). |  |
| grid-category-gallery | blocks/grid-category-gallery/_grid-category-gallery.json | image | blocks/grid-category-gallery/_grid-category-gallery.json | reference | do_not_translate | Technical/structural field, identifier, boolean/date/number, or asset reference. |  |
| grid-category-gallery | blocks/grid-category-gallery/_grid-category-gallery.json | imageAlt | blocks/grid-category-gallery/_grid-category-gallery.json | text | translate | Editorial text shown to end users (including rich text, labels, and visible copy). |  |
| grid-category-gallery | blocks/grid-category-gallery/_grid-category-gallery.json | link | blocks/grid-category-gallery/_grid-category-gallery.json | aem-content | review | Authorable URL/path or content reference can require locale-aware decision. |  |
| grid-category-gallery | blocks/grid-category-gallery/_grid-category-gallery.json | subtitle | blocks/grid-category-gallery/_grid-category-gallery.json | text | translate | Editorial text shown to end users (including rich text, labels, and visible copy). |  |
| grid-category-gallery | blocks/grid-category-gallery/_grid-category-gallery.json | title | blocks/grid-category-gallery/_grid-category-gallery.json | text | translate | Editorial text shown to end users (including rich text, labels, and visible copy). |  |
| header-brand | blocks/header-brand/_header-brand.json | label | blocks/header-brand/_header-brand.json | text | translate | Editorial text shown to end users (including rich text, labels, and visible copy). |  |
| header-brand | blocks/header-brand/_header-brand.json | link | blocks/header-brand/_header-brand.json | text | review | Authorable URL/path or content reference can require locale-aware decision. |  |
| header-brand | blocks/header-brand/_header-brand.json | logo | blocks/header-brand/_header-brand.json | reference | do_not_translate | Technical/structural field, identifier, boolean/date/number, or asset reference. |  |
| header-brand | blocks/header-brand/_header-brand.json | logoAlt | blocks/header-brand/_header-brand.json | text | translate | Editorial text shown to end users (including rich text, labels, and visible copy). |  |
| header-brand | blocks/header-brand/_header-brand.json | logoDesktop | blocks/header-brand/_header-brand.json | reference | review | Ambiguous field usage; validate if value is visible text or technical metadata. |  |
| hero-blog | blocks/hero-blog/_hero-blog.json | hero_icon | blocks/hero-blog/_hero-blog.json | reference | review | Ambiguous field usage; validate if value is visible text or technical metadata. |  |
| hero-blog | blocks/hero-blog/_hero-blog.json | hero_subtitle | blocks/hero-blog/_hero-blog.json | textarea | translate | Editorial text shown to end users (including rich text, labels, and visible copy). |  |
| hero-blog | blocks/hero-blog/_hero-blog.json | hero_subtitleHeading | blocks/hero-blog/_hero-blog.json | select | review | Ambiguous field usage; validate if value is visible text or technical metadata. |  |
| hero-blog | blocks/hero-blog/_hero-blog.json | hero_title | blocks/hero-blog/_hero-blog.json | text | translate | Editorial text shown to end users (including rich text, labels, and visible copy). |  |
| hero-blog | blocks/hero-blog/_hero-blog.json | hero_titleHeading | blocks/hero-blog/_hero-blog.json | select | review | Ambiguous field usage; validate if value is visible text or technical metadata. |  |
| hero-tag-name | blocks/hero-tag-name/_hero-tag-name.json | title | blocks/hero-tag-name/_hero-tag-name.json | text | translate | Editorial text shown to end users (including rich text, labels, and visible copy). |  |
| hero-tag-name | blocks/hero-tag-name/_hero-tag-name.json | titleHeading | blocks/hero-tag-name/_hero-tag-name.json | select | review | Ambiguous field usage; validate if value is visible text or technical metadata. |  |
| hero | blocks/hero/_hero.json | image | blocks/hero/_hero.json | reference | do_not_translate | Technical/structural field, identifier, boolean/date/number, or asset reference. |  |
| hero | blocks/hero/_hero.json | imageAlt | blocks/hero/_hero.json | text | translate | Editorial text shown to end users (including rich text, labels, and visible copy). |  |
| hero | blocks/hero/_hero.json | subtitle | blocks/hero/_hero.json | textarea | translate | Editorial text shown to end users (including rich text, labels, and visible copy). |  |
| hero | blocks/hero/_hero.json | text | blocks/hero/_hero.json | richtext | translate | Editorial text shown to end users (including rich text, labels, and visible copy). |  |
| hero | blocks/hero/_hero.json | variant | blocks/hero/_hero.json | select | do_not_translate | Technical/structural field, identifier, boolean/date/number, or asset reference. |  |
| hotel-graphql-mini-card | blocks/hotel-graphql-mini-card/_hotel-graphql-mini-card.json | cta_link | blocks/hotel-graphql-mini-card/_hotel-graphql-mini-card.json | aem-content | review | Authorable URL/path or content reference can require locale-aware decision. |  |
| hotel-graphql-mini-card | blocks/hotel-graphql-mini-card/_hotel-graphql-mini-card.json | cta_linkTarget | blocks/hotel-graphql-mini-card/_hotel-graphql-mini-card.json | select | do_not_translate | Technical/structural field, identifier, boolean/date/number, or asset reference. |  |
| hotel-graphql-mini-card | blocks/hotel-graphql-mini-card/_hotel-graphql-mini-card.json | cta_linkText | blocks/hotel-graphql-mini-card/_hotel-graphql-mini-card.json | text | translate | Editorial text shown to end users (including rich text, labels, and visible copy). |  |
| hotel-graphql-mini-card | blocks/hotel-graphql-mini-card/_hotel-graphql-mini-card.json | destination | blocks/hotel-graphql-mini-card/_hotel-graphql-mini-card.json | text | review | Authorable URL/path or content reference can require locale-aware decision. |  |
| hotel-graphql-mini-card | blocks/hotel-graphql-mini-card/_hotel-graphql-mini-card.json | hotelCode | blocks/hotel-graphql-mini-card/_hotel-graphql-mini-card.json | text | do_not_translate | Technical/structural field, identifier, boolean/date/number, or asset reference. |  |
| hotel-mini-card | blocks/hotel-mini-card/_hotel-mini-card.json | cta_link | blocks/hotel-mini-card/_hotel-mini-card.json | aem-content | review | Authorable URL/path or content reference can require locale-aware decision. |  |
| hotel-mini-card | blocks/hotel-mini-card/_hotel-mini-card.json | cta_linkTarget | blocks/hotel-mini-card/_hotel-mini-card.json | select | do_not_translate | Technical/structural field, identifier, boolean/date/number, or asset reference. |  |
| hotel-mini-card | blocks/hotel-mini-card/_hotel-mini-card.json | cta_linkText | blocks/hotel-mini-card/_hotel-mini-card.json | text | translate | Editorial text shown to end users (including rich text, labels, and visible copy). |  |
| hotel-mini-card | blocks/hotel-mini-card/_hotel-mini-card.json | hotel_hotelName | blocks/hotel-mini-card/_hotel-mini-card.json | text | translate | Editorial text shown to end users (including rich text, labels, and visible copy). |  |
| hotel-mini-card | blocks/hotel-mini-card/_hotel-mini-card.json | hotel_location | blocks/hotel-mini-card/_hotel-mini-card.json | text | translate | Editorial text shown to end users (including rich text, labels, and visible copy). |  |
| hotel-mini-card | blocks/hotel-mini-card/_hotel-mini-card.json | hotel_priceFrom | blocks/hotel-mini-card/_hotel-mini-card.json | text | translate | Editorial text shown to end users (including rich text, labels, and visible copy). |  |
| hotel-mini-card | blocks/hotel-mini-card/_hotel-mini-card.json | hotel_stars | blocks/hotel-mini-card/_hotel-mini-card.json | select | do_not_translate | Technical/structural field, identifier, boolean/date/number, or asset reference. |  |
| hotel-mini-card | blocks/hotel-mini-card/_hotel-mini-card.json | media_image | blocks/hotel-mini-card/_hotel-mini-card.json | reference | do_not_translate | Technical/structural field, identifier, boolean/date/number, or asset reference. |  |
| hotel-mini-card | blocks/hotel-mini-card/_hotel-mini-card.json | media_imageAlt | blocks/hotel-mini-card/_hotel-mini-card.json | text | translate | Editorial text shown to end users (including rich text, labels, and visible copy). |  |
| hotel-mini-card | blocks/hotel-mini-card/_hotel-mini-card.json | tag_layout | blocks/hotel-mini-card/_hotel-mini-card.json | select | do_not_translate | Technical/structural field, identifier, boolean/date/number, or asset reference. |  |
| hotel-mini-card | blocks/hotel-mini-card/_hotel-mini-card.json | tag_tagLabel | blocks/hotel-mini-card/_hotel-mini-card.json | text | translate | Editorial text shown to end users (including rich text, labels, and visible copy). |  |
| lead-subscription-form | blocks/lead-subscription-form/_lead-subscription-form.json | background | blocks/lead-subscription-form/_lead-subscription-form.json | select | do_not_translate | Technical/structural field, identifier, boolean/date/number, or asset reference. |  |
| lead-subscription-form | blocks/lead-subscription-form/_lead-subscription-form.json | background_buttonLabel | blocks/lead-subscription-form/_lead-subscription-form.json | text | translate | Editorial text shown to end users (including rich text, labels, and visible copy). |  |
| lead-subscription-form | blocks/lead-subscription-form/_lead-subscription-form.json | background_errorCheckMessage | blocks/lead-subscription-form/_lead-subscription-form.json | text | translate | Editorial text shown to end users (including rich text, labels, and visible copy). |  |
| lead-subscription-form | blocks/lead-subscription-form/_lead-subscription-form.json | background_errorEmailMessage | blocks/lead-subscription-form/_lead-subscription-form.json | text | translate | Editorial text shown to end users (including rich text, labels, and visible copy). |  |
| lead-subscription-form | blocks/lead-subscription-form/_lead-subscription-form.json | background_errorGenericMessage | blocks/lead-subscription-form/_lead-subscription-form.json | text | translate | Editorial text shown to end users (including rich text, labels, and visible copy). |  |
| lead-subscription-form | blocks/lead-subscription-form/_lead-subscription-form.json | background_placeholder | blocks/lead-subscription-form/_lead-subscription-form.json | text | translate | Editorial text shown to end users (including rich text, labels, and visible copy). |  |
| lead-subscription-form | blocks/lead-subscription-form/_lead-subscription-form.json | background_successHeading | blocks/lead-subscription-form/_lead-subscription-form.json | text | translate | Editorial text shown to end users (including rich text, labels, and visible copy). |  |
| lead-subscription-form | blocks/lead-subscription-form/_lead-subscription-form.json | background_successMessage | blocks/lead-subscription-form/_lead-subscription-form.json | text | translate | Editorial text shown to end users (including rich text, labels, and visible copy). |  |
| lead-subscription-form | blocks/lead-subscription-form/_lead-subscription-form.json | description | blocks/lead-subscription-form/_lead-subscription-form.json | text | translate | Editorial text shown to end users (including rich text, labels, and visible copy). |  |
| lead-subscription-form | blocks/lead-subscription-form/_lead-subscription-form.json | legal | blocks/lead-subscription-form/_lead-subscription-form.json | richtext | translate | Editorial text shown to end users (including rich text, labels, and visible copy). |  |
| lead-subscription-form | blocks/lead-subscription-form/_lead-subscription-form.json | title | blocks/lead-subscription-form/_lead-subscription-form.json | text | translate | Editorial text shown to end users (including rich text, labels, and visible copy). |  |
| nav-hotels | blocks/nav-hotels/_nav-hotels.json | link | blocks/nav-hotels/_nav-hotels.json | text | review | Authorable URL/path or content reference can require locale-aware decision. |  |
| nav-hotels | blocks/nav-hotels/_nav-hotels.json | linkText | blocks/nav-hotels/_nav-hotels.json | text | translate | Editorial text shown to end users (including rich text, labels, and visible copy). |  |
| nav-hotels | blocks/nav-hotels/_nav-hotels.json | target | blocks/nav-hotels/_nav-hotels.json | select | do_not_translate | Technical/structural field, identifier, boolean/date/number, or asset reference. |  |
| nav-item | blocks/nav-item/_nav-item.json | label | blocks/nav-item/_nav-item.json | text | translate | Editorial text shown to end users (including rich text, labels, and visible copy). |  |
| nav-item | blocks/nav-item/_nav-item.json | link | blocks/nav-item/_nav-item.json | aem-content | review | Authorable URL/path or content reference can require locale-aware decision. |  |
| nav-item | blocks/nav-item/_nav-item.json | target | blocks/nav-item/_nav-item.json | select | do_not_translate | Technical/structural field, identifier, boolean/date/number, or asset reference. |  |
| nav-item | blocks/nav-item/_nav-item.json | viewAllLink | blocks/nav-item/_nav-item.json | aem-content | review | Authorable URL/path or content reference can require locale-aware decision. |  |
| nav-item | blocks/nav-item/_nav-item.json | viewAllTarget | blocks/nav-item/_nav-item.json | select | review | Ambiguous field usage; validate if value is visible text or technical metadata. |  |
| nav-item | blocks/nav-item/_nav-item.json | viewAllText | blocks/nav-item/_nav-item.json | text | translate | Editorial text shown to end users (including rich text, labels, and visible copy). |  |
| nav-language | blocks/nav-language/_nav-language.json | label | blocks/nav-language/_nav-language.json | text | translate | Editorial text shown to end users (including rich text, labels, and visible copy). |  |
| nav-language | blocks/nav-language/_nav-language.json | link | blocks/nav-language/_nav-language.json | aem-content | review | Authorable URL/path or content reference can require locale-aware decision. |  |
| nav-language | blocks/nav-language/_nav-language.json | modalHeading | blocks/nav-language/_nav-language.json | text | translate | Editorial text shown to end users (including rich text, labels, and visible copy). |  |
| nav-language | blocks/nav-language/_nav-language.json | target | blocks/nav-language/_nav-language.json | select | do_not_translate | Technical/structural field, identifier, boolean/date/number, or asset reference. |  |
| nav-search | blocks/nav-search/_nav-search.json | link | blocks/nav-search/_nav-search.json | text | review | Authorable URL/path or content reference can require locale-aware decision. |  |
| nav-search | blocks/nav-search/_nav-search.json | linkText | blocks/nav-search/_nav-search.json | text | translate | Editorial text shown to end users (including rich text, labels, and visible copy). |  |
| recommended-dynamic-hotels-grid | blocks/recommended-dynamic-hotels-grid/_recommended-dynamic-hotels-grid.json | cta_link | blocks/recommended-dynamic-hotels-grid/_recommended-dynamic-hotels-grid.json | aem-content | review | Authorable URL/path or content reference can require locale-aware decision. |  |
| recommended-dynamic-hotels-grid | blocks/recommended-dynamic-hotels-grid/_recommended-dynamic-hotels-grid.json | cta_linkTarget | blocks/recommended-dynamic-hotels-grid/_recommended-dynamic-hotels-grid.json | select | do_not_translate | Technical/structural field, identifier, boolean/date/number, or asset reference. |  |
| recommended-dynamic-hotels-grid | blocks/recommended-dynamic-hotels-grid/_recommended-dynamic-hotels-grid.json | destination | blocks/recommended-dynamic-hotels-grid/_recommended-dynamic-hotels-grid.json | text | review | Authorable URL/path or content reference can require locale-aware decision. |  |
| recommended-dynamic-hotels-grid | blocks/recommended-dynamic-hotels-grid/_recommended-dynamic-hotels-grid.json | eyebrow | blocks/recommended-dynamic-hotels-grid/_recommended-dynamic-hotels-grid.json | text | translate | Editorial text shown to end users (including rich text, labels, and visible copy). |  |
| recommended-dynamic-hotels-grid | blocks/recommended-dynamic-hotels-grid/_recommended-dynamic-hotels-grid.json | gridCta_link | blocks/recommended-dynamic-hotels-grid/_recommended-dynamic-hotels-grid.json | aem-content | review | Authorable URL/path or content reference can require locale-aware decision. |  |
| recommended-dynamic-hotels-grid | blocks/recommended-dynamic-hotels-grid/_recommended-dynamic-hotels-grid.json | gridCta_linkTarget | blocks/recommended-dynamic-hotels-grid/_recommended-dynamic-hotels-grid.json | select | do_not_translate | Technical/structural field, identifier, boolean/date/number, or asset reference. |  |
| recommended-dynamic-hotels-grid | blocks/recommended-dynamic-hotels-grid/_recommended-dynamic-hotels-grid.json | gridCta_linkText | blocks/recommended-dynamic-hotels-grid/_recommended-dynamic-hotels-grid.json | text | translate | Editorial text shown to end users (including rich text, labels, and visible copy). |  |
| recommended-dynamic-hotels-grid | blocks/recommended-dynamic-hotels-grid/_recommended-dynamic-hotels-grid.json | hotelCode | blocks/recommended-dynamic-hotels-grid/_recommended-dynamic-hotels-grid.json | text | do_not_translate | Technical/structural field, identifier, boolean/date/number, or asset reference. |  |
| recommended-dynamic-hotels-grid | blocks/recommended-dynamic-hotels-grid/_recommended-dynamic-hotels-grid.json | tag_tagLabel | blocks/recommended-dynamic-hotels-grid/_recommended-dynamic-hotels-grid.json | text | translate | Editorial text shown to end users (including rich text, labels, and visible copy). |  |
| recommended-dynamic-hotels-grid | blocks/recommended-dynamic-hotels-grid/_recommended-dynamic-hotels-grid.json | title | blocks/recommended-dynamic-hotels-grid/_recommended-dynamic-hotels-grid.json | text | translate | Editorial text shown to end users (including rich text, labels, and visible copy). |  |
| recommended-hotels-grid | blocks/recommended-hotels-grid/_recommended-hotels-grid.json | cta_link | blocks/recommended-hotels-grid/_recommended-hotels-grid.json | aem-content | review | Authorable URL/path or content reference can require locale-aware decision. |  |
| recommended-hotels-grid | blocks/recommended-hotels-grid/_recommended-hotels-grid.json | cta_linkTarget | blocks/recommended-hotels-grid/_recommended-hotels-grid.json | select | do_not_translate | Technical/structural field, identifier, boolean/date/number, or asset reference. |  |
| recommended-hotels-grid | blocks/recommended-hotels-grid/_recommended-hotels-grid.json | eyebrow | blocks/recommended-hotels-grid/_recommended-hotels-grid.json | text | translate | Editorial text shown to end users (including rich text, labels, and visible copy). |  |
| recommended-hotels-grid | blocks/recommended-hotels-grid/_recommended-hotels-grid.json | gridCta_link | blocks/recommended-hotels-grid/_recommended-hotels-grid.json | aem-content | review | Authorable URL/path or content reference can require locale-aware decision. |  |
| recommended-hotels-grid | blocks/recommended-hotels-grid/_recommended-hotels-grid.json | gridCta_linkTarget | blocks/recommended-hotels-grid/_recommended-hotels-grid.json | select | do_not_translate | Technical/structural field, identifier, boolean/date/number, or asset reference. |  |
| recommended-hotels-grid | blocks/recommended-hotels-grid/_recommended-hotels-grid.json | gridCta_linkText | blocks/recommended-hotels-grid/_recommended-hotels-grid.json | text | translate | Editorial text shown to end users (including rich text, labels, and visible copy). |  |
| recommended-hotels-grid | blocks/recommended-hotels-grid/_recommended-hotels-grid.json | hotel_hotelName | blocks/recommended-hotels-grid/_recommended-hotels-grid.json | text | translate | Editorial text shown to end users (including rich text, labels, and visible copy). |  |
| recommended-hotels-grid | blocks/recommended-hotels-grid/_recommended-hotels-grid.json | hotel_location | blocks/recommended-hotels-grid/_recommended-hotels-grid.json | text | translate | Editorial text shown to end users (including rich text, labels, and visible copy). |  |
| recommended-hotels-grid | blocks/recommended-hotels-grid/_recommended-hotels-grid.json | hotel_priceFrom | blocks/recommended-hotels-grid/_recommended-hotels-grid.json | text | translate | Editorial text shown to end users (including rich text, labels, and visible copy). |  |
| recommended-hotels-grid | blocks/recommended-hotels-grid/_recommended-hotels-grid.json | hotel_stars | blocks/recommended-hotels-grid/_recommended-hotels-grid.json | select | do_not_translate | Technical/structural field, identifier, boolean/date/number, or asset reference. |  |
| recommended-hotels-grid | blocks/recommended-hotels-grid/_recommended-hotels-grid.json | media_image | blocks/recommended-hotels-grid/_recommended-hotels-grid.json | reference | do_not_translate | Technical/structural field, identifier, boolean/date/number, or asset reference. |  |
| recommended-hotels-grid | blocks/recommended-hotels-grid/_recommended-hotels-grid.json | media_imageAlt | blocks/recommended-hotels-grid/_recommended-hotels-grid.json | text | translate | Editorial text shown to end users (including rich text, labels, and visible copy). |  |
| recommended-hotels-grid | blocks/recommended-hotels-grid/_recommended-hotels-grid.json | tag_layout | blocks/recommended-hotels-grid/_recommended-hotels-grid.json | select | do_not_translate | Technical/structural field, identifier, boolean/date/number, or asset reference. |  |
| recommended-hotels-grid | blocks/recommended-hotels-grid/_recommended-hotels-grid.json | tag_tagLabel | blocks/recommended-hotels-grid/_recommended-hotels-grid.json | text | translate | Editorial text shown to end users (including rich text, labels, and visible copy). |  |
| recommended-hotels-grid | blocks/recommended-hotels-grid/_recommended-hotels-grid.json | title | blocks/recommended-hotels-grid/_recommended-hotels-grid.json | text | translate | Editorial text shown to end users (including rich text, labels, and visible copy). |  |
| topic-tag-cloud | blocks/topic-tag-cloud/_topic-tag-cloud.json | tagParentPage | blocks/topic-tag-cloud/_topic-tag-cloud.json | aem-content | review | Authorable URL/path or content reference can require locale-aware decision. |  |
| topic-tag-cloud | blocks/topic-tag-cloud/_topic-tag-cloud.json | tags | blocks/topic-tag-cloud/_topic-tag-cloud.json | aem-tag | review | Authorable URL/path or content reference can require locale-aware decision. |  |
| topic-tag-cloud | blocks/topic-tag-cloud/_topic-tag-cloud.json | title | blocks/topic-tag-cloud/_topic-tag-cloud.json | text | translate | Editorial text shown to end users (including rich text, labels, and visible copy). |  |
| topic-tag-cloud | blocks/topic-tag-cloud/_topic-tag-cloud.json | useArticleTags | blocks/topic-tag-cloud/_topic-tag-cloud.json | boolean | do_not_translate | Technical/structural field, identifier, boolean/date/number, or asset reference. |  |

## 5. Tabla de page properties / SEO
| property | source | type | classification | reason |
| --- | --- | --- | --- | --- |
| jcr:title | models/_page.json | text | translate | Primary page title / SEO title. |
| jcr:description | models/_page.json | text | translate | Primary page description / SEO description. |
| keywords | models/_page.json | text[] | review | SEO keywords are metadata; usually localized but governance-dependent. |
| navTitle | not-modeled | text | review | Not explicitly modeled here; include if present in AEM page metadata. |
| pageTitle | not-modeled | text | review | Not explicitly modeled here; include if present in AEM page metadata. |
| metaTitle | not-modeled | text | review | Not explicitly modeled here; include if present in SEO metadata. |
| metaDescription | not-modeled | text | review | Not explicitly modeled here; include if present in SEO metadata. |
| og:title | helix-query.yaml | meta | translate | OpenGraph visible preview title. |
| og:description | scripts/inspiration-data.js | meta | translate | OpenGraph visible preview description. |
| twitter:title | not-modeled | meta | review | Not explicitly queried in repo but should follow SEO translation policy. |
| twitter:description | not-modeled | meta | review | Not explicitly queried in repo but should follow SEO translation policy. |
| article-image-alt | models/_page.json | text | translate | Image accessibility text shown to users/AT. |
| article-category | models/_page.json | aem-tag | review | May be taxonomy ID or visible label depending on resolver. |
| article-tags | models/_page.json | aem-tag | review | May store tag IDs; rendering may localize labels later. |
| article-publication-date | models/_page.json | date-time | do_not_translate | Date field; format handled by locale/UI. |
| article-update-date | models/_page.json | date-time | do_not_translate | Date field; not translated directly. |
| article-visible | models/_page.json | boolean | do_not_translate | Boolean visibility flag. |

## 6. Tabla de placeholders
| placeholder | value/example | source | classification | reason |
| --- | --- | --- | --- | --- |
| readArticle | Read Article | placeholders.json | translate | Placeholder value is UI copy displayed to end users. |
| featuredArticle | Featured Article | placeholders.json | translate | Placeholder value is UI copy displayed to end users. |
| featuredColumnTitle | Featured | placeholders.json | translate | Placeholder value is UI copy displayed to end users. |
| latestColumnTitle | Latest Publications | placeholders.json | translate | Placeholder value is UI copy displayed to end users. |
| hotelsCarousel | Recommended hotels | placeholders.json | translate | Placeholder value is UI copy displayed to end users. |
| carouselPrevious | Previous hotels | placeholders.json | translate | Placeholder value is UI copy displayed to end users. |
| carouselNext | Next hotels | placeholders.json | translate | Placeholder value is UI copy displayed to end users. |
| carouselGoTo | Go to hotel group | placeholders.json | translate | Placeholder value is UI copy displayed to end users. |
| carouselOf | of | placeholders.json | translate | Placeholder value is UI copy displayed to end users. |
| from | From | placeholders.json | translate | Placeholder value is UI copy displayed to end users. |
| night | night | placeholders.json | translate | Placeholder value is UI copy displayed to end users. |
| viewAllHotels | View all hotels | placeholders.json | translate | Placeholder value is UI copy displayed to end users. |
| hotelPriceFromPrefix | From | placeholders.json | translate | Placeholder value is UI copy displayed to end users. |
| hotelPricePerNight | / night | placeholders.json | translate | Placeholder value is UI copy displayed to end users. |
| hotelPricePersonSingular | person | placeholders.json | translate | Placeholder value is UI copy displayed to end users. |
| hotelPricePersonPlural | people | placeholders.json | translate | Placeholder value is UI copy displayed to end users. |
| chooseLanguage | Choose a language | placeholders.json | translate | Placeholder value is UI copy displayed to end users. |
| close | Close | placeholders.json | translate | Placeholder value is UI copy displayed to end users. |
| readArticle (key) | readArticle | placeholders.json | do_not_translate | Placeholder key is a technical lookup identifier. |
| featuredArticle (key) | featuredArticle | placeholders.json | do_not_translate | Placeholder key is a technical lookup identifier. |
| featuredColumnTitle (key) | featuredColumnTitle | placeholders.json | do_not_translate | Placeholder key is a technical lookup identifier. |
| latestColumnTitle (key) | latestColumnTitle | placeholders.json | do_not_translate | Placeholder key is a technical lookup identifier. |
| hotelsCarousel (key) | hotelsCarousel | placeholders.json | do_not_translate | Placeholder key is a technical lookup identifier. |
| carouselPrevious (key) | carouselPrevious | placeholders.json | do_not_translate | Placeholder key is a technical lookup identifier. |
| carouselNext (key) | carouselNext | placeholders.json | do_not_translate | Placeholder key is a technical lookup identifier. |
| carouselGoTo (key) | carouselGoTo | placeholders.json | do_not_translate | Placeholder key is a technical lookup identifier. |
| carouselOf (key) | carouselOf | placeholders.json | do_not_translate | Placeholder key is a technical lookup identifier. |
| from (key) | from | placeholders.json | do_not_translate | Placeholder key is a technical lookup identifier. |
| night (key) | night | placeholders.json | do_not_translate | Placeholder key is a technical lookup identifier. |
| viewAllHotels (key) | viewAllHotels | placeholders.json | do_not_translate | Placeholder key is a technical lookup identifier. |
| hotelPriceFromPrefix (key) | hotelPriceFromPrefix | placeholders.json | do_not_translate | Placeholder key is a technical lookup identifier. |
| hotelPricePerNight (key) | hotelPricePerNight | placeholders.json | do_not_translate | Placeholder key is a technical lookup identifier. |
| hotelPricePersonSingular (key) | hotelPricePersonSingular | placeholders.json | do_not_translate | Placeholder key is a technical lookup identifier. |
| hotelPricePersonPlural (key) | hotelPricePersonPlural | placeholders.json | do_not_translate | Placeholder key is a technical lookup identifier. |
| chooseLanguage (key) | chooseLanguage | placeholders.json | do_not_translate | Placeholder key is a technical lookup identifier. |
| close (key) | close | placeholders.json | do_not_translate | Placeholder key is a technical lookup identifier. |

## 7. Tabla de helix-query.yaml fields
| field | selector/value | source | classification | reason |
| --- | --- | --- | --- | --- |
| title | meta[property="og:title"] | helix-query.yaml | translate | User-facing title used in article/page listings. |
| description | meta[name="description"] | helix-query.yaml | translate | User-facing summary text used in listings. |
| image | meta[name="article-image"] | helix-query.yaml | do_not_translate | Asset URL/path reference. |
| ogImage | meta[property="og:image"] | helix-query.yaml | do_not_translate | Asset URL/path reference. |
| imageAlt | meta[name="article-image-alt"] | helix-query.yaml | translate | Image alt text. |
| imageAltLocalized | meta[name="alt_es"] | helix-query.yaml | translate | Localized image alt text. |
| imageDcDescription | meta[name="dc:description"] | helix-query.yaml | review | Could be metadata or display copy depending on usage. |
| imageAutogenDescription | meta[name="autogen:description"] | helix-query.yaml | do_not_translate | Auto-generated technical metadata. |
| authorName | meta[name="article-author-name"] | helix-query.yaml | translate | Visible editorial author name. |
| author | meta[name="article-author"] | helix-query.yaml | review | May be ID/slug or author display name depending on authoring. |
| authorImage | meta[name="article-author-image"] | helix-query.yaml | do_not_translate | Asset URL/path reference. |
| category | meta[name="article-category"] | helix-query.yaml | review | Could be taxonomy ID or rendered label. |
| categoryPath | meta[name="article-category-path"] | helix-query.yaml | do_not_translate | Taxonomy path / technical locator. |
| tags | meta[name="article-tags"] | helix-query.yaml | review | Could be tag IDs or localized labels. |
| publicationDate | meta[name="article-publication-date"] | helix-query.yaml | do_not_translate | Date value. |
| publicationTimestamp | parseTimestamp(article-publication-date) | helix-query.yaml | do_not_translate | Computed numeric timestamp. |
| updateDate | meta[name="article-update-date"] | helix-query.yaml | do_not_translate | Date value. |
| readTime | meta[name="article-read-time"] | helix-query.yaml | translate | Visible reading-time copy. |
| featured | meta[name="article-featured"] | helix-query.yaml | do_not_translate | Boolean/flag. |
| visible | meta[name="article-visible"] | helix-query.yaml | do_not_translate | Boolean/flag. |
| robots | meta[name="robots"] | helix-query.yaml | do_not_translate | SEO crawler directive. |
| lastModified | headers["last-modified"] | helix-query.yaml | do_not_translate | HTTP technical timestamp. |
| path | path | helix-query.yaml | do_not_translate | Technical content path. |

## 8. Tabla de campos detectados solo en JS
| block | file | property | source | type | classification | reason | example if found |
| --- | --- | --- | --- | --- | --- | --- | --- |
| hero | blocks/hero/hero.js | alt (cells[1]) | fallback-index | text | translate | Visible image alt text from positional legacy rows. | cells[1] |
| hero | blocks/hero/hero.js | metadata (cells[1]) | fallback-index | richtext | translate | Visible metadata text in article hero variant. | cells[1].innerHTML |
| hero | blocks/hero/hero.js | title (cells[2]) | fallback-index | text | translate | Visible hero title fallback. | cells[2] |
| hero | blocks/hero/hero.js | subtitle (cells[3]) | fallback-index | text/richtext | translate | Visible hero subtitle fallback. | cells[3] |
| lead-subscription-form | blocks/lead-subscription-form/lead-subscription-form.js | placeholder / submitLabel / errors / success* (cells[4..10]) | fallback-index | text | translate | Newsletter UX copy rendered directly in form. | cells[4..10] |
| editorial-highlight-grid | blocks/editorial-highlight-grid/editorial-highlight-grid.js | manual summary (cells[2]) | fallback-index | text | translate | Manual article summary text shown in card. | cells[2] |
| editorial-highlight-grid | blocks/editorial-highlight-grid/editorial-highlight-grid.js | manual href (cells[3]) | fallback-index | url | review | Authorable internal/external article link. | cells[3] |
| carousel-category-gallery | blocks/carousel-category-gallery/carousel-category-gallery.js | icon (cells[0]) | fallback-index | text | do_not_translate | Icon name/token, not editorial copy. | cells[0] |
| carousel-category-gallery | blocks/carousel-category-gallery/carousel-category-gallery.js | title (cells[2]) | fallback-index | text | translate | Visible card title. | cells[2] |
| carousel-category-gallery | blocks/carousel-category-gallery/carousel-category-gallery.js | link (cells[3]) | fallback-index | url | review | Authorable internal/external link. | cells[3] |
| editorial-article-grid | blocks/editorial-article-grid/editorial-article-grid.js | legacy title/category/link by cells[1..3] | fallback-index | mixed | review | Combines visible text with URL/category that may be IDs. | cells[1], cells[2], cells[3] |
| footer-links | blocks/footer-links/footer-links.js | flat fallback chunk [label,url,target,nofollow] | fallback-index | mixed | review | Contains both translatable labels and technical link options. | groups of four cells |
| nav-language | blocks/nav-language/nav-language.js | label/url/target by cells[0..2] | fallback-index | mixed | review | Label is translatable while URL/target are technical. | cells[0], cells[1], cells[2] |
| recommended-dynamic-hotels-grid | blocks/recommended-dynamic-hotels-grid/recommended-dynamic-hotels-grid.js | hotelCode/destination/tagLabel positional fallback | fallback-index | mixed | review | hotelCode is technical; destination/tag label may be visible text. | cells[0], cells[1], cells[4] |
| hotel-mini-card | blocks/hotel-mini-card/hotel-mini-card.js | positional field matrix by row/cell | fallback-index | mixed | review | Includes mixed technical and visible values in positional mode. | FIELD_POSITIONS |
| article-content-video | blocks/article-content-video/article-content-video.js | videoType fallback from first row | fallback-index | select | do_not_translate | Technical mode selector (dam/youtube). | sourceRows[0] |

## 9. Tabla de campos ambiguos que requieren revision
| property | source | classification | reason |
| --- | --- | --- | --- |
| link | models/blocks/js | review | Could represent visible localized navigation labels or technical IDs/paths. |
| url | models/blocks/js | review | Could represent visible localized navigation labels or technical IDs/paths. |
| homeUrl | models/blocks/js | review | Could represent visible localized navigation labels or technical IDs/paths. |
| article_url | models/blocks/js | review | Could represent visible localized navigation labels or technical IDs/paths. |
| article_categoryUrl | models/blocks/js | review | Could represent visible localized navigation labels or technical IDs/paths. |
| gridCta_link | models/blocks/js | review | Could represent visible localized navigation labels or technical IDs/paths. |
| cta_link | models/blocks/js | review | Could represent visible localized navigation labels or technical IDs/paths. |
| tagParentPage | models/blocks/js | review | Could represent visible localized navigation labels or technical IDs/paths. |
| manualArticle1 | models/blocks/js | review | Could represent visible localized navigation labels or technical IDs/paths. |
| manualArticle2 | models/blocks/js | review | Could represent visible localized navigation labels or technical IDs/paths. |
| manualArticle3 | models/blocks/js | review | Could represent visible localized navigation labels or technical IDs/paths. |
| featuredArticlePath | models/blocks/js | review | Could represent visible localized navigation labels or technical IDs/paths. |
| destination | models/blocks/js | review | Could represent visible localized navigation labels or technical IDs/paths. |
| category | models/blocks/js | review | Could represent visible localized navigation labels or technical IDs/paths. |
| tags | models/blocks/js | review | Could represent visible localized navigation labels or technical IDs/paths. |
| article-category | models/blocks/js | review | Could represent visible localized navigation labels or technical IDs/paths. |
| article-tags | models/blocks/js | review | Could represent visible localized navigation labels or technical IDs/paths. |
| placeholders key format | scripts/iberostar/placeholders.js | review | Parser supports multiple key/value aliases; ensure translation rules target value columns, not keys. |
| destinationText alias | blocks/hotel-graphql-mini-card/hotel-graphql-mini-card.js | review | Alias exists in JS but not consistently modeled; verify authoring contract. |

## 10. Lista final consolidada
### properties_to_translate
- alt (cells[1])
- article-author-description
- article-author-name
- article-image-alt
- article-read-time
- article_authorName
- article_cta
- article_description
- article_imageAlt
- article_publicationDate
- article_readTime
- article_title
- attribution
- authorName
- background_buttonLabel
- background_errorCheckMessage
- background_errorEmailMessage
- background_errorGenericMessage
- background_placeholder
- background_successHeading
- background_successMessage
- caption
- cardCtaLabel
- carouselGoTo.Text
- carouselNext.Text
- carouselOf.Text
- carouselPrevious.Text
- chooseLanguage.Text
- close.Text
- ctaLabel
- ctaText
- cta_linkText
- currentLabel
- description
- display_badge
- eyebrow
- featuredArticle.Text
- featuredBadge
- featuredColumnTitle.Text
- featuredLabel
- featured_heading
- from.Text
- gridCta_linkText
- hero_subtitle
- hero_title
- homeLabel
- hotelPriceFromPrefix.Text
- hotelPricePerNight.Text
- hotelPricePersonPlural.Text
- hotelPricePersonSingular.Text
- hotel_hotelName
- hotel_location
- hotel_priceFrom
- hotelsCarousel.Text
- imageAlt
- imageAltLocalized
- jcr:description
- jcr:title
- label
- latestColumnTitle.Text
- latestLabel
- latest_heading
- legal
- linkLabel
- linkText
- linkTitle
- logoAlt
- manual summary (cells[2])
- media_imageAlt
- metadata (cells[1])
- modalHeading
- night.Text
- og:description
- og:title
- placeholder / submitLabel / errors / success* (cells[4..10])
- posterAlt
- pretitle
- readArticle.Text
- readTime
- subtitle
- subtitle (cells[3])
- tag_tagLabel
- text
- title
- title (cells[2])
- viewAllHotels.Text
- viewAllText

### properties_to_not_translate
- action
- article-author-image
- article-image
- article-internal-name
- article-publication-date
- article-update-date
- article-visible
- article_image
- authorImage
- background
- carouselGoTo (key)
- carouselNext (key)
- carouselOf (key)
- carouselPrevious (key)
- categoryPath
- chooseLanguage (key)
- close (key)
- columns
- ctaTarget
- cta_linkTarget
- featured
- featuredArticle (key)
- featuredColumnTitle (key)
- footer
- from (key)
- gridCta_linkTarget
- hotelCode
- hotelPriceFromPrefix (key)
- hotelPricePerNight (key)
- hotelPricePersonPlural (key)
- hotelPricePersonSingular (key)
- hotel_stars
- hotelsCarousel (key)
- icon
- icon (cells[0])
- image
- imageAutogenDescription
- inspiration-data-mode
- lastModified
- latestColumnTitle (key)
- linkNofollow
- linkTarget
- linkType
- logo
- maxItems
- media_image
- method
- mode
- name
- nav
- night (key)
- ogImage
- page-type
- pageSize
- path
- poster
- publicationDate
- publicationTimestamp
- readArticle (key)
- reference
- robots
- rows
- style
- tag_layout
- target
- updateDate
- useArticleTags
- variant
- videoDam
- videoType
- videoType fallback from first row
- viewAllHotels (key)
- visible
- youtubeVideoId

### properties_to_review
- alignment
- article
- article-category
- article-tags
- article_authorImage
- article_category
- article_categoryUrl
- article_placement
- article_url
- author
- cardHeading
- category
- classes
- cta
- cta_link
- destination
- destinationText alias
- display_articleHeading
- eyebrowHeading
- featuredArticlePath
- featuredArticleTitleHeading
- featuredLabelHeading
- featured_headingLevel
- filterTags
- flat fallback chunk [label,url,target,nofollow]
- gridCta_link
- hero_icon
- hero_subtitleHeading
- hero_titleHeading
- homeUrl
- hotelCode/destination/tagLabel positional fallback
- imageDcDescription
- keywords
- label/url/target by cells[0..2]
- latestArticleTitleHeading
- latestLabelHeading
- latest_headingLevel
- legacy title/category/link by cells[1..3]
- link
- link (cells[3])
- linkUrl
- links
- logoDesktop
- manual href (cells[3])
- manualArticle1
- manualArticle2
- manualArticle3
- metaDescription
- metaTitle
- navTitle
- pageTitle
- placeholders key format
- positional field matrix by row/cell
- source
- subcategoriesHeadingTag
- subcategory1Url
- subcategory2Url
- subcategory3Url
- subcategory4Url
- subcategory5Url
- subcategory6Url
- subcategory7Url
- subcategory8Url
- subcategory9Url
- tagParentPage
- tags
- titleHeading
- titleType
- twitter:description
- twitter:title
- url
- viewAllLink
- viewAllTarget

## 11. Recomendacion para translation rules
- Incluir automaticamente todos los campos con clasificacion translate en reglas de traduccion de paginas y componentes.
- Excluir explicitamente do_not_translate para evitar sobretraducciones de IDs, flags, rutas y metadatos tecnicos.
- Mantener una regla review con aprobacion editorial/arquitectura para URL authorables, category/tags y aliases JS ambiguos.
- En placeholders, traducir solo valores (Text/value/copy), nunca keys tecnicas.
- Para bloques con fallback por indice, mapear reglas por posicion cuando falte data-aue-prop en HTML publicado.

## 12. Riesgos detectados
- category/tags pueden venir como IDs tecnicos o como texto visible segun flujo (modelo, meta o query).
- Algunos enlaces authorables pueden requerir relocalizacion de rutas entre idiomas (no traduccion literal).
- Campos legacy/fallback por indice pueden romper trazabilidad si cambia el orden de celdas en authored content.
- Metadatos SEO extendidos (metaTitle/metaDescription/navTitle/twitter:*) no aparecen como modelo explicito, pero pueden existir en runtime AEM.

## 13. Page alias / URL strategy
1. Existencia de sling:alias en modelos/page properties/contenido:
No se encontro sling:alias en los modelos XWalk (models/*.json, blocks/*/_*.json) ni en JS del proyecto. Se mantiene como propiedad esperada de AEM a confirmar en contenido real del repositorio.

2. Uso de path real vs alias en componentes EDS:
Los componentes trabajan mayoritariamente con path. El helper [scripts/iberostar/page-links.js](scripts/iberostar/page-links.js) convierte entre rutas /content/... y rutas publicas /{locale}/..., pero no resuelve alias explicitamente.

3. helix-query.yaml indexa alias o solo path:
[helix-query.yaml](helix-query.yaml) indexa path y metadatos, pero no indexa sling:alias ni campo alias dedicado.

4. query-index.json devuelve path con node name o con alias:
En runtime, query-index y articles-index exponen solo path (sin campo alias separado). Ejemplos observados: /es-es/inspiration-guide/articles/12-razones-para-visitar-la-catedral-de-palma-de-mallorca y /es-es/inspiration-guide/category/destinos/mallorca. Con ese payload no se puede demostrar por si solo si el segmento proviene de node name o alias.

5. Helpers que generan links de articulos usando slug manualmente:
Si faltan rutas completas, hay fallback a slug/id en [scripts/inspiration-data.js](scripts/inspiration-data.js), y construccion de href por slug en [blocks/recommended-dynamic-hotels-grid/recommended-dynamic-hotels-grid.js](blocks/recommended-dynamic-hotels-grid/recommended-dynamic-hotels-grid.js) y [blocks/hotel-graphql-mini-card/hotel-graphql-mini-card.js](blocks/hotel-graphql-mini-card/hotel-graphql-mini-card.js).

6. Recomendacion para que links publicos usen alias cuando exista:
- page node name / jcr:name: do_not_translate.
- sling:alias / page alias: review (slug controlado).
- Si existe propiedad especifica de slug publico del proyecto: review.
- En tags: name/id tecnico do_not_translate; title/label visible translate.
- Resolver enlaces publicos con alias cuando exista, manteniendo estable el nombre real del nodo.

