// Study files (work package 15, OPEN-QUESTIONS 27, answered 2026-10-24 with Claude's recommendation, accepted in advance
// by the owner; BRIEF §4 "a project file (JSON) can be saved and reopened").
//
// A study file holds the engineer's inputs as entered (inputs the engineer left blank keep their "derived" or "not known"
// form, so a reopened study resolves them with the tool's current rules; inputs left at a plain default keep that value),
// the inputs as they were run (every default resolved), and a short record of the
// result: the input hash, the number of options and adequate options, and the leader. Reopening re-runs the study, which
// is deterministic, and compares the new result with the record, so the engineer sees whether the tool's defaults or
// engine have changed since the study was saved. Pure: no UI, no browser APIs.

import { buildDefaultInputs, normalizeInputs } from './defaults.js';
import { hashInputs } from './runlog.js';
import { ENGINE_VERSION } from './run.js';

export const STUDY_SCHEMA = 'dc-energy-study/1';
const SCHEMA_RE = /^dc-energy-study\/(\d+)$/;

const isObj = (x) => x && typeof x === 'object' && !Array.isArray(x);

// The study file for the inputs on screen and, when there is one, the run of those inputs.
export function studyFile(inputs, run = null, { savedAt = new Date(), appVersion = '', note = null } = {}) {
  const n = normalizeInputs(inputs);
  const out = {
    schema: STUDY_SCHEMA,
    savedAt: savedAt.toISOString(),
    engineVersion: ENGINE_VERSION,
    appVersion,
    name: inputs.project && inputs.project.name ? String(inputs.project.name) : 'Untitled project',
    inputs: JSON.parse(JSON.stringify(inputs)),
    inputsAsRun: n,
    inputHash: hashInputs(n),
    result: null,
    // The engineer's edit of the plain-English summary (work package 16), kept as a note marked "edited".
    notes: note && typeof note.text === 'string' ? { summary: { text: note.text, key: note.key || '', leaderId: note.leaderId || null, leaderName: note.leaderName || '', editedAt: note.editedAt || '', siteBeta: !!note.siteBeta } } : {},
  };
  if (run && run.options && run.options.length) {
    const lead = run.options.reduce((a, b) => (a.rank < b.rank ? a : b));
    out.result = {
      inputHash: run.inputHash || null,
      options: run.options.length,
      adequate: run.options.filter((o) => o.adequacy && o.adequacy.adequate).length,
      leader: { id: lead.id, name: lead.name, score: lead.score, lcoe: lead.eco.lcoe, carbonG: lead.carbon.locationG, capex: lead.eco.capex },
    };
  }
  return out;
}

// Accents are dropped: combining marks (code points 0x300 to 0x36f) are filtered by code, so the build stays ASCII (test 14).
export function studyFileName(inputs, date = new Date()) {
  const name = (inputs.project && inputs.project.name) || 'study';
  const slug = String(name).normalize('NFKD').split('').filter((c) => c.charCodeAt(0) < 0x300 || c.charCodeAt(0) > 0x36f).join('').replace(/[^A-Za-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60) || 'study';
  return `${slug}-study-${date.toISOString().slice(0, 10)}.json`;
}

// Fills what the file lacks from the current defaults (inputs saved by an older version) and lists the paths filled;
// drops inputs this version does not know and lists them (Haiku check H4, L-2: they would change the input hash).
function fillFromDefaults(def, saved, path, added, dropped) {
  const out = {};
  for (const [k, sv] of Object.entries(saved)) {
    if (k in def) out[k] = sv;
    else dropped.push(path ? `${path}.${k}` : k);
  }
  for (const [k, dv] of Object.entries(def)) {
    const p = path ? `${path}.${k}` : k;
    if (!(k in saved)) { out[k] = dv; added.push(p); }
    else if (isObj(dv) && isObj(saved[k]) && k !== 'choices') out[k] = fillFromDefaults(dv, saved[k], p, added, dropped);
  }
  return out;
}

// Reads a study file's text. Returns { ok, inputs, file, added, warnings } or { ok: false, error }.
export function readStudyFile(text) {
  let f;
  try { f = JSON.parse(text); } catch (e) { return { ok: false, error: 'This is not a study file: it is not valid JSON.' }; }
  if (!isObj(f) || typeof f.schema !== 'string') return { ok: false, error: 'This is not a study file: it has no "schema" line (dc-energy-study).' };
  const m = SCHEMA_RE.exec(f.schema);
  if (!m) return { ok: false, error: `This is not a study file of this tool (schema "${f.schema}").` };
  const ver = Number(m[1]);
  if (ver > 1) return { ok: false, error: `This study was saved by a newer version of the tool (schema version ${ver}); this version reads version 1.` };
  if (!isObj(f.inputs) || !isObj(f.inputs.project)) return { ok: false, error: 'This study file has no inputs.' };
  const def = buildDefaultInputs({ analysisStart: f.inputs.project.analysisStart || undefined });
  // Every input section must be an object (Haiku check H4, L-3): a damaged file is refused with the section named.
  for (const [k, dv] of Object.entries(def)) {
    if (isObj(dv) && k in f.inputs && !isObj(f.inputs[k]) && k !== 'choices') return { ok: false, error: `This study file is damaged: the input section "${k}" is ${f.inputs[k] === null ? 'empty (null)' : `a ${Array.isArray(f.inputs[k]) ? 'list' : typeof f.inputs[k]}`}, not a set of inputs.` };
  }
  if ('choices' in f.inputs && f.inputs.choices !== null && !isObj(f.inputs.choices)) return { ok: false, error: 'This study file is damaged: the choices are not a set of choices.' };
  const added = [], dropped = [];
  const inputs = fillFromDefaults(def, f.inputs, '', added, dropped);
  const savedChoices = isObj(f.inputs.choices) ? f.inputs.choices : {};
  for (const k of Object.keys(savedChoices)) if (!(k in def.choices)) dropped.push(`choices.${k}`);
  inputs.choices = { ...def.choices, ...Object.fromEntries(Object.entries(savedChoices).filter(([k]) => k in def.choices)) };
  const warnings = [];
  if (added.length) warnings.push(`Saved by an earlier version: ${added.length} input${added.length === 1 ? '' : 's'} not in the file take${added.length === 1 ? 's' : ''} today's defaults (${added.slice(0, 6).join(', ')}${added.length > 6 ? ', …' : ''}).`);
  if (dropped.length) warnings.push(`${dropped.length} input${dropped.length === 1 ? '' : 's'} in the file ${dropped.length === 1 ? 'is' : 'are'} not known to this version and ${dropped.length === 1 ? 'was' : 'were'} left out (${dropped.slice(0, 6).join(', ')}${dropped.length > 6 ? ', …' : ''}).`);
  if (f.engineVersion && f.engineVersion !== ENGINE_VERSION) warnings.push(`Saved with engine ${f.engineVersion}; this is engine ${ENGINE_VERSION}.`);
  // The summary note (work package 16): kept when it is a text; a damaged note is dropped with a warning.
  // A notes section that is not a set of notes, or a summary note that is not a text, is dropped with a warning (H5, L7);
  // a file without notes (saved before work package 16) opens without one.
  const notes = {};
  if ('notes' in f && f.notes != null && !isObj(f.notes)) warnings.push('The notes section of the file is damaged and was left out.');
  else if (isObj(f.notes) && 'summary' in f.notes) {
    const sn = f.notes.summary;
    if (isObj(sn) && typeof sn.text === 'string' && sn.text.trim()) notes.summary = { text: sn.text, key: String(sn.key || ''), leaderId: sn.leaderId || null, leaderName: String(sn.leaderName || ''), editedAt: String(sn.editedAt || ''), siteBeta: sn.siteBeta === true };
    else warnings.push('The summary note in the file is damaged and was left out.');
  }
  return { ok: true, inputs, file: f, added, dropped, warnings, notes };
}

// After the reopened study has run: does the result match the saved record?
export function compareWithSaved(file, run) {
  if (!file || !file.result || !run || !run.options || !run.options.length) return null;
  const lead = run.options.reduce((a, b) => (a.rank < b.rank ? a : b));
  const s = file.result;
  const sameInputs = !!(s.inputHash && run.inputHash && s.inputHash === run.inputHash);
  const sameLeader = lead.id === s.leader.id && Math.abs(lead.eco.lcoe - s.leader.lcoe) <= 1e-9 * Math.max(1, Math.abs(s.leader.lcoe)) && Math.abs(lead.score - s.leader.score) <= 1e-9 * Math.max(1, Math.abs(s.leader.score));
  const same = sameInputs && sameLeader && run.options.length === s.options;
  let message;
  if (same) message = `Re-run matches the saved study: leader #1 ${lead.name}, the same score and LCOE.`;
  else if (!sameInputs) message = `The tool's defaults or engine have changed since the study was saved, so the re-run differs. Saved leader: ${s.leader.name} (LCOE ${s.leader.lcoe.toFixed(1)} €/MWh); now: ${lead.name} (LCOE ${lead.eco.lcoe.toFixed(1)} €/MWh).`;
  else message = `Same inputs, but the engine gives a different result: saved leader ${s.leader.name} (LCOE ${s.leader.lcoe.toFixed(1)} €/MWh); now ${lead.name} (LCOE ${lead.eco.lcoe.toFixed(1)} €/MWh).`;
  return { same, sameInputs, sameLeader, message, saved: s, now: { id: lead.id, name: lead.name, score: lead.score, lcoe: lead.eco.lcoe } };
}
