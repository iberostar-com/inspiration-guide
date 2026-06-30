# Sistema de i18n en EDS (Inspiration Guide)

## Estructura

```
/es-es/i18n.json     ← Traducciones en español
/en-us/i18n.json     ← Traducciones en inglés
/ca-es/i18n.json     ← Traducciones en catalán (si aplica)
```

Cada archivo contiene pares clave-valor:

```json
{
  "readArticle": "Leer artículo",
  "featuredArticle": "Artículo destacado",
  "latestColumnTitle": "Últimas publicaciones"
}
```

## Uso en JavaScript

### En bloques (ej: blog-split-list)

```javascript
import { getTranslation } from '../../scripts/iberostar/i18n.js';

export default async function decorate(block) {
  // Opción 1: Obtener traducción con fallback
  const readLabel = await getTranslation('readArticle', 'Leer artículo');
  
  // Opción 2: Cascada de fuentes (i18n → placeholders → fallback hardcoded)
  const ctaLabel = await getTranslation('readArticle')
    || await getPlaceholder('readArticle', 'Leer artículo');
  
  // Opción 3: Pre-cargar todas las traducciones de una vez
  const i18nData = await loadI18nData();
  const label = i18nData.readArticle || 'Leer artículo';
}
```

## Uso en HTML/Placeholders (scripts/iberostar/placeholders.js)

El módulo de placeholders también puede usar i18n como fallback:

```javascript
export async function getPlaceholder(key, fallback = '') {
  const locale = getCurrentLocale();
  const data = await fetchI18nData(locale);
  return data[key] || fallback;
}
```

## Detección de idioma

El sistema detecta automáticamente el idioma según:

1. **URL path** (prioridad alta): `/es-es/` → `es-es`
2. **HTML lang attribute**: `<html lang="en-us">` → `en-us`
3. **Fallback**: `en` (inglés por defecto)

Ejemplos:
- `http://localhost:3000/es-es/inspiration-guide/` → Carga `/es-es/i18n.json`
- `http://localhost:3000/en-us/inspiration-guide/` → Carga `/en-us/i18n.json`
- Si falla cargar `/es-es/i18n.json`, intenta `/i18n/es-es.json` y finalmente `/i18n.json`

## API Completa

### `getTranslation(key, fallback = '')`

Obtiene una traducción asincrónica para la clave en el idioma actual.

```javascript
const label = await getTranslation('readArticle', 'Read Article');
```

- **key**: Clave de traducción (string)
- **fallback**: Valor por defecto si la clave no existe (string)
- **Retorna**: Promise<string>
- **Comportamiento**: Si falta en idioma actual, intenta inglés, luego retorna fallback

### `getTranslationSync(data, key, fallback = '')`

Obtiene traducción sincrónica cuando ya tienes los datos cargados.

```javascript
const i18nData = await loadI18nData();
const label = getTranslationSync(i18nData, 'readArticle', 'Read');
```

- **data**: Objeto con traducciones (obtenido de `loadI18nData()`)
- **key**: Clave de traducción (string)
- **fallback**: Valor por defecto (string)
- **Retorna**: string

### `loadI18nData(locale = null)`

Pre-carga todas las traducciones de una vez.

```javascript
const i18nData = await loadI18nData('es-es');
const readLabel = i18nData.readArticle;
```

- **locale**: Idioma específico (opcional; usa locale actual si omitido)
- **Retorna**: Promise<Object> con todas las traducciones

## Cache

El sistema cachea automáticamente los datos en memoria (`I18N_CACHE`):
- Primera carga: Fetch desde JSON
- Siguientes usos: Desde cache (sin fetch)
- Persiste durante toda la sesión

## Fallback Chain (Cascada)

Si una clave no existe:

1. Busca en `/{locale}/i18n.json`
2. Si falla, intenta `/i18n/{locale}.json`
3. Si falla, carga `/i18n.json` (genérico)
4. Si nada funciona, retorna el `fallback` proporcionado

Ejemplo: Si pides `getTranslation('unknownKey', 'Default')`:
- Falta en `/es-es/i18n.json` → intenta `/i18n/es-es.json` → intenta `/i18n.json` → retorna "Default"

## Ejemplo Completo: Agregar Nueva Traducción

### 1. Agregar a `/es-es/i18n.json`:

```json
{
  "readArticle": "Leer artículo",
  "myNewFeature": "Mi nueva función"
}
```

### 2. Agregar a `/en-us/i18n.json`:

```json
{
  "readArticle": "Read Article",
  "myNewFeature": "My New Feature"
}
```

### 3. Usar en tu bloque:

```javascript
import { getTranslation } from '../../scripts/iberostar/i18n.js';

export default async function decorate(block) {
  const label = await getTranslation('myNewFeature', 'Fallback Text');
  // label será "Mi nueva función" en /es-es/ o "My New Feature" en /en-us/
}
```

## Diferencia con Placeholders

| Aspecto | i18n.json | placeholders.json |
|--------|-----------|-------------------|
| **Propósito** | Traducciones de UI genéricas | Textos de componentes específicos |
| **Estructura** | Claves simples (strings) | Puede ser más complejo |
| **Scope** | Global, toda la aplicación | Por componente/bloque |
| **Cache** | Automático en memoria | Depende de quien lo use |
| **Fallback** | Intenta cascada de idiomas | Retorna fallback hardcoded |

**Recomendación**: Usa **i18n.json** para textos reutilizables (CTA, etiquetas, mensajes comunes) y **placeholders.json** para textos muy específicos de un bloque.

## Performance

- **Primera carga**: Un fetch por idioma (cacheado después)
- **Subsecuentes**: Acceso a cache (0ms)
- **Memory overhead**: Mínimo (típico <10KB por idioma)
- **No hay overhead de transpilación o bundling**: ES6 vanilla directo

## Estructura Recomendada (Escalable)

Para proyectos grandes, considera organizar en archivos separados por feature:

```
/i18n/
  ├── common.json       (labels globales)
  ├── blog.json         (blog-split-list, artículos)
  ├── forms.json        (formularios)
  └── es-es/
      ├── common.json
      ├── blog.json
      └── forms.json
```

Luego cargarías según necesidad:

```javascript
const blogTexts = await fetch('/i18n/blog.json').then(r => r.json());
const commonTexts = await fetch('/i18n/common.json').then(r => r.json());
```

Pero por ahora, **mantén todo en un solo `i18n.json` por idioma** (más simple y suficiente).
