# Universal Editor Alignment Analysis

> Análisis del estado del proyecto respecto a `upstream/main` (`adobe-rnd/aem-boilerplate-xwalk`) y al funcional `FuncionalArticuloEDS.pdf`
> Fecha: 2026-06-29 | Rama analizada: `main`

---

## Análisis funcional: Página de Artículo

Fuente: `docs/FuncionalArticuloEDS.pdf`
Figma principal: https://www.figma.com/design/GaMFo2taDJTgtnCosw0IT3/2.-Ready-for-dev--SHARED-?node-id=24254-38666

### Estructura de la página

La página de artículo se compone de **3 zonas**:

1. **Columna izquierda** (`section.article-main`): Hero Article Detail + Editorial Article Content
2. **Columna derecha** (`section.article-sidebar`): Editorial Article Banner
3. **Full width** (secciones normales): Recommended Hotels Grid, Topic Tag Cloud, Grid Category Gallery, Editorial Article Grid, Lead Subscription Form

> ✅ El layout de 2 columnas (`applyArticleTwoColumnLayout`) ya está implementado en `scripts/scripts.js` y los estilos `article-main` / `article-sidebar` están en `models/_section.json`.

---

### Inventario de componentes: estado de implementación

| Componente | Bloque | Estado | Observaciones |
|---|---|---|---|
| Hero Article Detail | `hero-article-detail` | ⚠️ Parcial | Ver detalle |
| Editorial Article Banner | `editorial-article-banner` | ⚠️ Parcial | Faltan encabezados SEO |
| Editorial Article Content | `editorial-article-content` | 🔴 Incompleto | Solo texto; faltan Imagen, Vídeo, Hotel, Tabla |
| Recommended Hotels Grid (variante IG) | `recommended-hotels-grid` | ⚠️ Parcial | Falta filtro por destino CF |
| Topic Tag Cloud | `topic-tag-cloud` | ⚠️ Parcial | Falta auto desde tags del artículo |
| Grid Category Gallery | `grid-category-gallery` | ✅ Completo | Reutilizado de Home |
| Editorial Article Grid (variante artículo) | `editorial-article-grid` | ⚠️ Parcial | Faltan eyebrow, categoría card, CTA; modos auto leen URL no metadata |
| Lead Subscription Form | `lead-subscription-form` | ✅ Completo | Fondo gris disponible |

---

### Detalle por componente

#### 1. Hero Article Detail
**Figma:** https://www.figma.com/design/GaMFo2taDJTgtnCosw0IT3/2.-Ready-for-dev--SHARED-?node-id=24254-40522

| Campo funcional | Estado | Notas |
|---|---|---|
| Título H1 (override con fallback a jcr:title) | ✅ | Lee metadata |
| Descripción/extracto P (override con fallback) | ✅ | Lee metadata |
| Categoría de primer nivel con enlace | ✅ | Parsea `article-category` |
| Fecha de publicación | ✅ | Formateada con `Intl.DateTimeFormat` |
| Tiempo de lectura | ✅ | Desde metadata `article-read-time` |
| Botón compartir (share nativo) | ✅ | Con fallback a clipboard |
| Foto y nombre del autor | ✅ | Desde metadata `article-author-*` |
| **Check para mostrar/ocultar autor** | ❌ | Siempre muestra si hay metadata |
| **Check para mostrar/ocultar módulo de destino** | ❌ | No implementado |
| **Módulo de destino** (bloque de destino relacionado) | ❌ | No implementado |
| **Encabezado SEO del título** (selector H1/H2) | ❌ | Hardcoded H1 |
| **Encabezado SEO de la descripción** | ❌ | Hardcoded P |
| **Texto introducción richtext** (negritas, listas, enlaces) | ❌ | Subtítulo es texto plano |
| **Imagen destacada** (override desde DAM) | ⚠️ | Delegado a `article-main-image` (bloque separado) |
| **Modelo UE con campos configurables** | ❌ | `"fields": []` vacío — no configurable en UE |

**Resumen:** El bloque lee bien los metadatos del artículo y renderiza los elementos base. Falta configurabilidad desde el UE (modelo vacío), el módulo de destino y los checks de autor/destino.

---

#### 2. Editorial Article Banner
**Figma:** https://www.figma.com/design/GaMFo2taDJTgtnCosw0IT3/2.-Ready-for-dev--SHARED-?node-id=24254-40522

| Campo funcional | Estado | Notas |
|---|---|---|
| Título (override con fallback al artículo) | ✅ | |
| Descripción (override con fallback) | ✅ | |
| Texto del link | ✅ | |
| URL del link | ✅ | |
| Link target (_self / _blank) | ✅ | |
| **Encabezado SEO del título** | ❌ | No hay selector de heading |
| **Encabezado SEO de la descripción** | ❌ | No hay selector de heading |
| Título como `<p>` | ✅ | Funcional: "Título y descripción es un P" |
| Botón como `<a>` (href) | ✅ | Funcional: "Botón es href" |

---

#### 3. Editorial Article Content
**Figma:** https://www.figma.com/design/GaMFo2taDJTgtnCosw0IT3/2.-Ready-for-dev--SHARED-?node-id=24254-40523

Este es el bloque más complejo del funcional: un contenedor multifield con items de distintos tipos.

| Tipo de contenido | Estado | Notas |
|---|---|---|
| **Tipo Texto** — richtext (negritas, listas, quotations, enlaces) | ⚠️ | Renderiza richtext pero sin soporte de `<blockquote>` verificado |
| **Tipo Imagen** — imagen DAM + descripción pie de foto (lazy) | ❌ | No implementado |
| **Tipo Vídeo** — CF de Vídeo + descripción + placeholder/play | ❌ | No implementado |
| **Tipo Hotel** — minicard (imagen, estrellas, nombre, destino, precio, enlace) | ❌ | No implementado como tipo dentro del content |
| **Tipo Tabla** — `<table>` con `<thead>`, `<tbody>`, `<caption>` | ❌ | No implementado |
| Título general H2 | ❌ | No existe campo de título en el modelo |
| Títulos de items H3 | ❌ | No hay items tipados |
| **Modelo UE multifield** con selector de tipo | ❌ | Modelo actual solo tiene 1 campo `text` richtext |

**Resumen:** La implementación actual solo soporta el Tipo Texto básico. El funcional requiere un multifield tipado (Texto/Imagen/Vídeo/Hotel/Tabla) que es una reescritura sustancial del bloque y su modelo.

---

#### 4. Recommended Hotels Grid (variante Inspiration Guide)
**Figma:** https://www.figma.com/design/GaMFo2taDJTgtnCosw0IT3/2.-Ready-for-dev--SHARED-?node-id=24254-40524

| Campo funcional | Estado | Notas |
|---|---|---|
| Antetítulo (eyebrow) | ✅ | Campo `eyebrow` |
| Título con selector heading | ✅ | Campo `titleType` (h2/h3) |
| CTA (texto + enlace) | ✅ | Campos `cta_linkText` + `cta_link` |
| Lista de hoteles (multifield CF) | ✅ | Items tipo `hotel-mini-card` |
| Slider responsive | ✅ | Implementado |
| **Destino (CF de destino)** | ❌ | No existe en el modelo |
| **Unión hoteles de destino + lista manual** sin repetir | ❌ | No implementado |
| **Orden general de hoteles** (administración de ordenaciones) | ❌ | Sin lógica de ordenación global |
| **Límite hard de 12 cards** | ⚠️ | `maxItems` es configurable pero no está limitado a 12 |

---

#### 5. Topic Tag Cloud
**Figma:** https://www.figma.com/design/GaMFo2taDJTgtnCosw0IT3/2.-Ready-for-dev--SHARED-?node-id=24254-39460

| Campo funcional | Estado | Notas |
|---|---|---|
| Título de sección | ✅ | |
| Modo manual (tags contribuidos) | ✅ | |
| **Auto desde tags del artículo actual** | ❌ | Modos actuales usan lógica genérica de frecuencia/categoría; no leen tags de la página actual |
| URLs de los chips a páginas de tag | ⚠️ | Formato `/tag/{name}` — necesita validar contra taxonomía real |
| maxTags | ✅ | |

---

#### 6. Grid Category Gallery
**Figma:** https://www.figma.com/design/GaMFo2taDJTgtnCosw0IT3/2.-Ready-for-dev--SHARED-?node-id=24254-39462

✅ **Completo.** Mismo bloque que en Home. Título, subtítulo, CTA, cards con imagen/título/subtítulo/link, maxItems. No se requieren cambios.

---

#### 7. Editorial Article Grid (variante artículo)
**Figma:** https://www.figma.com/design/GaMFo2taDJTgtnCosw0IT3/2.-Ready-for-dev--SHARED-?node-id=24254-40525

| Campo funcional | Estado | Notas |
|---|---|---|
| Modo Manual (3 artículos contribuidos) | ✅ | |
| Modo Auto por Tag | ⚠️ | Lee tag desde la **URL** (`/tag/...`), no desde los tags metadata del artículo actual |
| Modo Auto por Categoría | ⚠️ | Lee categoría desde la **URL** (`/category/...`), no desde el árbol de categorías del artículo |
| **Antetítulo (eyebrow)** | ❌ | No existe en modelo ni render |
| **Encabezado SEO del antetítulo y del título** | ❌ | No implementado |
| SEO: Antetítulo H2, Título P | ❌ | Sin antetítulo implementado |
| SEO: Categoría de cada card como P | ❌ | No se muestra la categoría en la card |
| SEO: Título de cada card como H3 | ✅ | `<h3>` con enlace |
| **CTA fijo "Leer artículo"** por card | ❌ | El título es el único enlace, sin CTA separado |
| Límite de 3 artículos | ⚠️ | `maxItems` configurable, funcional pide 3 fijo en esta variante |

---

#### 8. Lead Subscription Form
**Figma:** https://www.figma.com/design/GaMFo2taDJTgtnCosw0IT3/2.-Ready-for-dev--SHARED-?node-id=11291-33583

✅ **Completo.** Título, descripción, texto legal richtext (checkbox), selector de fondo (blanco/gris). El funcional especifica fondo gris para la variante artículo — disponible como opción.

---

### Backlog de desarrollo por prioridad

#### 🔴 Crítico (bloque no funcional según spec)

1. **`editorial-article-content`** — Reescritura del modelo y bloque:
   - Modelo UE: multifield `items[]` con campo `type` (text/image/video/hotel/table)
   - Subbloque Tipo Imagen: `reference` imagen + `text` descripción
   - Subbloque Tipo Vídeo: `aem-content` CF vídeo + `text` descripción + player con placeholder
   - Subbloque Tipo Hotel: `aem-content` CF hotel → render `hotel-mini-card`
   - Subbloque Tipo Tabla: soporte de `<table>` con `<caption>`, `<thead>`, `<tbody>`

2. **`hero-article-detail`** — Completar modelo UE y campos:
   - Añadir campos al modelo: `titleHeading`, `descriptionHeading`, `showAuthor` (boolean), `showDestination` (boolean)
   - Implementar módulo de destino
   - Richtext para el texto de introducción

#### 🟡 Importante (funcional incompleto)

3. **`editorial-article-grid`** — Completar variante artículo:
   - Añadir campo `eyebrow` al modelo y al render (H2)
   - Añadir campo `title` con heading configurable (P según funcional)
   - Añadir categoría a cada card (P)
   - Añadir CTA "Leer artículo" a cada card
   - Corregir modos auto: leer tags/categorías del **metadata** de la página actual, no de la URL

4. **`recommended-hotels-grid`** — Variante Inspiration Guide:
   - Añadir campo `destinationCf` (referencia a CF de destino)
   - Implementar lógica de unión: hoteles del destino ∪ hoteles manuales (sin duplicados)
   - Limitar a 12 cards máximo (hard limit)

5. **`topic-tag-cloud`** — Auto desde artículo:
   - Implementar modo que lee los tags del metadata del artículo actual (`article-tags`) y genera los chips

#### 🟢 Menor

6. **`editorial-article-banner`** — Añadir selectores de heading SEO (`titleHeading`, `descriptionHeading`)

7. **`hero-article-detail`** — Verificar que la imagen featured no tiene `loading="lazy"` (Above The Fold)

---

---

## Infraestructura base

| Archivo | Estado |
|---|---|
| `scripts/aem.js` | ✅ Idéntico al upstream (711 líneas, 0 diferencias) |
| `scripts/editor-support-rte.js` | ✅ Sin cambios |
| `package.json` / `package-lock.json` | ✅ Solo diferencia menor de 1 dependencia interna |

---

## 🔴 Problema crítico: `editor-support.js` desactualizado

Nuestra versión (81 líneas) es la anterior al refactor de seguridad del upstream.

| Nuestra versión | Upstream |
|---|---|
| Parsea HTML sin sanitizar con `DOMParser` | **Sanitiza con `DOMPurify`** antes de parsear (fix XSS) |
| Sin serialización de cambios concurrentes | `promiseChanges$` evita race conditions al editar rápido |
| No maneja actualizaciones del `<main>` completo | Soporte completo para redecorate de `main` |
| `element` se busca en el HTML recibido (no en el DOM) | `element` se busca en el **DOM vivo** — más robusto |
| Bloque nuevo no se oculta durante el swap | `style.display = 'none'` evita flash durante reload |
| No importa `decorateMain` | Importa y usa `decorateMain` para updates de página completa |

---

## 🟡 `scripts.js` — customizaciones con impacto en UE

Nuestro `scripts.js` tiene adiciones funcionales legítimas que no existen en el upstream. Son intencionales, pero algunas tienen efecto secundario en el editor:

| Customización | Impacto UE |
|---|---|
| `decorateRichtext(main)` en `decorateMain` | ⚠️ Doble decoración richtext cuando el UE recarga un bloque |
| `applyPageMetadataState()` → `page-${type}` en body | ✅ Sin impacto en UE |
| `applyArticleTwoColumnLayout()` | ✅ Tiene guard `isUniversalEditorPage`, no afecta |
| `isFragmentPage` → skip header/footer | ✅ Sin impacto en UE |
| Carga condicional de `editor-support.js` | ⚠️ Si la página no tiene `data-aue-resource` al cargar, el editor no funcionará |

---

## Estado UE por bloque

### ✅ Con `moveInstrumentation` (patrón correcto para items repetibles)
- `cards`
- `carousel-category-gallery`
- `grid-category-gallery`

### ✅ Con patrón fuente/render (preservan filas `data-aue-*`, añaden render como hermano)
- `blog-split-list`
- `breadcrumbs`
- `editorial-article-banner`
- `editorial-article-content`
- `editorial-highlight-grid`
- `hero-blog`
- `hero-article-detail`
- `article-main-image`
- `hotel-mini-card`
- `recommended-hotels-grid`
- `header-brand`
- `header`

### 🔴 Sin ningún patrón UE (destruyen DOM con `replaceChildren` sin migrar instrumentación)
- `hero`
- `editorial-article-grid`
- `editorial-split-article`
- `featured-articles`
- `lead-subscription-form`
- `topic-tag-cloud`

### ⚪ Sin edición authoring prevista (fragmentos o navegación global)
- `nav-hotels`
- `nav-language`
- `nav-search`
- `footer`
- `fragment`

---

## Modelos y filtros (`_*.json`)

✅ Bien estructurados. Todos los bloques están registrados en `models/_section.json` y `component-filters.json`. Los modelos son más ricos que el upstream (variants en hero, campos `select`, `multiselect`).

---

## Recomendaciones priorizadas

### 1. Actualizar `editor-support.js` al upstream
Cambio directo que soluciona un problema de seguridad (XSS vía HTML no sanitizado) y mejora la estabilidad del editor. No afecta a ningún bloque existente.

Ver referencia: [`adobe-rnd/aem-boilerplate-xwalk — scripts/editor-support.js`](https://github.com/adobe-rnd/aem-boilerplate-xwalk/blob/main/scripts/editor-support.js)

### 2. Eliminar `decorateRichtext` de `decorateMain` en `scripts.js`
Llamar `decorateRichtext` dentro de `decorateMain` causa doble decoración cuando el UE recarga un bloque. El upstream lo llama únicamente desde `editor-support.js`.

```diff
// scripts/scripts.js → decorateMain()
 export function decorateMain(main) {
   decorateIcons(main);
-  decorateRichtext(main);
   buildAutoBlocks(main);
   decorateSections(main);
   applyArticleTwoColumnLayout(main);
   decorateBlocks(main);
   decorateButtons(main);
 }
```

### 3. Aplicar `moveInstrumentation` en bloques editoriales sin UE
Los siguientes bloques hacen `block.replaceChildren(wrapper)` sin migrar los atributos `data-aue-*`:
- `hero`, `editorial-article-grid`, `editorial-split-article`, `featured-articles`, `lead-subscription-form`, `topic-tag-cloud`

Patrón a aplicar (ver `cards.js` como referencia):
```js
import { moveInstrumentation } from '../../scripts/scripts.js';

// Al transformar cada fila en su elemento renderizado:
moveInstrumentation(sourceRow, renderedElement);
```

### 4. Referencia para nuevos desarrollos: patrón fuente/render
Para bloques con configuración en el UE, usar el patrón de `blog-split-list` / `recommended-hotels-grid`:
- Filtrar filas fuente con `getSourceRows()` (excluir el nodo `-rendered`)
- Leer campos via `data-aue-prop` en lugar de por índice de celda
- Añadir el nodo renderizado como hermano (no reemplazar las filas fuente)
- Ocultar filas fuente con CSS: `.block > div:not(.block-rendered) { display: none }`

---

## Contexto del upstream

El boilerplate `aem-boilerplate-xwalk` solo incluye 6 bloques base:
`cards`, `columns`, `footer`, `fragment`, `header`, `hero`

Los 19 bloques adicionales del proyecto son todos personalizados para Iberostar Inspiration Guide y no tienen equivalente en el upstream.
