const PLAIN_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const LOCALE_PATTERN = /^[a-z]{2}-[a-z]{2}$/i;
const DEFAULT_LOCALE = 'en';

function toDate(value) {
  if (!value) return null;
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  if (typeof value === 'string' && PLAIN_DATE_PATTERN.test(value)) {
    const parsedDate = new Date(`${value}T00:00:00`);
    return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
  }

  const parsedDate = new Date(value);
  return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
}

export function getContentLocale() {
  const pathname = typeof window !== 'undefined' ? window.location?.pathname || '' : '';
  const segments = pathname.split('/').filter(Boolean);
  const fromPath = segments.find((segment) => LOCALE_PATTERN.test(segment));
  if (fromPath) return fromPath.toLowerCase();

  const fromDocument = typeof document !== 'undefined' ? document.documentElement?.lang : '';
  return fromDocument || DEFAULT_LOCALE;
}

// Spanish long dates follow the design spec "10 de abril, 2026" instead of the
// Intl default "10 de abril de 2026", built from parts so month names stay localized.
function formatSpanishLongDate(date, locale) {
  const parts = new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).formatToParts(date);

  const valueOf = (type) => parts.find((part) => part.type === type)?.value || '';
  const day = valueOf('day');
  const month = valueOf('month');
  const year = valueOf('year');

  return day && month && year ? `${day} de ${month}, ${year}` : '';
}

export function formatDate(
  value,
  {
    locale,
    dateStyle = 'long',
  } = {},
) {
  const date = toDate(value);
  if (!date) return '';

  const resolvedLocale = locale || getContentLocale();

  try {
    if (dateStyle === 'long' && resolvedLocale.toLowerCase().startsWith('es')) {
      const spanishDate = formatSpanishLongDate(date, resolvedLocale);
      if (spanishDate) return spanishDate;
    }

    return new Intl.DateTimeFormat(resolvedLocale, { dateStyle }).format(date);
  } catch (error) {
    return new Intl.DateTimeFormat(DEFAULT_LOCALE, { dateStyle }).format(date);
  }
}

export function hasValidDate(value) {
  return Boolean(toDate(value));
}

export default formatDate;
