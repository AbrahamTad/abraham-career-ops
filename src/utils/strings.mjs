export function normalizeKey(value = '') {
  return value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

export function compactKey(value = '') {
  return normalizeKey(value).replace(/\s+/g, '');
}

export function slugify(value = 'unknown') {
  const slug = normalizeKey(value).replace(/\s+/g, '-');
  return slug || 'unknown';
}
