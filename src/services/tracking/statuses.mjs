export const CANONICAL_STATUSES = [
  'Evaluated',
  'Applied',
  'Responded',
  'Interview',
  'Offer',
  'Rejected',
  'Discarded',
  'SKIP',
];

const STATUS_ALIASES = {
  evaluada: 'Evaluated',
  condicional: 'Evaluated',
  hold: 'Evaluated',
  evaluar: 'Evaluated',
  verificar: 'Evaluated',
  aplicado: 'Applied',
  enviada: 'Applied',
  aplicada: 'Applied',
  sent: 'Applied',
  respondido: 'Responded',
  entrevista: 'Interview',
  oferta: 'Offer',
  rechazado: 'Rejected',
  rechazada: 'Rejected',
  descartado: 'Discarded',
  descartada: 'Discarded',
  cerrada: 'Discarded',
  cancelada: 'Discarded',
  'no aplicar': 'SKIP',
  no_aplicar: 'SKIP',
  skip: 'SKIP',
  monitor: 'SKIP',
  'geo blocker': 'SKIP',
};

export function normalizeStatus(raw = '') {
  const original = String(raw).trim();
  const clean = original
    .replace(/\*\*/g, '')
    .replace(/\s+\d{4}-\d{2}-\d{2}.*$/, '')
    .trim();
  const lower = clean.toLowerCase();

  if (/^(duplicado|dup|repost)/i.test(lower)) {
    return { status: 'Discarded', moveToNotes: original };
  }

  if (clean === '' || clean === '-' || clean === '—') {
    return { status: 'Discarded' };
  }

  const canonical = CANONICAL_STATUSES.find((status) => status.toLowerCase() === lower);
  if (canonical) return { status: canonical };
  if (STATUS_ALIASES[lower]) return { status: STATUS_ALIASES[lower] };
  if (/geo.?blocker/i.test(clean)) return { status: 'SKIP' };

  return { status: null, unknown: true };
}

export function validateStatus(raw = '', fallback = 'Evaluated') {
  const normalized = normalizeStatus(raw);
  return normalized.status || fallback;
}
