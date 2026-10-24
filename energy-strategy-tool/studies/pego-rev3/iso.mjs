// Isometric massing render of an option's site layout (Pego study, revision 3). Uses the study build's own layout
// functions (layoutForOption), so the boxes are exactly the Site tab's placed blocks, extruded to their heights.
// Export: isoSVG(site, bs, layout, { title, width }) -> SVG string.
const COL = {
  building: ['#c9ced6', '#a9b0bb', '#8d95a2'], substation: ['#9fb7e0', '#7f9bd0', '#6782bf'], genset: ['#e6b46b', '#cf9a4f', '#b8843d'],
  fuel: ['#d98c6a', '#c07352', '#a95f40'], bess: ['#8fcf9f', '#6fb683', '#589c6c'], heatRejection: ['#b9dde3', '#98c8d0', '#7cb2bb'],
  roofPlant: ['#b9dde3', '#98c8d0', '#7cb2bb'], solarGround: ['#5b6f9a', '#4a5c84', '#3b4b6e'], solarRoof: ['#5b6f9a', '#4a5c84', '#3b4b6e'],
  turbine: ['#e39a8e', '#cc7f72', '#b4685c'], gasEngine: ['#e39a8e', '#cc7f72', '#b4685c'], fuelCell: ['#d7a8e0', '#bf8dc9', '#a676b1'],
  default: ['#d6d3cb', '#bdb9ae', '#a5a195'],
};
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');

export function isoSVG(site, bs, layout, { width = 1600, title = '', zScale = 3, labels = true } = {}) {
  // ground coordinates: UV (frame-aligned metres). Isometric: X = (u - v) cos30, Y = (u + v) sin30 - z
  const c30 = Math.cos(Math.PI / 6), s30 = 0.5;
  const P = (u, v, z = 0) => [(u - v) * c30, -(u + v) * s30 - z * zScale];
  const ring = site.boundary.uv;
  const env = site.envelope && site.envelope.uv ? site.envelope.uv : null;
  const boxes = [];
  for (const p of layout.placed) {
    const b = bs.ground[p.index];
    if (!b) continue;
    const h = Math.max(1.5, b.heightM || 3);
    boxes.push({ u0: p.x0, v0: p.y0, u1: p.x1, v1: p.y1, h, type: b.type, name: b.name, src: b.source });
  }
  if (layout.fill && layout.fill.rects) for (const r of layout.fill.rects) boxes.push({ u0: r.x0, v0: r.y0, u1: r.x1, v1: r.y1, h: 1.2, type: 'solarGround', name: 'Ground solar' });
  // bounds
  const pts = [];
  for (const [u, v] of ring) pts.push(P(u, v));
  for (const b of boxes) for (const [u, v] of [[b.u0, b.v0], [b.u1, b.v0], [b.u1, b.v1], [b.u0, b.v1]]) { pts.push(P(u, v, 0)); pts.push(P(u, v, b.h)); }
  const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
  const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
  const pad = 30, k = (width - 2 * pad) / (x1 - x0);
  const H = Math.round((y1 - y0) * k + 2 * pad + (title ? 40 : 0) + 40);
  const T = ([x, y]) => [((x - x0) * k + pad).toFixed(1), ((y - y0) * k + pad + (title ? 40 : 0)).toFixed(1)];
  const poly = (arr, fill, stroke = 'rgba(0,0,0,0.35)', sw = 0.6) => `<polygon points="${arr.map((q) => T(q).join(',')).join(' ')}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"/>`;
  const out = [];
  out.push(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${H}" width="${width}" height="${H}" font-family="Inter, Arial, sans-serif">`);
  out.push('<defs><marker id="arr" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="#1d1d1b"/></marker></defs>');
  out.push(`<rect width="${width}" height="${H}" fill="#f7f6f2"/>`);
  if (title) out.push(`<text x="${pad}" y="28" font-size="20" font-weight="600" fill="#1d1d1b">${esc(title)}</text>`);
  out.push(poly(ring.map(([u, v]) => P(u, v)), '#e3e6d6', '#6b705c', 1.4));
  if (env) out.push(poly(env.map(([u, v]) => P(u, v)), '#eef0e4', '#9aa08a', 0.8));
  // painter's order: far boxes first (larger -(u+v) is further back => sort by u+v ascending of the near corner)
  boxes.sort((a, b) => (b.u0 + b.v0) - (a.u0 + a.v0));
  for (const b of boxes) {
    const [top, left, right] = COL[b.type] || COL.default;
    const { u0, v0, u1, v1, h } = b;
    // visible side faces for this projection: the v = v0 face (front-left) and the u = u1 face (front-right)
    // In screen terms with X=(u-v)c, Y=-(u+v)s: the faces at u=u0 and v=v0 face the viewer (smaller u+v is nearer the bottom).
    out.push(poly([P(u0, v0, 0), P(u1, v0, 0), P(u1, v0, h), P(u0, v0, h)], right));
    out.push(poly([P(u0, v0, 0), P(u0, v1, 0), P(u0, v1, h), P(u0, v0, h)], left));
    out.push(poly([P(u0, v0, h), P(u1, v0, h), P(u1, v1, h), P(u0, v1, h)], top));
  }
  // legend (types present) and a north arrow (u = east, v = north for the default rectangle; frame angle applied)
  const NAMES = { building: 'Data halls', substation: 'Substation', genset: 'Standby gensets', fuel: 'Fuel store', bess: 'Battery', heatRejection: 'Dry coolers (ground)',
    roofPlant: 'Roof plant', solarGround: 'Ground solar', gasEngine: 'Gas engines / rented gensets', turbine: 'Gas turbines', fuelCell: 'Fuel cells' };
  const present = [...new Set(boxes.map((b) => b.type))].filter((t) => NAMES[t]);
  let ly = H - 18 - present.length * 26;
  out.push(`<rect x="${pad - 8}" y="${ly - 22}" width="300" height="${present.length * 26 + 28}" fill="#ffffff" fill-opacity="0.85" stroke="#d9d6ce"/>`);
  for (const t of present) {
    const [top] = COL[t] || COL.default;
    out.push(`<rect x="${pad}" y="${ly - 12}" width="18" height="14" fill="${top}" stroke="rgba(0,0,0,0.35)"/><text x="${pad + 28}" y="${ly}" font-size="17" fill="#1d1d1b">${NAMES[t]}</text>`);
    ly += 26;
  }
  const fa = site.frameAngle || 0; // rotation of the u axis from east, radians
  const nu = Math.sin(fa), nv = Math.cos(fa); // north in (u, v)
  const [ax, ay] = [width - 90, H - 90];
  const [dx, dy] = [(nu - nv) * c30, -(nu + nv) * s30];
  const L = 55 / Math.hypot(dx, dy);
  out.push(`<line x1="${ax}" y1="${ay}" x2="${(ax + dx * L).toFixed(1)}" y2="${(ay + dy * L).toFixed(1)}" stroke="#1d1d1b" stroke-width="3" marker-end="url(#arr)"/>`);
  out.push(`<text x="${(ax + dx * L * 1.35).toFixed(1)}" y="${(ay + dy * L * 1.35 + 6).toFixed(1)}" font-size="20" font-weight="600" text-anchor="middle">N</text>`);
  out.push(`<text x="${width - pad}" y="${H - 14}" font-size="14" fill="#5f5d57" text-anchor="end">heights ×${zScale}</text>`);
  out.push('</svg>');
  return out.join('\n');
}
