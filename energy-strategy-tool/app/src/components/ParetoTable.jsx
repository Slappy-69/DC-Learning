import React from 'react';
import { paretoTableRows } from '../engine/pareto.js';
import { sig, money } from '../format.js';

// Table alternative for the Pareto scatter (§17: every chart has a data-table alternative).
// Same rows as the chart's points (paretoTableRows), same order (rank), same values.
export function fmtAxis(axis, v) {
  if (!Number.isFinite(v)) return 'not plotted (no finite value)';
  if (axis.unit === '€') return money(v, 3);
  if (axis.unit === '%') return `${sig(v * 100, 3)} %`;
  return `${sig(v, 3)} ${axis.unit}`;
}

export default function ParetoTable({ model, page = 0, pageSize = 50, onOpen, openId }) {
  const rows = paretoTableRows(model);
  const slice = Number.isFinite(pageSize) ? rows.slice(page * pageSize, page * pageSize + pageSize) : rows;
  return (
    <table className="rank-table pareto-table" aria-describedby="pareto-table-cap">
      <caption id="pareto-table-cap" className="sr-only">
        Trade-off data: {model.xAxis.label} against {model.yAxis.label}, one row per option shown in the chart ({rows.length} rows, rank order).
      </caption>
      <thead>
        <tr>
          <th scope="col" className="num">Rank</th>
          <th scope="col">Option</th>
          <th scope="col" className="num">Score</th>
          <th scope="col" className="num">{model.xAxis.label} ({model.xAxis.unit})</th>
          <th scope="col" className="num">{model.yAxis.label} ({model.yAxis.unit})</th>
          <th scope="col" className="num">Time-to-power (months)</th>
          <th scope="col" className="num">Capex</th>
          <th scope="col">Site fit</th>
          <th scope="col">Resilience</th>
          <th scope="col">Dominance (4 axes and status)</th>
          <th scope="col">On 2-axis frontier</th>
        </tr>
      </thead>
      <tbody>
        {slice.map((r) => (
          <tr key={r.id} data-id={r.id} className={`${r.pick ? 'row-pick' : ''} ${openId === r.id ? 'row-open' : ''}`}>
            <td className="num">{r.rank}</td>
            <th scope="row" className="name-cell">
              {onOpen ? (
                <button type="button" className="row-btn" aria-expanded={openId === r.id} onClick={() => onOpen(r.id)}>{r.name}</button>
              ) : r.name}
              {r.pick ? <span className="badge badge-pick"><span aria-hidden="true">◎</span> Weighted pick</span> : null}
              {r.topScore ? <span className="badge badge-top">Highest weighted score</span> : null}
            </th>
            <td className="num strong">{r.score.toFixed(1)}</td>
            <td className="num">{fmtAxis(model.xAxis, r.x)}</td>
            <td className="num">{fmtAxis(model.yAxis, r.y)}</td>
            <td className="num">{sig(r.ttp, 3)}</td>
            <td className="num">{money(r.capex, 2)}</td>
            <td>{r.siteFit || 'not assessed'}</td>
            <td>{r.resilience}</td>
            <td>{r.dominated}</td>
            <td>{r.frontier ? 'Yes' : 'No'}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
