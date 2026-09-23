export function resolveAssetMetadataAlt(metadata = {}) {
  return (
    metadata['dc:description']
    || metadata['dc:alt']
    || metadata['dc:title']
    || ''
  ).trim();
}

export function resolveFinalAlt(authoredAlt = '', automaticAlt = '') {
  return `${authoredAlt || ''}`.trim() || `${automaticAlt || ''}`.trim() || '';
}
