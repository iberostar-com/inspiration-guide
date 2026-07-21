const MINOR_WORDS = new Set([
  'a', 'al', 'con', 'de', 'del', 'e', 'el', 'en', 'la', 'las', 'lo', 'los',
  'o', 'para', 'por', 'sin', 'sobre', 'u', 'un', 'una', 'y',
]);

function capitalizeWord(word) {
  if (!word) return '';
  return word.charAt(0).toUpperCase() + word.slice(1);
}

export function tagTitle(value) {
  const raw = `${value || ''}`.trim();
  if (!raw) return '';

  const withoutNamespace = raw.includes(':') ? raw.slice(raw.indexOf(':') + 1) : raw;
  const leaf = withoutNamespace.split('/').filter(Boolean).pop() || '';
  const words = leaf.replace(/[-_]+/g, ' ').trim().split(/\s+/).filter(Boolean);

  if (!words.length) return '';

  return words
    .map((word, index) => {
      const lower = word.toLowerCase();
      return index > 0 && MINOR_WORDS.has(lower) ? lower : capitalizeWord(lower);
    })
    .join(' ');
}

export default tagTitle;
