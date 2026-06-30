const PLAIN_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

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

export function formatDate(
  value,
  {
    locale = document.documentElement.lang || 'en',
    dateStyle = 'long',
  } = {},
) {
  const date = toDate(value);
  if (!date) return '';

  return new Intl.DateTimeFormat(locale, { dateStyle }).format(date);
}

export function hasValidDate(value) {
  return Boolean(toDate(value));
}

export default formatDate;
