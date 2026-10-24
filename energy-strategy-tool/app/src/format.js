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

// Display currency (work package 1; BRIEF §5.1): results can be shown in the site's currency at the fixed release
// rate (project.fx). The engine and the inputs work in euro; only the display converts. Default: euro.
const SYMBOL = { EUR: '€', GBP: '£', CHF: 'CHF ', NOK: 'NOK ', SEK: 'SEK ', DKK: 'DKK ', ISK: 'ISK ' };
let DISPLAY = { code: 'EUR', symbol: '€', rate: 1 };
export function setDisplayCurrency(code, rate) {
  DISPLAY = code && code !== 'EUR' && Number.isFinite(rate) && rate > 0 ? { code, symbol: SYMBOL[code] || `${code} `, rate } : { code: 'EUR', symbol: '€', rate: 1 };
  return DISPLAY;
}
export const displayCurrency = () => DISPLAY;
export const cur = () => DISPLAY.symbol;
// A unit string with the euro sign replaced by the display currency ("€/MWh" → "£/MWh").
export const curUnit = (u) => (DISPLAY.code === 'EUR' ? u : String(u).replace(/€/g, DISPLAY.symbol.trim()));
// Cost per MWh in the display currency.
export function perMWh(x, n = 3) {
  if (x == null || !Number.isFinite(x)) return '—';
  return `${DISPLAY.symbol}${sig(x * DISPLAY.rate, n)}/MWh`;
}

export function money(x, n = 3) {
  if (x == null || !Number.isFinite(x)) return '—';
  const y = x * DISPLAY.rate, S = DISPLAY.symbol;
  const a = Math.abs(y);
  if (a >= 1e9) return `${S}${sig(y / 1e9, n)} bn`;
  if (a >= 1e6) return `${S}${sig(y / 1e6, n)} m`;
  if (a >= 1e3) return `${S}${sig(y / 1e3, n)} k`;
  return `${S}${sig(y, n)}`;
}

export function monthLabel(start, m) {
  if (m == null) return 'not reached';
  return addMonths(start, m);
}

export function pct(x, n = 0) {
  if (x == null || !Number.isFinite(x)) return '—';
  return `${(x * 100).toFixed(n)} %`;
}
