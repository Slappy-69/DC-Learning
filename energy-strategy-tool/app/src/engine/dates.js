// Month arithmetic. The model clock is in hours from the analysis start date.
// One model year = 8760 h; one model month = 730 h (8760 / 12).

export const HOURS_PER_YEAR = 8760;
export const HOURS_PER_MONTH = 730;

// 'YYYY-MM' -> { y, m } (m 1..12)
export function parseYM(s) {
  const m = /^(\d{4})-(\d{1,2})/.exec(String(s || ''));
  if (!m) return null;
  return { y: Number(m[1]), m: Number(m[2]) };
}

export function formatYM(y, m) {
  return `${y}-${String(m).padStart(2, '0')}`;
}

// Whole months from a to b (both 'YYYY-MM'); can be negative.
export function monthsBetween(a, b) {
  const pa = parseYM(a);
  const pb = parseYM(b);
  if (!pa || !pb) return 0;
  return (pb.y - pa.y) * 12 + (pb.m - pa.m);
}

export function addMonths(ym, n) {
  const p = parseYM(ym);
  const total = p.y * 12 + (p.m - 1) + Math.round(n);
  return formatYM(Math.floor(total / 12), (total % 12) + 1);
}

// Default analysis start = today + 3 months (BRIEF §5.1), first of month.
export function defaultAnalysisStart(today = new Date()) {
  const y = today.getUTCFullYear();
  const m = today.getUTCMonth() + 1;
  return addMonths(formatYM(y, m), 3);
}

export function yearOf(ym) {
  const p = parseYM(ym);
  return p ? p.y : 0;
}
