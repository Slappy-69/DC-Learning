import React from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react-dom/test-utils';
import DispatchView from '/tmp/claude-0/-home-claude/3ded6fb1-dffa-5614-ab8f-4144dc966e9a/scratchpad/dc-learning/energy-strategy-tool/app/src/components/DispatchView.jsx';
import * as E from '/tmp/claude-0/-home-claude/3ded6fb1-dffa-5614-ab8f-4144dc966e9a/scratchpad/dc-learning/energy-strategy-tool/app/src/engine/index.js';

export async function main(window) {
  const document = window.document;
  const results = [];
  const errors = [];
  const origError = console.error;
  console.error = (...a) => { errors.push(a.map((x) => (x && x.message) || String(x)).join(' ').slice(0, 200)); };
  const log = (s) => results.push(s);
  const check = (name, cond, extra = '') => log(`${cond ? 'PASS' : 'FAIL'} ${name}${extra ? ' | ' + extra : ''}`);
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const chips = () => $$('button.chip-btn').filter((b) => /^Year \d+$/.test(b.textContent.trim()));
  const pressedYear = () => { const b = chips().find((c) => c.getAttribute('aria-pressed') === 'true'); return b ? b.textContent.trim() : null; };
  const weekVal = () => { const i = $('#dv-week'); return i ? Number(i.value) : null; };
  const tipIn = (wrap) => { const t = wrap ? wrap.querySelector('.sc-tip-title') : $('.sc-tip-title'); return t ? t.textContent : null; };
  const badTokens = (root) => { const t = root.textContent; return ['NaN', 'undefined', 'Infinity', '[object', 'null'].filter((k) => t.includes(k)); };
  const dashes = (root) => (root.textContent.match(/—/g) || []).length;
  const keyOn = (el, key, extra = {}) => el.dispatchEvent(new window.KeyboardEvent('keydown', { key, bubbles: true, ...extra }));
  const pointerAt = (el, clientX) => el.dispatchEvent(new window.MouseEvent('pointermove', { clientX, clientY: 50, bubbles: true }));
  const setSelect = (sel, value) => {
    Object.getOwnPropertyDescriptor(window.HTMLSelectElement.prototype, 'value').set.call(sel, value);
    sel.dispatchEvent(new window.Event('change', { bubbles: true }));
  };
  const setNumber = (inp, value) => {
    Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set.call(inp, value);
    inp.dispatchEvent(new window.Event('input', { bubbles: true }));
  };
  Object.defineProperty(window.Element.prototype, 'clientWidth', { configurable: true, get() { return 360; } });

  // ---- inputs and runs
  const run = E.toTransferable(E.runModel(E.referenceT1()));
  const leader = run.options.reduce((a, b) => (b.rank < a.rank ? b : a));
  const islanded = run.options.filter((o) => o.v.C1 === 'islanded').sort((a, b) => a.rank - b.rank)[0];
  const battery = run.options.filter((o) => o.sizing.storage.mwh > 0).sort((a, b) => a.rank - b.rank)[0];
  const withRank = (id, rank) => ({ ...run, options: run.options.map((o) => (o.id === id ? { ...o, rank } : o)) });

  const rareBase = E.referenceT1();
  rareBase.choices.C1 = { state: 'open', values: ['wait', 'bridge', 'islanded', 'export'] };
  rareBase.choices.C2 = { state: 'open', values: ['gasRecip', 'fuelCell', 'rented', 'bessSolar', 'dieselPrime'] };
  rareBase.choices.C12 = { state: 'open', values: ['none', '2h25'] };
  rareBase.choices.C16 = { state: 'open', values: ['off', 'on'] };
  rareBase.grid.exportMW = 20;
  const rIn = E.normalizeInputs(rareBase);
  const rGen = E.generateOptions(rIn).options;
  const rp = (pred) => rGen.find((o) => pred(o.v));
  const mkOpt = (id, name, o, rank) => ({ id, name, rank, v: o.v, sizing: { storage: { mw: 0, mwh: 0 } }, dispatch: { years: [] } });
  const rareOpts = [
    mkOpt('FLEX', 'flex option', rp((v) => v.C16 === 'on' && v.C1 === 'wait' && v.C4 === 'none' && v.C13 !== 'none'), 1),
    mkOpt('CHP', 'chp option', rp((v) => v.C4 === 'chp' && v.C16 === 'off' && v.C1 === 'wait'), 2),
    mkOpt('EXP', 'export option', rp((v) => v.C1 === 'export' && v.C4 === 'none'), 3),
    mkOpt('BSOL', 'bessSolar bridge', rp((v) => v.C2 === 'bessSolar' && v.C1 === 'bridge' && v.C12 === '2h25'), 4),
    mkOpt('BISL', 'bessSolar islanded', rp((v) => v.C2 === 'bessSolar' && v.C1 === 'islanded' && v.C12 === '2h25'), 5),
  ].filter((o) => o.v);
  const runRare = { inputs: rIn, options: rareOpts };

  const exIn = E.normalizeInputs({ ...E.referenceT1(), settings: { ...E.referenceT1().settings, gridHandling: 'exceedance' } });
  const exO = E.generateOptions(exIn).options.find((o) => o.v.C1 === 'wait' && o.v.C13 === 'hybrid' && o.v.C4 === 'none');
  const runEx = { inputs: exIn, options: [mkOpt('EXC', 'exceedance option', { v: exO.v }, 1)] };

  let container = document.getElementById('root');
  let root = createRoot(container);
  const mount = (r) => act(() => { root.render(<DispatchView run={r} />); });

  // S1 default render
  mount(run);
  check('S1 default render: no NaN/undefined text', badTokens(container).length === 0, badTokens(container).join(',') || 'clean');
  check('S1 default year Year 3 (most unmet) and week 24 (unmet preset)', pressedYear() === 'Year 3' && weekVal() === 24, `${pressedYear()} week ${weekVal()}`);
  check('S1 two charts (phasing + hourly)', $$('.sc-wrap').length === 2, `charts ${$$('.sc-wrap').length}`);

  // S2 keyboard on phasing chart
  const wrapTL = $$('.sc-wrap')[0];
  act(() => { keyOn(wrapTL, 'ArrowRight'); }); act(() => { keyOn(wrapTL, 'ArrowRight'); }); act(() => { keyOn(wrapTL, 'ArrowRight'); });
  check('S2 ArrowRight x3 -> month 2', (tipIn(wrapTL) || '').endsWith('month 2'), tipIn(wrapTL));
  act(() => { keyOn(wrapTL, 'End'); });
  check('S2 End -> month 119', (tipIn(wrapTL) || '').endsWith('month 119'), tipIn(wrapTL));
  act(() => { keyOn(wrapTL, 'ArrowRight'); });
  check('S2 ArrowRight at last index stays 119', (tipIn(wrapTL) || '').endsWith('month 119'));
  act(() => { keyOn(wrapTL, 'Home'); });
  check('S2 Home -> month 0', (tipIn(wrapTL) || '').endsWith('month 0'), tipIn(wrapTL));
  act(() => { keyOn(wrapTL, 'ArrowLeft'); });
  check('S2 ArrowLeft at month 0 stays 0', (tipIn(wrapTL) || '').endsWith('month 0'));
  act(() => { keyOn(wrapTL, 'Escape'); });
  check('S2 Escape clears phasing tooltip', tipIn(wrapTL) === null);
  const overlay = $$('rect[fill="transparent"]', wrapTL)[0];
  act(() => { pointerAt(overlay, 46 + 0.5 * 304); });
  check('S2 pointer mid-plot -> month 60', (tipIn(wrapTL) || '').endsWith('month 60'), tipIn(wrapTL));
  act(() => { pointerAt(overlay, 10); });
  check('S2 pointer left of plot -> no tooltip', tipIn(wrapTL) === null);
  act(() => { pointerAt(overlay, 46 + 304 - 0.5); });
  check('S2 pointer last pixel -> month 119', (tipIn(wrapTL) || '').endsWith('month 119'), tipIn(wrapTL));
  act(() => { keyOn(wrapTL, 'Escape'); });

  // S3 keyboard on hourly chart (per-chart tooltip)
  const wrapHr = $$('.sc-wrap')[1];
  act(() => { keyOn(wrapHr, 'ArrowRight'); });
  log(`   S3 hourly first ArrowRight -> ${tipIn(wrapHr)}`);
  act(() => { keyOn(wrapHr, 'ArrowRight', { shiftKey: true }); });
  log(`   S3 hourly Shift+ArrowRight -> ${tipIn(wrapHr)}`);
  act(() => { keyOn(wrapHr, 'End'); });
  log(`   S3 hourly End -> ${tipIn(wrapHr)}`);
  act(() => { keyOn(wrapHr, 'ArrowRight'); });
  log(`   S3 hourly ArrowRight at end -> ${tipIn(wrapHr)}`);
  act(() => { keyOn(wrapHr, 'Escape'); });
  check('S3 hourly Escape clears tooltip', tipIn(wrapHr) === null);
  // hover then week change: tooltip must not survive a window change
  const overHr = $$('rect[fill="transparent"]', wrapHr)[0];
  act(() => { pointerAt(overHr, 46 + 0.25 * 304); });
  log(`   S3 hourly pointer at 25% -> ${tipIn(wrapHr)}`);
  act(() => { $('button[aria-label="Next week"]').click(); });
  log(`   S3 after Next week, hourly tooltip -> ${tipIn(wrapHr)} (week ${weekVal()})`);
  check('S3 tooltip cleared by week change', tipIn(wrapHr) === null);

  // S4 week controls
  const wk = $('#dv-week');
  act(() => { setNumber(wk, '0'); }); check('S4 typed 0 -> 1', weekVal() === 1, `value ${weekVal()}`);
  act(() => { setNumber(wk, '99'); }); check('S4 typed 99 -> 52', weekVal() === 52, `value ${weekVal()}`);
  act(() => { setNumber(wk, '1'); });
  check('S4 Previous disabled at week 1', $('button[aria-label="Previous week"]').disabled === true);
  act(() => { $$('button.chip-btn').find((b) => b.textContent.startsWith('Peak demand week')).click(); });
  check('S4 Peak preset -> week 51', weekVal() === 51, `value ${weekVal()}`);

  // S5 zero-load year and stale year state after option change
  act(() => { chips()[0].click(); });
  check('S5 Year 1 zero load: message, one chart', container.textContent.includes('No facility load in year 1') && $$('.sc-wrap').length === 1);
  check('S5 zero-load year: no NaN text', badTokens(container).length === 0, badTokens(container).join(',') || 'clean');
  act(() => { setSelect($('#dv-option'), battery.id); });
  check('S5 option change resets year to Year 3 from zero-load Year 1', pressedYear() === 'Year 3', `year ${pressedYear()}`);
  check('S5 battery option shows battery SOC chart', container.textContent.includes('Battery charge level (MWh of'));

  // S6 islanded option
  mount(withRank(islanded.id, 2.5));
  act(() => { setSelect($('#dv-option'), islanded.id); });
  check('S6 islanded: year 6 default, week 27', pressedYear() === 'Year 6' && weekVal() === 27, `${pressedYear()} week ${weekVal()}`);
  check('S6 islanded: grid excluded note + no NaN', container.textContent.includes('Islanded: the grid connection is not counted as supply') && badTokens(container).length === 0);

  // S7 rare options (synthetic run with the same engine inputs)
  mount(runRare);
  for (const o of rareOpts) {
    act(() => { setSelect($('#dv-option'), o.id); });
    const txt = container.textContent;
    const flags = [];
    if (txt.includes('Battery bridging')) flags.push('bridgeBattery-legend');
    if (txt.includes('Gross demand before credits')) flags.push('gross-row');
    if (txt.includes('less flexibility')) flags.push('flex-basis');
    if (txt.includes('less absorption-chiller credit')) flags.push('chp-basis');
    if (txt.includes('export below') || txt.includes('Export')) flags.push('export');
    if (txt.includes('Unmet load')) flags.push('unmet-text');
    log(`   S7 ${o.name} (C1=${o.v.C1} C2=${o.v.C2} C4=${o.v.C4} C12=${o.v.C12} C16=${o.v.C16}): year ${pressedYear()} week ${weekVal()} charts ${$$('.sc-wrap').length} NaN ${badTokens(container).join(',') || 'clean'} dashes ${dashes(container)} flags [${flags.join(' ')}]`);
  }
  // Bridging battery in the phasing chart for the bridge bessSolar option: first power, gap, legend
  act(() => { setSelect($('#dv-option'), 'BISL'); });
  log(`   S7 BISL phasing facts: ${$('.dv-facts') ? $('.dv-facts').textContent.slice(0, 260) : 'none'}`);
  act(() => { setSelect($('#dv-option'), 'EXC'); });
  mount(runEx);
  log(`   S7 exceedance option ${runEx.options[0].name}: NaN ${badTokens(container).join(',') || 'clean'}; note: ${container.textContent.includes('Show exceedance') ? 'exceedance note shown' : 'no exceedance note'}`);

  root.unmount();
  console.error = origError;
  log(`console.error captured: ${errors.length}`);
  for (const e of errors.slice(0, 6)) log(`   ERR ${e}`);
  console.log(results.join('\n'));
}
