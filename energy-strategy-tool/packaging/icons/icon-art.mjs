// Icon art for Concept Energy Optioneering: a trade-off frontier (cost against carbon) with dominated options scattered
// above it and the chosen "knee" option picked out in amber, on the app's accent blue. No text, no brand marks.
// Every variant is built from the same geometry so a change here flows to the PWA, Windows, macOS and Linux icons.
// Colours: TILE is the app's light-theme --accent (#1f5f8b); PICK is the app's dark-theme --pick (#ffb366).

export const TILE = '#1f5f8b';
export const PICK = '#ffb366';
export const INK = '#ffffff';

// Quadratic Bezier for the frontier in a 512 x 512 design space.
const P0 = [170, 140];
const C = [178, 346];
const P2 = [380, 348];
const at = (t) => {
  const u = 1 - t;
  return [u * u * P0[0] + 2 * u * t * C[0] + t * t * P2[0], u * u * P0[1] + 2 * u * t * C[1] + t * t * P2[1]];
};
const f = (n) => Math.round(n * 10) / 10;

// The full motif (axes, dominated scatter, frontier, frontier options, picked knee), in design units.
function motif() {
  const [k1x, k1y] = at(0.1);
  const [kx, ky] = at(0.47);
  const [k2x, k2y] = at(0.9);
  const scatter = [[258, 210], [318, 170], [330, 262], [372, 214]];
  return [
    `<path d="M132 116V380H396" fill="none" stroke="${INK}" stroke-opacity=".42" stroke-width="18" stroke-linecap="round" stroke-linejoin="round"/>`,
    ...scatter.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="13" fill="${INK}" fill-opacity=".5"/>`),
    `<path d="M${P0[0]} ${P0[1]}Q${C[0]} ${C[1]} ${P2[0]} ${P2[1]}" fill="none" stroke="${INK}" stroke-width="22" stroke-linecap="round"/>`,
    `<circle cx="${f(k1x)}" cy="${f(k1y)}" r="19" fill="${INK}"/>`,
    `<circle cx="${f(k2x)}" cy="${f(k2y)}" r="19" fill="${INK}"/>`,
    `<circle cx="${f(kx)}" cy="${f(ky)}" r="36" fill="${INK}"/>`,
    `<circle cx="${f(kx)}" cy="${f(ky)}" r="25" fill="${PICK}"/>`,
  ].join('');
}

// Simplified motif for 16-32 px: thick frontier and the picked knee only.
function motifSmall() {
  const p0 = [150, 112];
  const c = [156, 372];
  const p2 = [404, 374];
  const t = 0.47;
  const u = 1 - t;
  const kx = u * u * p0[0] + 2 * u * t * c[0] + t * t * p2[0];
  const ky = u * u * p0[1] + 2 * u * t * c[1] + t * t * p2[1];
  return [
    `<path d="M${p0[0]} ${p0[1]}Q${c[0]} ${c[1]} ${p2[0]} ${p2[1]}" fill="none" stroke="${INK}" stroke-width="58" stroke-linecap="round"/>`,
    `<circle cx="${f(kx)}" cy="${f(ky)}" r="88" fill="${INK}"/>`,
    `<circle cx="${f(kx)}" cy="${f(ky)}" r="60" fill="${PICK}"/>`,
  ].join('');
}

const svg = (size, body, extraDefs = '') =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">${extraDefs}${body}</svg>\n`;

// Motif centre in design units (centre of the axes' bounding box) and a helper that places it scaled at a point.
const MC = [264, 248];
const place = (cx, cy, scale, body) => `<g transform="translate(${f(cx)} ${f(cy)}) scale(${scale}) translate(${-MC[0]} ${-MC[1]})">${body}</g>`;

// "any" icon: rounded tile with a small transparent margin (pad as a fraction of the canvas). Used for the manifest
// "any" icons, the SVG favicon, Windows .ico (48 px and up) and the Linux window icon.
export function iconAny({ pad = 0.03 } = {}) {
  const S = 512;
  const m = S * pad;
  const w = S - 2 * m;
  const r = w * 0.22;
  return svg(S, `<rect x="${f(m)}" y="${f(m)}" width="${f(w)}" height="${f(w)}" rx="${f(r)}" fill="${TILE}"/>${place(S / 2, S / 2 + 4, w / S, motif())}`);
}

// Maskable icon: full-bleed square; the motif is scaled to 0.8 so it sits well inside the 40 % radius safe zone
// (its farthest point is about 150 units from the centre; the safe zone radius is 204.8). Also used for the
// 180 px apple-touch icon, which iOS masks with its own rounded corners.
export function iconMaskable({ scale = 0.8 } = {}) {
  const S = 512;
  return svg(S, `<rect width="${S}" height="${S}" fill="${TILE}"/>${place(S / 2, S / 2 + 4, scale, motif())}`);
}

// Small icon (16-32 px): rounded tile filling the canvas, simplified motif.
export function iconSmall() {
  const S = 512;
  return svg(S, `<rect width="${S}" height="${S}" rx="104" fill="${TILE}"/>${motifSmall()}`);
}

// macOS icon: Big Sur grid (824 px rounded tile centred on a 1024 canvas, soft shadow below).
export function iconMac() {
  const S = 1024;
  const w = 824;
  const m = (S - w) / 2;
  const defs = '<defs><filter id="s" x="-10%" y="-10%" width="120%" height="125%"><feDropShadow dx="0" dy="10" stdDeviation="12" flood-color="#000" flood-opacity=".28"/></filter></defs>';
  return svg(S, `<rect x="${m}" y="${m}" width="${w}" height="${w}" rx="185" fill="${TILE}" filter="url(#s)"/>${place(S / 2, S / 2 + 6, w / 512, motif())}`, defs);
}
