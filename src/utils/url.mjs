export function isHttpUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

export function normalizeJobUrl(value) {
  if (!isHttpUrl(value)) return null;
  const url = new URL(value);
  url.hash = '';

  const removableParams = [
    'utm_source',
    'utm_medium',
    'utm_campaign',
    'utm_term',
    'utm_content',
    'ref',
    'source',
  ];
  for (const param of removableParams) {
    url.searchParams.delete(param);
  }

  return url.toString();
}

export function extractHttpUrls(text = '') {
  return [...text.matchAll(/https?:\/\/[^\s|)]+/g)]
    .map((match) => normalizeJobUrl(match[0]))
    .filter(Boolean);
}
