const CROCKFORD_BASE32 = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';

const MONTH_LABELS_PT_BR = [
  'jan',
  'fev',
  'mar',
  'abr',
  'mai',
  'jun',
  'jul',
  'ago',
  'set',
  'out',
  'nov',
  'dez',
];

export function extractTimestampFromUlid(id: string): number | null {
  const ulid = id.includes('_') ? (id.split('_').pop() ?? '') : id;
  if (ulid.length < 10) return null;

  const timeChars = ulid.substring(0, 10).toUpperCase();
  let timestamp = 0;
  for (const char of timeChars) {
    const value = CROCKFORD_BASE32.indexOf(char);
    if (value === -1) return null;
    timestamp = timestamp * 32 + value;
  }
  return timestamp;
}

export function extractDateFromUlid(id: string): Date | null {
  const ts = extractTimestampFromUlid(id);
  return ts === null ? null : new Date(ts);
}

export function formatUlidAsMonthYear(id: string): string {
  const date = extractDateFromUlid(id);
  if (!date) return '—';
  return `${MONTH_LABELS_PT_BR[date.getMonth()]}/${date.getFullYear()}`;
}
