import { addMonths } from './engine/dates.js';

export const GUARDRAIL = 'Concept-stage screening only. Figures are indicative and must be verified with project-specific data and specialist advice before any design or investment decision. This tool is decision support, not financial or engineering advice.';

// 2 significant figures in summary views, 3 in detail views (BRIEF §13.4).
export function sig(x, n = 3) {
  if (x == null || !Number.isFinite(x)) return '—';
  if (x === 0) return '0';
  const d = Math.max(0, n - 1 - Math.floor(Math.log10(Math.abs(x))));
  const r = Number(x.toPrecision(n));
  return r.toLocaleString('en-GB', { minimumFractionDigits: 0, maximumFractionDigits: Math.min(d, 6) });
}

export function money(x, n = 3) {
  if (x == null || !Number.isFinite(x)) return '—';
  const a = Math.abs(x);
  if (a >= 1e9) return `€${sig(x / 1e9, n)} bn`;
  if (a >= 1e6) return `€${sig(x / 1e6, n)} m`;
  if (a >= 1e3) return `€${sig(x / 1e3, n)} k`;
  return `€${sig(x, n)}`;
}

export function monthLabel(start, m) {
  if (m == null) return 'not reached';
  return addMonths(start, m);
}

export function pct(x, n = 0) {
  if (x == null || !Number.isFinite(x)) return '—';
  return `${(x * 100).toFixed(n)} %`;
}
