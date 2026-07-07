import { getPlaceholder, loadPlaceholders } from './placeholders.js';

export async function getTranslation(key, fallback = '') {
  return getPlaceholder(key, fallback);
}

export function getTranslationSync(data, key, fallback = '') {
  if (!data || typeof data !== 'object') return fallback;
  const value = data[key];
  return value || fallback;
}

export async function loadI18nData(locale = null) {
  return loadPlaceholders(locale || undefined);
}

export default getTranslation;
