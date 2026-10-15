// Run event log (trackability). Pure functions; the only environment dependency is the clock.
//
// Every run emits an ordered list of plain events:
//   { seq, stage, event, t_ms, count, total, detail }
//   seq    contiguous integer from 0 within one log
//   stage  one of STAGES (in pipeline order)
//   event  'start' | 'progress' | 'end' | 'warning'
//   t_ms   milliseconds since the run started (the ONLY field that differs between identical runs)
//   count  items processed so far (start: 0; end: items processed; warning: null)
//   total  items expected in this stage for this source (null when not known in advance)
//   detail plain object; always carries `source` ('main' or 'worker k'); never holds timings
//
// See BUILD-NOTES.md "Run event log" for what each stage reports.

import { hashString } from './prng.js';

export const LOG_SCHEMA = 'dc-energy-run-log/1';

export const STAGES = [
  { id: 'input-normalisation', label: 'Input normalisation' },
  { id: 'context-build', label: 'Context build' },
  { id: 'option-generation', label: 'Option generation' },
  { id: 'sizing', label: 'Per-option sizing' },
  { id: 'dispatch', label: 'Dispatch (8760 h)' },
  { id: 'time-to-power', label: 'Time-to-power' },
  { id: 'economics', label: 'Economics' },
  { id: 'carbon', label: 'Carbon and water' },
  { id: 'resilience', label: 'Resilience' },
  { id: 'flags', label: 'Flags' },
  { id: 'deliverability', label: 'Deliverability' },
  { id: 'scoring-ranking', label: 'Scoring and ranking' },
];

export const STAGE = Object.freeze({
  input: 'input-normalisation',
  context: 'context-build',
  generation: 'option-generation',
  sizing: 'sizing',
  dispatch: 'dispatch',
  ttp: 'time-to-power',
  economics: 'economics',
  carbon: 'carbon',
  resilience: 'resilience',
  flags: 'flags',
  deliverability: 'deliverability',
  scoring: 'scoring-ranking',
});

export const STAGE_INDEX = Object.freeze(Object.fromEntries(STAGES.map((s, i) => [s.id, i])));
export const STAGE_LABEL = Object.freeze(Object.fromEntries(STAGES.map((s) => [s.id, s.label])));
export const EVENT_TYPES = ['start', 'progress', 'end', 'warning'];
export const EVENT_FIELDS = ['seq', 'stage', 'event', 't_ms', 'count', 'total', 'detail'];

// Absolute high-resolution clock shared by the main thread and workers (performance.timeOrigin
// is an epoch timestamp in both), so worker events can be expressed relative to the run start.
export function nowAbs() {
  if (typeof performance !== 'undefined' && performance.now) return (performance.timeOrigin || 0) + performance.now();
  return Date.now();
}

// Event logger for one source (the main thread, or one worker).
export function createRunLog({ source = 'main', t0Abs = null, onEvent = null, seqStart = 0, clock = nowAbs } = {}) {
  const origin = t0Abs == null ? clock() : t0Abs;
  const events = [];
  const warningsByStage = {};
  let seq = seqStart;
  const emit = (stage, event, count, total, detail) => {
    if (!(stage in STAGE_INDEX)) throw new Error(`Unknown run-log stage "${stage}"`);
    const e = { seq: seq++, stage, event, t_ms: Math.round((clock() - origin) * 1000) / 1000, count, total, detail: { source, ...detail } };
    events.push(e);
    if (onEvent) onEvent(e);
    return e;
  };
  return {
    source,
    events,
    start(stage, total = null, detail = {}) {
      warningsByStage[stage] = 0;
      return emit(stage, 'start', 0, total, detail);
    },
    progress(stage, count, total, detail = {}) {
      return emit(stage, 'progress', count, total, detail);
    },
    warning(stage, code, message, extra = {}) {
      warningsByStage[stage] = (warningsByStage[stage] || 0) + 1;
      return emit(stage, 'warning', null, null, { code, message, ...extra });
    },
    // End of a stage: items processed, cache hits/misses (null = the stage has no cache) and the
    // number of warnings raised in the stage are always recorded.
    end(stage, count, total, { cacheHits = null, cacheMisses = null, ...detail } = {}) {
      return emit(stage, 'end', count, total, { items: count, cacheHits, cacheMisses, warnings: warningsByStage[stage] || 0, ...detail });
    },
  };
}

// Deterministic JSON with sorted object keys (input hash must not depend on key insertion order).
export function stableStringify(x) {
  if (x === null || typeof x !== 'object') return JSON.stringify(x === undefined ? null : x);
  if (Array.isArray(x)) return `[${x.map((v) => (v === undefined || typeof v === 'function' ? 'null' : stableStringify(v))).join(',')}]`;
  const keys = Object.keys(x).filter((k) => x[k] !== undefined && typeof x[k] !== 'function').sort();
  return `{${keys.map((k) => `${JSON.stringify(k)}:${stableStringify(x[k])}`).join(',')}}`;
}

const hex8 = (n) => (n >>> 0).toString(16).padStart(8, '0');

// 64-bit (two FNV-1a passes) hash of the normalised inputs, 16 hex characters.
export function hashInputs(normalizedInputs) {
  const s = stableStringify(normalizedInputs);
  return hex8(hashString(s)) + hex8(hashString(`${s.length}:${s}`));
}

// Short, stable identifier for a dispatch configuration key (48 bits, 12 hex characters).
export function shortHash(str) {
  return `K${(hex8(hashString(str)) + hex8(hashString(`#${str}`))).slice(0, 12)}`;
}

// Merge per-worker logs into one ordered log. Order: pipeline stage, then worker index, then the
// worker's own sequence number. Sequence numbers are renumbered 0..N-1 and the worker's original
// number is kept as detail.wseq. Deterministic for a given pool size.
export function mergeLogs(logs) {
  const all = [];
  logs.forEach((evs, w) => evs.forEach((e) => all.push({ e, w })));
  all.sort((a, b) => (STAGE_INDEX[a.e.stage] - STAGE_INDEX[b.e.stage]) || (a.w - b.w) || (a.e.seq - b.e.seq));
  return all.map(({ e }, i) => ({ ...e, seq: i, detail: { ...e.detail, wseq: e.seq } }));
}

// Structural check of a complete log. Returns { ok, problems, ... } and never throws.
export function validateRunLog(events) {
  const problems = [];
  if (!Array.isArray(events) || !events.length) return { ok: false, problems: ['log is empty'], events: 0, stagesComplete: 0, sources: [] };
  let lastStage = -1;
  const perPair = new Map(); // `${stage}|${source}` -> [event types]
  const perStage = new Map();
  events.forEach((e, i) => {
    for (const f of EVENT_FIELDS) if (!(f in e)) problems.push(`event ${i}: missing field ${f}`);
    if (e.seq !== i) problems.push(`event ${i}: seq ${e.seq} (expected ${i})`);
    if (!EVENT_TYPES.includes(e.event)) problems.push(`event ${i}: unknown event type ${e.event}`);
    const si = STAGE_INDEX[e.stage];
    if (si === undefined) problems.push(`event ${i}: unknown stage ${e.stage}`);
    else if (si < lastStage) problems.push(`event ${i}: stage ${e.stage} after ${STAGES[lastStage].id} (out of order)`);
    else lastStage = si;
    const src = e.detail && e.detail.source;
    const k = `${e.stage}|${src}`;
    if (!perPair.has(k)) perPair.set(k, []);
    perPair.get(k).push(e.event);
    if (!perStage.has(e.stage)) perStage.set(e.stage, { start: 0, end: 0 });
    if (e.event === 'start') perStage.get(e.stage).start++;
    if (e.event === 'end') perStage.get(e.stage).end++;
  });
  let stagesComplete = 0;
  for (const s of STAGES) {
    const c = perStage.get(s.id);
    if (!c || !c.start || !c.end) problems.push(`stage ${s.id}: ${!c ? 'missing' : !c.start ? 'no start' : 'no end'}`);
    else stagesComplete++;
  }
  for (const [k, types] of perPair) {
    const starts = types.filter((t) => t === 'start').length;
    const ends = types.filter((t) => t === 'end').length;
    if (starts !== 1 || ends !== 1 || types[0] !== 'start' || types[types.length - 1] !== 'end') {
      problems.push(`${k.replace('|', ' / ')}: expected one start first and one end last (got ${starts} start, ${ends} end)`);
    }
  }
  const sources = [...new Set(events.map((e) => e.detail && e.detail.source))];
  return { ok: problems.length === 0, problems: problems.slice(0, 50), problemCount: problems.length, events: events.length, stagesComplete, sources };
}

// Log content without timestamps (used to show that two identical runs give identical logs).
export function stripTimestamps(events) {
  return events.map(({ t_ms, ...rest }) => rest); // eslint-disable-line no-unused-vars
}

// ---- Export ----
function csvCell(v) {
  if (v === null || v === undefined) return '';
  const s = typeof v === 'object' ? JSON.stringify(v) : String(v);
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function logToCSV(events) {
  const rows = [EVENT_FIELDS.join(',')];
  for (const e of events) rows.push(EVENT_FIELDS.map((f) => csvCell(e[f])).join(','));
  return `${rows.join('\r\n')}\r\n`;
}

export function logToJSON(meta, events) {
  const head = { schema: LOG_SCHEMA, ...meta, stages: STAGES.map((s) => s.id), fields: EVENT_FIELDS, eventCount: events.length };
  const headStr = JSON.stringify(head, null, 2);
  return `${headStr.slice(0, -2)},\n  "events": [\n${events.map((e) => `    ${JSON.stringify(e)}`).join(',\n')}\n  ]\n}\n`;
}

function stamp(d) {
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getUTCFullYear()}${p(d.getUTCMonth() + 1)}${p(d.getUTCDate())}-${p(d.getUTCHours())}${p(d.getUTCMinutes())}${p(d.getUTCSeconds())}Z`;
}

export function logFileName(inputHash, date, ext, partial = false) {
  return `run-log_${inputHash}_${stamp(date)}${partial ? '_partial' : ''}.${ext}`;
}

// ---- Human-readable one-line summary of an event (UI log panel) ----
const n0 = (x) => (typeof x === 'number' ? x.toLocaleString('en-GB') : String(x));

export function describeEvent(e) {
  const d = e.detail || {};
  if (e.event === 'warning') return `warning: ${d.message}`;
  if (e.event === 'start') return `start${e.total != null ? ` · ${n0(e.total)} item${e.total === 1 ? '' : 's'}` : ''}`;
  if (e.event === 'end') {
    let s = `end · ${n0(d.items)} item${d.items === 1 ? '' : 's'}`;
    if (d.cacheHits != null) s += ` · cache ${n0(d.cacheHits)} hit / ${n0(d.cacheMisses)} miss`;
    s += ` · ${d.warnings} warning${d.warnings === 1 ? '' : 's'}`;
    if (e.stage === 'scoring-ranking' && d.leader) s += ` · leader ${d.leader} (${d.leaderScore})`;
    if (e.stage === 'resilience' && d.statuses) s += ` · ${Object.entries(d.statuses).map(([k, v]) => `${k} ${n0(v)}`).join(', ')}`;
    return s;
  }
  // progress
  if (e.stage === 'dispatch' && d.option) return `${n0(e.count)}/${n0(e.total)} · ${d.option} · ${d.cfg} · ${d.cache}${d.cache === 'hit' ? ` (first simulated for ${d.firstSimulatedFor})` : ` · ${d.years} model year${d.years === 1 ? '' : 's'}`}`;
  switch (d.step) {
    case 'enumerate': return `enumerated ${n0(d.rawTotal)} → ${n0(d.collapsedTotal)} after n/a collapse → ${n0(d.validCombinations)} valid`;
    case 'compatibility-rule': return `rule ${d.rule}: ${n0(d.removed)} ${d.rule === 'd' ? 'collapsed' : 'removed'}`;
    case 'archetypes': return `${d.archetypes} archetype baselines (${d.outsideOpenChoices} outside open choices)`;
    case 'cap': return `cap ${n0(d.cap)}: ${d.decision} · ${n0(d.screened)} of ${n0(d.totalCombinations)} screened${d.lhsRepaired ? ` · ${n0(d.lhsRepaired)} LHS draws repaired` : ''}`;
    case 'slice': return `slice ${d.sliceIndex + 1} of ${d.sliceCount}: ${n0(e.count)} of ${n0(e.total)} options`;
    case 'merge': return `merged ${d.workers} worker slices · ${n0(d.options)} options · ${n0(d.distinctConfigurations)} distinct configurations, ${n0(d.duplicatedAcrossWorkers)} simulated in more than one worker`;
    default: return `${n0(e.count)}/${n0(e.total)}`;
  }
}

// ---- Live progress tracker (UI) ----
// `sources` are the sources expected to run the per-option stages ('main' in the main-thread
// fallback, 'worker 0'…'worker n-1' in the pool). Scoring and ranking always runs on 'main'.
export function createProgressTracker({ sources = ['main'], mainSource = 'main', keep = 200 } = {}) {
  const per = {};
  let recent = [];
  let count = 0;
  const slot = (stage, src) => {
    per[stage] = per[stage] || {};
    per[stage][src] = per[stage][src] || { started: false, ended: false, count: 0, total: null, warnings: 0, hits: 0, misses: 0, cacheHits: null, cacheMisses: null };
    return per[stage][src];
  };
  function ingest(events) {
    for (const e of events) {
      const x = slot(e.stage, e.detail && e.detail.source);
      if (e.event === 'start') { x.started = true; x.total = e.total; x.count = 0; }
      else if (e.event === 'progress') {
        if (typeof e.count === 'number') x.count = e.count;
        if (e.total != null) x.total = e.total;
        if (e.detail && e.detail.cache === 'hit') x.hits++;
        if (e.detail && e.detail.cache === 'miss') x.misses++;
      } else if (e.event === 'warning') x.warnings++;
      else if (e.event === 'end') {
        x.ended = true; x.count = e.count; if (e.total != null) x.total = e.total;
        if (e.detail.cacheHits != null) { x.cacheHits = e.detail.cacheHits; x.cacheMisses = e.detail.cacheMisses; }
      }
    }
    count += events.length;
    recent = recent.concat(events);
    if (recent.length > keep * 2) recent = recent.slice(-keep);
  }
  function snapshot() {
    let warnings = 0;
    const stages = STAGES.map(({ id, label }, index) => {
      const expected = id === STAGE.scoring ? [mainSource] : sources;
      const m = per[id] || {};
      let pctSum = 0, started = false, allEnded = true, w = 0, hits = null, misses = null, items = 0, total = 0;
      for (const src of expected) {
        const x = m[src];
        if (!x || !x.started) { allEnded = false; continue; }
        started = true;
        if (!x.ended) allEnded = false;
        pctSum += x.ended ? 1 : x.total ? Math.min(1, x.count / x.total) : 0;
        w += x.warnings;
        items += x.count || 0;
        total += x.total || 0;
        const h = x.cacheHits != null ? x.cacheHits : (x.hits || x.misses) ? x.hits : null;
        const mi = x.cacheMisses != null ? x.cacheMisses : (x.hits || x.misses) ? x.misses : null;
        if (h != null) { hits = (hits || 0) + h; misses = (misses || 0) + mi; }
      }
      warnings += w;
      const status = started && allEnded ? 'done' : started ? 'running' : 'pending';
      return { id, label, index, status, pct: expected.length ? pctSum / expected.length : 0, warnings: w, cacheHits: hits, cacheMisses: misses, items, total };
    });
    const current = stages.find((s) => s.status !== 'done') || null;
    return { stages, current, recent: recent.slice(-keep), eventCount: count, warnings, sources };
  }
  return { ingest, snapshot };
}
