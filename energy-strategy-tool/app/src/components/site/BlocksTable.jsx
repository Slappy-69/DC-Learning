import React from 'react';
import { SOURCE_LABEL } from '../../engine/index.js';
import { SourceSwatch } from './SitePlan.jsx';

// Text alternative of the plan (§17 "every chart and plan has a data-table alternative"): every block of
// the shown option with its centre (metres east and north of the site origin), size, area, height,
// clearance and placement status, then the site itself (areas, exclusions, height zones, points).

const n0 = (x) => (Number.isFinite(x) ? Math.round(x).toLocaleString('en-GB') : '—');
const m1 = (x) => (Number.isFinite(x) ? Number(x.toFixed(1)).toLocaleString('en-GB') : '—');
const ll6 = (p) => `${p[0].toFixed(6)}, ${p[1].toFixed(6)}`;

function brokenText(br, nameOf, bessPair = false) {
  if (br.rule === 'separation') return `separation to ${nameOf(br.with)} ${m1(br.actualM)} m (rule ${m1(br.defaultM)} m, minimum ${m1(br.minM)} m)${bessPair ? '; a BESS separation below the §6.3 default needs UL 9540A test data or a fire-rated barrier' : ''}`;
  if (br.rule === 'boundary') return `boundary distance ${m1(br.actualM)} m (rule ${m1(br.defaultM)} m, minimum ${m1(br.minM)} m)`;
  if (br.rule === 'height') return `${br.element === 'stack' ? 'stack' : 'height'} ${m1(br.heightM)} m above the ${m1(br.limitM)} m limit`;
  if (br.rule === 'soft') return `in a soft exclusion (${n0(br.areaM2)} m²)`;
  if (br.rule === 'maxDistance') return `${m1(br.actualM)} m from the building (rule ≤ ${m1(br.defaultM)} m)`;
  return br.rule;
}

export function blockRows(site, res) {
  if (!res) return [];
  const g = res.bs.ground;
  const nameOf = (i) => (g[i] ? g[i].name : `block ${i + 1}`);
  const rows = [];
  for (const p of res.layout.placed) {
    const b = g[p.index];
    const c = site.toXYfromUV([(p.x0 + p.x1) / 2, (p.y0 + p.y1) / 2]);
    rows.push({
      key: `g${p.index}`, index: p.index, name: b.name, source: b.source, e: c[0], n: c[1], size: `${m1(p.x1 - p.x0)} × ${m1(p.y1 - p.y0)}`, areaM2: b.areaM2,
      heightM: Math.max(b.heightM || 0, b.stackM || 0), stack: !!b.stackM, clearanceM: b.clearanceM,
      status: p.broken.length ? `Placed, flagged: ${p.broken.map((br) => brokenText(br, nameOf, b.type === 'bess' || (g[br.with] && g[br.with].type === 'bess'))).join('; ')}` : 'Placed', flag: p.broken.length > 0,
    });
  }
  for (const u of res.layout.unplaced) {
    const b = g[u.index];
    rows.push({ key: `u${u.index}`, index: u.index, name: b.name, source: b.source, size: `${m1(b.w)} × ${m1(b.h)}`, areaM2: b.areaM2, heightM: Math.max(b.heightM || 0, b.stackM || 0), clearanceM: b.clearanceM, status: `Not placed (${u.reason === 'budget' ? 'net developable area used up' : 'no space that meets the minimum rules'}): ${n0(u.areaM2)} m² short`, flag: true });
  }
  const f = res.layout.fill;
  if (f) {
    rows.push({
      key: 'fill', name: `Ground PV (${f.mode === 'residual' ? 'fills the residual area' : 'fixed size'})${Number.isFinite(f.mwp) ? ` · ${f.mwp.toFixed(2)} MWp` : ''}`, source: 'solar', size: `${f.rects.length} strips`, areaM2: f.areaM2,
      heightM: res.bs.fill ? res.bs.fill.heightM : null, clearanceM: f.clearanceM,
      status: f.shortfallM2 > 0 ? `Placed in part: ${n0(f.shortfallM2)} m² short` : f.areaM2 > 0 ? 'Placed' : 'No residual area', flag: f.shortfallM2 > 0,
    });
  }
  for (const r of res.bs.roof) rows.push({ key: `r${r.type}`, name: r.name, source: r.source, size: 'on the roof', areaM2: r.areaM2, heightM: null, status: 'On the data-hall roof (counts toward building height)' });
  for (const o of res.bs.offsite) rows.push({ key: `o${o.type}`, name: o.name, source: o.source, size: 'off site', areaM2: o.landHa * 10000, heightM: o.heightM || null, status: `Off site: ${o.landHa.toFixed(2)} ha, ${o.distanceKm} km private wire` });
  return rows;
}

export default function BlocksTable({ site, res, option, id = 'site-table', activeIndex = null }) {
  const rows = blockRows(site, res);
  const pts = site.points;
  return (
    <section className="site-table" aria-labelledby={`${id}-h`}>
      <h3 id={`${id}-h`}>Plan as a table</h3>
      <p className="note">The same content as the plan{option ? ` of #${option.rank} ${option.name}` : ''}. Centres are metres east (E) and north (N) of the site origin ({ll6(site.origin)}).</p>
      {res ? (
        <div className="blocks-table-wrap" role="region" aria-labelledby={`${id}-h`} tabIndex={0}>
          <table className="mini blocks-table" id={id}>
            <caption className="sr-only">Blocks of the shown option, in placement order</caption>
            <thead>
              <tr><th scope="col">Block</th><th scope="col">Source</th><th scope="col" className="num">Centre E m</th><th scope="col" className="num">Centre N m</th><th scope="col">Size m</th><th scope="col" className="num">Area m²</th><th scope="col" className="num">Height m</th><th scope="col" className="num">Clearance m</th><th scope="col">Status</th></tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.key} className={activeIndex != null && r.index === activeIndex && r.key.startsWith('g') ? 'on' : undefined}>
                  <th scope="row" className="wrap">{r.name}</th>
                  <td><SourceSwatch src={r.source} /> {SOURCE_LABEL[r.source] || r.source}</td>
                  <td className="num">{r.e == null ? '—' : m1(r.e)}</td>
                  <td className="num">{r.n == null ? '—' : m1(r.n)}</td>
                  <td>{r.size}</td>
                  <td className="num">{n0(r.areaM2)}</td>
                  <td className="num">{r.heightM == null ? '—' : `${m1(r.heightM)}${r.stack ? ' (stack)' : ''}`}</td>
                  <td className="num">{r.clearanceM == null ? '—' : m1(r.clearanceM)}</td>
                  <td className={`wrap ${r.flag ? 'flag-text' : ''}`}>{r.flag ? '! ' : ''}{r.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : <p className="small">No layout shown: the site changed and the run is updating.</p>}
      {res && res.bs.notes && res.bs.notes.length ? <ul className="note plain">{res.bs.notes.map((t) => <li key={t}>{t}</li>)}</ul> : null}
      <table className="mini site-facts">
        <caption className="small">Site</caption>
        <tbody>
          <tr><th scope="row">Boundary</th><td>{site.boundary.fromArea ? 'Rectangle from area and aspect' : `${site.boundary.source} polygon`}, {site.edges.length} edges, gross {(site.areas.grossM2 / 10000).toFixed(2)} ha</td></tr>
          <tr><th scope="row">Buildable envelope</th><td>{(site.areas.envelopeM2 / 10000).toFixed(2)} ha (after setbacks {site.edges.some((e) => e.overridden) ? 'per edge' : `${site.uniformSetbackM} m`} and hard exclusions)</td></tr>
          <tr><th scope="row">Net developable</th><td>{(site.areas.netM2 / 10000).toFixed(2)} ha (roads, parking and landscaping {Math.round(site.areas.roadsFraction * 100)} % held back)</td></tr>
          {site.exclusions.map((x) => <tr key={x.id}><th scope="row">{x.name}</th><td>{x.typeLabel}, {x.hard ? 'hard' : 'soft'}, {(x.areaM2 / 10000).toFixed(2)} ha</td></tr>)}
          {site.heightZones.map((z) => <tr key={z.id}><th scope="row">{z.name}</th><td>Height limit {z.limitM} m, {(z.areaM2 / 10000).toFixed(2)} ha (elsewhere {site.heightLimitM} m)</td></tr>)}
          {!site.heightZones.length ? <tr><th scope="row">Height limit</th><td>{site.heightLimitM} m everywhere</td></tr> : null}
          <tr><th scope="row">{pts.poc.name}</th><td>{m1(pts.poc.xy[0])} m E, {m1(pts.poc.xy[1])} m N ({ll6(pts.poc.ll)})</td></tr>
          {pts.access.map((a, i) => <tr key={`a${i}`}><th scope="row">{a.name}</th><td>{m1(a.xy[0])} m E, {m1(a.xy[1])} m N ({ll6(a.ll)})</td></tr>)}
          {pts.gasMain ? <tr><th scope="row">Gas main</th><td>{m1(pts.gasMain.xy[0])} m E, {m1(pts.gasMain.xy[1])} m N ({ll6(pts.gasMain.ll)})</td></tr> : null}
          {site.routes ? <tr><th scope="row">Route lengths for cost</th><td>Grid cable {site.routes.pocM == null ? 'not costed (no buildable area)' : `${n0(site.routes.pocM)} m from the POC`}; gas pipe {site.routes.gasMainM == null ? 'not costed (no gas main location)' : `${n0(site.routes.gasMainM)} m from the gas main`} (straight line to the buildable envelope; the same for every option)</td></tr> : null}
          {pts.receptors.map((r) => <tr key={r.id}><th scope="row">{r.name}</th><td>{r.kind === 'point' ? `${m1(r.xy[0])} m E, ${m1(r.xy[1])} m N (${ll6(r.ll)})` : `area of ${(r.areaM2 / 10000).toFixed(2)} ha`}</td></tr>)}
        </tbody>
      </table>
    </section>
  );
}
