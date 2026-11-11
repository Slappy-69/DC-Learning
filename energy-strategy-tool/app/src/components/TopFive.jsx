import React, { useMemo } from 'react';
import { topCards } from '../engine/cards.js';
import { sig, money, perMWh } from '../format.js';
import { LABEL } from '../engine/defaults.js';
import { axisLabels, isRealismRun } from '../engine/labels.js';
import { TierBadge, ItBadge, LateBlock, ConditionList } from './Realism.jsx';

// Top five cards (BRIEF §12; work package 6; OPEN-QUESTIONS 24): five distinct strategies, the best-ranked option of
// each, in rank order; pros and cons judged against every option in the run.
const resCls = (s) => (s === 'Meets' ? 'ok' : s === 'Meets with flags' ? 'warn' : 'bad');

export default function TopFive({ run, onOpen, onCompare, compareIds = [] }) {
  const { cards, comparison } = useMemo(() => topCards(run.options, 5, run.sortedFigures), [run]);
  if (!cards.length) return null;
  const realism = isRealismRun(run);
  const AX = axisLabels(realism);
  const start = run.inputs.project.analysisStart;
  const allowance = run.inputs.requirements.lateAllowanceM ?? null;
  return (
    <section className="top5" aria-labelledby="top5-h">
      <h2 id="top5-h">Top five strategies</h2>
      {realism
        ? <p className="note">The best-ranked option of each of five distinct strategies, in rank order. A strategy is the campus's permanent supply: on the grid or islanded, the firm plant, the bridging plant that keeps running, a grid connection taken over. How the first buildings are bridged, solar, batteries and PPAs are variants of one strategy; the card shows the best-ranked one. Ranked first: options that serve every hour, are likely to be built (tier A or B), meet the resilience requirement, power the most IT and start every building within the latest acceptable start; then the weighted score. Pros and cons are judged {comparison}. Every default is {LABEL}.</p>
        : <p className="note">The best-ranked option of each of five distinct strategies (grid strategy, bridging plant, firm generation and backup), in rank order. Pros and cons are judged {comparison}. Every default is {LABEL}.</p>}
      <ol className="top5-list">
        {cards.map(({ o, pros, cons, majorFlags }) => (
          <li key={o.id} className="top5-card">
            <div className="tc-head">
              <span className="tc-rank">#{o.rank}</span>
              <button type="button" className="row-btn tc-name" onClick={() => onOpen && onOpen(o.id)}>{o.name}</button>
              <span className="tc-score">{o.score.toFixed(1)}</span>
            </div>
            <div className="tc-axes" aria-label={`Axis scores: cost ${o.axisScores.cost.toFixed(0)}, carbon ${o.axisScores.carbon.toFixed(0)}, ${AX.ttp.toLowerCase()} ${o.axisScores.ttp.toFixed(0)}, ${AX.deliverability.toLowerCase()} ${o.axisScores.deliverability.toFixed(0)}`}>
              <span>Cost {o.axisScores.cost.toFixed(0)}</span><span>Carbon {o.axisScores.carbon.toFixed(0)}</span><span>{AX.ttp} {o.axisScores.ttp.toFixed(0)}</span><span>{AX.deliverability} {o.axisScores.deliverability.toFixed(0)}</span>
            </div>
            {realism ? (
              <div className="tc-realism">
                <div className="row-tags"><TierBadge o={o} /> <ItBadge o={o} /></div>
                <LateBlock o={o} start={start} allowance={allowance} full />
                <ConditionList o={o} max={3} />
              </div>
            ) : null}
            <dl className="tc-figs">
              <div><dt>LCOE</dt><dd>{perMWh(o.eco.lcoe)}</dd></div>
              <div><dt>Carbon</dt><dd>{sig(o.carbon.locationG)} g/kWh</dd></div>
              <div><dt>Capex</dt><dd>{money(o.eco.capex, 3)}</dd></div>
              <div><dt>Resilience</dt><dd><span className={`badge badge-${resCls(o.resilience.status)}`}>{o.resilience.status}</span></dd></div>
              <div><dt>Power adequacy</dt><dd><span className={`badge badge-${o.adequacy && o.adequacy.adequate ? 'ok' : 'bad'}`}>{o.adequacy ? o.adequacy.status : 'not assessed'}</span></dd></div>
            </dl>
            <div className="tc-pc">
              <ul className="plain small tc-pros" aria-label="Pros">{pros.length ? pros.map((p) => <li key={p.id}><span aria-hidden="true">+</span> {p.text}</li>) : <li><span aria-hidden="true">+</span> n/a: not in the best 10 % of the run on any listed figure</li>}</ul>
              <ul className="plain small tc-cons" aria-label="Cons">{cons.length ? cons.map((p) => <li key={p.id}><span aria-hidden="true">−</span> {p.text}</li>) : <li><span aria-hidden="true">−</span> n/a: not in the worse half of the run on any listed figure</li>}</ul>
            </div>
            {majorFlags.length ? <p className="small flag-text">Main flags: {majorFlags.slice(0, 3).map((f) => f.message.split(':')[0].split('.')[0]).join(' · ')}{majorFlags.length > 3 ? ` · +${majorFlags.length - 3} more` : ''}</p> : <p className="small">No major flags.</p>}
            {(() => {
              const as = o.flags.filter((f) => f.assumed && f.path);
              return as.length ? <p className="small top5-assumed" title={as.map((f) => f.message).join('\n')}>Assumed defaults ({as.length}): {as.slice(0, 4).map((f) => f.message.replace(/^Assumed /, '').split(':')[0]).join(' · ')}{as.length > 4 ? ` · +${as.length - 4} more (option detail)` : ''}</p> : <p className="small">No key input assumed.</p>;
            })()}
            {onCompare ? <label className="inline-check small"><input type="checkbox" checked={compareIds.includes(o.id)} onChange={() => onCompare(o.id)} /> <span>Compare</span></label> : null}
          </li>
        ))}
      </ol>
    </section>
  );
}
