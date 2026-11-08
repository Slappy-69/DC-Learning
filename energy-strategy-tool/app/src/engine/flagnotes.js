// The engineer's comment on a flag (work package 27, owner 2026-11-07, OPEN-QUESTIONS 170–176).
//
// - A comment on one flag of one option, with a tick to apply it to every option with the same flag type (171).
// - The engineer can mark the flag mitigated and lower its severity (172); any flag (174).
// - A lowered permitting flag changes the deliverability score as the severity the engineer set (173); adequacy and
//   resilience tests do not change, only how the flag is shown and counted (174, 175).
// - The comment prints beside its flag in the report (176).
//
// Notes live in the inputs (inputs.flagNotes = { byOption: { <option key>: { <flag id>: note } }, byType: { <flag id>:
// note } }, note = { comment, mitigated, severity }) and are applied after the run, without a re-run: the run's own
// flags are kept, and each shown copy carries the note (originalSeverity keeps what the tool raised).

import { choiceKey } from './generator.js';

export const SEVERITIES = ['major', 'minor', 'info'];
const RANK = { major: 0, minor: 1, info: 2 };

export function optionNoteKey(o) {
  return o && o.v ? choiceKey(o.v) : String(o && o.id);
}

export function noteFor(notes, key, flagId) {
  if (!notes || !flagId) return null;
  const own = notes.byOption && notes.byOption[key] && notes.byOption[key][flagId];
  if (own) return own;
  const t = notes.byType && notes.byType[flagId];
  return t || null;
}

// The severity a note sets: never higher than the tool's (the engineer lowers it).
export function loweredSeverity(original, note) {
  if (!note || !note.severity || !(note.severity in RANK)) return original;
  return RANK[note.severity] > RANK[original] ? note.severity : original;
}

// A copy of the flags with each note applied. Idempotent: a flag already annotated is re-read from its original severity.
export function annotateFlags(flags, notes, key) {
  if (!Array.isArray(flags)) return flags;
  let changed = false;
  const out = flags.map((f) => {
    const orig = f.originalSeverity || f.severity;
    const n = noteFor(notes, key, f.id);
    if (!n || !(n.comment || n.mitigated || n.severity)) {
      if (f.originalSeverity) { changed = true; const { originalSeverity, comment, mitigated, ...rest } = f; void comment; void mitigated; return { ...rest, severity: originalSeverity }; }
      return f;
    }
    changed = true;
    return { ...f, severity: loweredSeverity(orig, n), originalSeverity: orig, comment: n.comment ? String(n.comment) : '', mitigated: !!n.mitigated };
  });
  return changed ? out : flags;
}

const penalty = (sev, P) => (sev === 'major' ? P.majorFlagPenalty : sev === 'minor' ? P.minorFlagPenalty : 0);

// Applies the notes to every option (copies; the run is not changed) and moves the deliverability score by the
// permitting flags whose severity the engineer lowered (OPEN-QUESTIONS 173). Returns the number of options changed.
export function applyFlagNotes(options, notes, inputs) {
  if (!notes || (!notes.byOption && !notes.byType)) return 0;
  const P = (inputs && inputs.deliverability) || { majorFlagPenalty: 8, minorFlagPenalty: 3 };
  let n = 0;
  for (let i = 0; i < options.length; i++) {
    const o = options[i];
    const key = optionNoteKey(o);
    const flags = annotateFlags(o.flags, notes, key);
    if (flags === o.flags) continue;
    let delta = 0;
    for (const f of flags) if (f.permitting && f.originalSeverity) delta += penalty(f.originalSeverity, P) - penalty(f.severity, P);
    const copy = { ...o, flags };
    if (delta && o.deliv) {
      const score = Math.max(0, Math.min(100, o.deliv.score + delta));
      copy.deliv = { ...o.deliv, score, items: [...(o.deliv.items || []), { item: 'Permitting flags lowered by the engineer (comments in the flags)', value: 1, points: delta }] };
      if (o.metrics) copy.metrics = { ...o.metrics, deliverability: score };
    }
    options[i] = copy;
    n++;
  }
  return n;
}

// The comment as one line, for the report and the screen (OPEN-QUESTIONS 175, 176).
export function noteText(f) {
  if (!f || !(f.comment || f.mitigated || (f.originalSeverity && f.originalSeverity !== f.severity))) return '';
  const lowered = f.originalSeverity && f.originalSeverity !== f.severity ? `severity lowered by the engineer from ${f.originalSeverity} to ${f.severity}` : '';
  const parts = [f.mitigated ? 'mitigated' : '', lowered].filter(Boolean).join('; ');
  return `Engineer's comment${parts ? ` (${parts})` : ''}: ${f.comment || '(no comment)'}`;
}
