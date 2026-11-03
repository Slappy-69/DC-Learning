// Minimal PDF writer (work package 10, BRIEF §12.10). No dependency and no network: the PDF is built in memory from
// text, tables and simple vector shapes, using the 14 standard PDF fonts (Helvetica and Helvetica-Bold, which every
// PDF reader has), so nothing is embedded or fetched. Text is WinAnsi-encoded; characters outside WinAnsi are
// replaced by plain equivalents (≥ → ">=", CO₂ → "CO2"). Pure: no browser APIs; output is a Uint8Array.

export const A4 = { w: 595.28, h: 841.89 };

// Advance widths (1/1000 em) for ASCII 32–126 of the five standard PDF fonts used (Adobe AFM data, as published with the
// 14 standard fonts; read from ReportLab's copy of the AFM files, 2026-11-02): Helvetica, Helvetica-Bold, Times-Roman,
// Times-Bold and Times-Italic. Nothing is embedded: every PDF reader has these fonts.
const HELV = [278, 278, 355, 556, 556, 889, 667, 191, 333, 333, 389, 584, 278, 333, 278, 278, 556, 556, 556, 556, 556, 556, 556, 556, 556, 556, 278, 278, 584, 584, 584, 556, 1015, 667, 667, 722, 722, 667, 611, 778, 722, 278, 500, 667, 556, 833, 722, 778, 667, 778, 722, 667, 611, 722, 667, 944, 667, 667, 611, 278, 278, 278, 469, 556, 333, 556, 556, 500, 556, 556, 278, 556, 556, 222, 222, 500, 222, 833, 556, 556, 556, 556, 333, 500, 278, 556, 500, 722, 500, 500, 500, 334, 260, 334, 584];
const HELVB = [278, 333, 474, 556, 556, 889, 722, 238, 333, 333, 389, 584, 278, 333, 278, 278, 556, 556, 556, 556, 556, 556, 556, 556, 556, 556, 333, 333, 584, 584, 584, 611, 975, 722, 722, 722, 722, 667, 611, 778, 722, 278, 556, 722, 611, 833, 722, 778, 667, 778, 722, 667, 611, 722, 667, 944, 667, 667, 611, 333, 278, 333, 584, 556, 333, 556, 611, 556, 611, 556, 333, 611, 611, 278, 278, 556, 278, 889, 611, 611, 611, 611, 389, 556, 333, 611, 556, 778, 556, 556, 500, 389, 280, 389, 584];
const TIMES = [250, 333, 408, 500, 500, 833, 778, 180, 333, 333, 500, 564, 250, 333, 250, 278, 500, 500, 500, 500, 500, 500, 500, 500, 500, 500, 278, 278, 564, 564, 564, 444, 921, 722, 667, 667, 722, 611, 556, 722, 722, 333, 389, 722, 611, 889, 722, 722, 556, 722, 667, 556, 611, 722, 722, 944, 722, 722, 611, 333, 278, 333, 469, 500, 333, 444, 500, 444, 500, 444, 333, 500, 500, 278, 278, 500, 278, 778, 500, 500, 500, 500, 333, 389, 278, 500, 500, 722, 500, 500, 444, 480, 200, 480, 541];
const TIMESB = [250, 333, 555, 500, 500, 1000, 833, 278, 333, 333, 500, 570, 250, 333, 250, 278, 500, 500, 500, 500, 500, 500, 500, 500, 500, 500, 333, 333, 570, 570, 570, 500, 930, 722, 667, 722, 722, 667, 611, 778, 778, 389, 500, 778, 667, 944, 722, 778, 611, 778, 722, 556, 667, 722, 722, 1000, 722, 722, 667, 333, 278, 333, 581, 500, 333, 500, 556, 444, 556, 444, 333, 500, 556, 278, 333, 556, 278, 833, 556, 500, 556, 556, 444, 389, 333, 556, 500, 722, 500, 500, 444, 394, 220, 394, 520];
const TIMESI = [250, 333, 420, 500, 500, 833, 778, 214, 333, 333, 500, 675, 250, 333, 250, 278, 500, 500, 500, 500, 500, 500, 500, 500, 500, 500, 333, 333, 675, 675, 675, 500, 920, 611, 611, 667, 722, 611, 611, 722, 722, 333, 444, 667, 556, 833, 667, 722, 611, 722, 611, 500, 556, 722, 611, 833, 611, 556, 556, 389, 278, 389, 422, 500, 333, 500, 500, 444, 500, 444, 278, 500, 500, 278, 278, 444, 278, 722, 500, 500, 500, 500, 389, 389, 278, 500, 444, 667, 444, 444, 389, 400, 275, 400, 541];
// WinAnsi bytes above 127 that are not Latin-1, with their Helvetica widths (regular and bold are equal for these).
const WIN = { '€': [0x80, 556], '‚': [0x82, 222], '„': [0x84, 333], '…': [0x85, 1000], '†': [0x86, 556], '‡': [0x87, 556], '‰': [0x89, 1000], '‘': [0x91, 222], '’': [0x92, 222], '“': [0x93, 333], '”': [0x94, 333], '•': [0x95, 350], '–': [0x96, 556], '—': [0x97, 1000], '™': [0x99, 1000], '→': [0x9b, 333], '›': [0x9b, 333] };
const LATIN1_W = { 0xa0: 278, 0xb0: 400, 0xb7: 278, 0xd7: 584, 0xb1: 584, 0xa3: 556, 0xa7: 556, 0xb2: 333, 0xb3: 333, 0xb9: 333, 0xbd: 834, 0xbc: 834, 0xbe: 834 };
// The same bytes in the Times fonts (regular; bold and italic differ only in the few listed).
const TIMES_HI = { 0x9b: 333, 0x80: 500, 0x82: 333, 0x84: 444, 0x85: 1000, 0x86: 500, 0x87: 500, 0x89: 1000, 0x91: 333, 0x92: 333, 0x93: 444, 0x94: 444, 0x95: 350, 0x96: 500, 0x97: 1000, 0x99: 980, 0xa0: 250, 0xb0: 400, 0xb7: 250, 0xd7: 564, 0xb1: 564, 0xa3: 500, 0xa7: 500, 0xb2: 300, 0xb3: 300, 0xb9: 300, 0xbd: 750, 0xbc: 750, 0xbe: 750 };
const TIMESB_HI = { ...TIMES_HI, 0x84: 500, 0x93: 500, 0x94: 500, 0x99: 1000, 0xd7: 570, 0xb1: 570 };
const TIMESI_HI = { ...TIMES_HI, 0x84: 556, 0x85: 889, 0x93: 556, 0x94: 556, 0x97: 889, 0xd7: 675, 0xb1: 675 };
// Characters outside WinAnsi: plain replacements.
const SUBST = { '≥': '>=', '≤': '<=', '≈': '~', '←': '<-', '↔': '<->', '−': '-', '✓': 'yes', '✗': 'x', '✔': 'yes', '✘': 'x', '≠': '!=', '∞': 'infinite', 'Δ': 'delta ', '…': '...', ' ': ' ', ' ': ' ', '‑': '-', '​': '' };
for (let i = 0; i <= 9; i++) { SUBST[String.fromCharCode(0x2080 + i)] = String(i); SUBST[String.fromCharCode(0x2070 + i)] = String(i); }
SUBST['¹'] = '1'; SUBST['²'] = '2'; SUBST['³'] = '3';

// A JS string as WinAnsi bytes (one char per byte, codes 0–255) with the replacements above.
export function toWinAnsi(s) {
  let out = '';
  for (const ch of String(s ?? '')) {
    if (SUBST[ch] != null) { out += SUBST[ch]; continue; }
    const c = ch.codePointAt(0);
    if (c === 9) { out += ' '; continue; }
    if (c >= 32 && c <= 126) { out += ch; continue; }
    if (WIN[ch]) { out += String.fromCharCode(WIN[ch][0]); continue; }
    if (c >= 0xa0 && c <= 0xff) { out += ch; continue; }
    out += '?';
  }
  return out;
}

const WIN_BY_BYTE = Object.fromEntries(Object.values(WIN).map(([b, w]) => [b, w]));
const SANS_HI = { ...WIN_BY_BYTE, ...LATIN1_W };
// Fonts: F1 Helvetica, F2 Helvetica-Bold, F3 Times-Roman, F4 Times-Bold, F5 Times-Italic. Functions that take a font accept
// one of these keys, or a boolean as before (false = Helvetica, true = Helvetica-Bold).
export const FONTS = { F1: 'Helvetica', F2: 'Helvetica-Bold', F3: 'Times-Roman', F4: 'Times-Bold', F5: 'Times-Italic' };
const ASCII_W = { F1: HELV, F2: HELVB, F3: TIMES, F4: TIMESB, F5: TIMESI };
const HI_W = { F1: SANS_HI, F2: SANS_HI, F3: TIMES_HI, F4: TIMESB_HI, F5: TIMESI_HI };
export const fontKey = (f) => (f === true ? 'F2' : !f ? 'F1' : FONTS[f] ? f : 'F1');
function charW(code, font) {
  const k = fontKey(font);
  if (code >= 32 && code <= 126) return ASCII_W[k][code - 32];
  if (HI_W[k][code]) return HI_W[k][code];
  const sans = k === 'F1' || k === 'F2';
  return code >= 0xc0 ? (sans ? 667 : 611) : sans ? 556 : 500; // accented capitals and small letters: near enough for wrapping
}
// Width in points of an already-encoded WinAnsi string.
export function textWidth(enc, size, font = false) {
  let w = 0;
  for (let i = 0; i < enc.length; i++) w += charW(enc.charCodeAt(i), font);
  return (w * size) / 1000;
}
// Wrap text (any string) to a width; returns encoded lines. Long words are broken.
export function wrap(text, width, size, font = false) {
  const lines = [];
  for (const para of String(text ?? '').split('\n')) {
    const words = toWinAnsi(para).split(' ');
    let line = '';
    for (let word of words) {
      const cand = line ? `${line} ${word}` : word;
      if (textWidth(cand, size, font) <= width) { line = cand; continue; }
      if (line) lines.push(line);
      while (textWidth(word, size, font) > width && word.length > 1) {
        let k = word.length - 1;
        while (k > 1 && textWidth(word.slice(0, k), size, font) > width) k--;
        lines.push(word.slice(0, k));
        word = word.slice(k);
      }
      line = word;
    }
    lines.push(line);
  }
  return lines;
}

// Rich text: "**…**" switches to the strong font and back. Returns lines, each a list of segments { enc, f } that are drawn
// one after the other (the space between two words belongs to the segment before it). Long words are broken.
export function wrapRich(text, width, size, base = 'F3', strong = 'F4') {
  const out = [];
  for (const para of String(text ?? '').split('\n')) {
    // Words as lists of pieces (a word can change font in its middle, as in "**£13.9 m**.").
    const words = [];
    let open = false; // whether the next piece continues the last word (no space between)
    para.split('**').forEach((part, i) => {
      const f = i % 2 ? strong : base;
      const pieces = toWinAnsi(part).split(' ');
      pieces.forEach((pc, j) => {
        if (j > 0) open = false;
        if (pc === '') return;
        if (open && words.length) words[words.length - 1].push({ enc: pc, f });
        else words.push([{ enc: pc, f }]);
        open = true;
      });
      if (part.endsWith(' ')) open = false;
    });
    const wWord = (wd) => wd.reduce((a, pc) => a + textWidth(pc.enc, size, pc.f), 0);
    let line = [], lw = 0;
    const flush = () => { out.push(line); line = []; lw = 0; };
    for (let wd of words) {
      const sp = line.length ? textWidth(' ', size, wd[0].f) : 0;
      const ww = wWord(wd);
      if (lw + sp + ww <= width || !line.length && ww <= width) { line.push(wd); lw += sp + ww; continue; }
      if (line.length) flush();
      // A word wider than the line: break it by characters.
      while (wWord(wd) > width && (wd.length > 1 || wd[0].enc.length > 1)) {
        const flat = wd.flatMap((pc) => [...pc.enc].map((c) => ({ enc: c, f: pc.f })));
        let k = flat.length - 1;
        while (k > 1 && flat.slice(0, k).reduce((a, c) => a + textWidth(c.enc, size, c.f), 0) > width) k--;
        out.push([flat.slice(0, k)]);
        wd = flat.slice(k);
      }
      line = [wd]; lw = wWord(wd);
    }
    if (line.length || !out.length || para === '') flush();
  }
  // Join into segments: consecutive pieces in the same font, with the spaces between words.
  return out.map((ws) => {
    const segs = [];
    ws.forEach((wd, wi) => wd.forEach((pc, pi) => {
      const lead = wi > 0 && pi === 0 ? ' ' : '';
      const last = segs[segs.length - 1];
      if (lead && last) last.enc += ' ';
      if (last && last.f === pc.f) last.enc += pc.enc;
      else segs.push({ enc: (lead && !last ? ' ' : '') + pc.enc, f: pc.f });
    }));
    return segs;
  });
}
const segWidth = (segs, size) => segs.reduce((a, s) => a + textWidth(s.enc, size, s.f), 0);
const esc = (enc) => enc.replace(/[\\()]/g, (m) => `\\${m}`);
const n2 = (x) => (Math.round(x * 100) / 100).toString();

// Colours as [r, g, b] in 0–1.
export const INK = [0.1, 0.1, 0.12], MUTED = [0.38, 0.38, 0.42], LINE = [0.78, 0.77, 0.73], ACCENT = [0.12, 0.36, 0.55], FLAG = [0.62, 0.16, 0.12], ZEBRA = [0.955, 0.95, 0.94];
export const ORANGE = [0.89, 0.39, 0.13], PALE = [0.62, 0.74, 0.86], TINT = [0.925, 0.95, 0.975], HEAD_FILL = [0.94, 0.935, 0.92];

// A document of A4 pages with a flowing cursor. Content methods add to the current page and start a new one when
// the next block does not fit. Page numbers ("Page n of N") and the footer are written when the PDF is finished.
export class PdfDoc {
  constructor({ title = 'Report', footer = '', margin = 48 } = {}) {
    this.title = title;
    this.footer = footer;
    this.m = margin;
    this.pages = [];
    this.outline = []; // { title, page, y }
    this.newPage();
  }
  get width() { return A4.w - 2 * this.m; }
  newPage() {
    this.ops = [];
    this.pages.push(this.ops);
    this.y = A4.h - this.m;
  }
  ensure(h) { if (this.y - h < this.m + 24) this.newPage(); }
  // Room left on the page above the footer.
  get room() { return this.y - (this.m + 24); }
  // Low-level drawing (PDF coordinates: origin bottom left). font: a key F1–F5 or a boolean (bold Helvetica).
  text(x, y, enc, size = 10, font = false, color = INK, spacing = 0) {
    const tc = spacing ? `${n2(spacing)} Tc ` : '';
    this.ops.push(`BT ${color.map(n2).join(' ')} rg /${fontKey(font)} ${n2(size)} Tf ${tc}${n2(x)} ${n2(y)} Td (${esc(enc)}) Tj${spacing ? ' 0 Tc' : ''} ET`);
  }
  // One line of rich-text segments, drawn in one text object (each Tj moves on by its own width).
  segs(x, y, segs, size = 10, color = INK) {
    if (!segs.length) return;
    let cur = null;
    const parts = segs.map((s) => { const f = s.f === cur ? '' : `/${s.f} ${n2(size)} Tf `; cur = s.f; return `${f}(${esc(s.enc)}) Tj`; });
    this.ops.push(`BT ${color.map(n2).join(' ')} rg ${n2(x)} ${n2(y)} Td ${parts.join(' ')} ET`);
  }
  // Like text(), for a plain JS string (encoded here).
  label(x, y, str, size = 10, font = false, color = INK) { this.text(x, y, toWinAnsi(str), size, font, color); }
  // A label ending at x (right-aligned) or centred on x.
  labelRight(x, y, str, size = 10, font = false, color = INK) { const e = toWinAnsi(str); this.text(x - textWidth(e, size, font), y, e, size, font, color); }
  labelCentre(x, y, str, size = 10, font = false, color = INK) { const e = toWinAnsi(str); this.text(x - textWidth(e, size, font) / 2, y, e, size, font, color); }
  rect(x, y, w, h, { fill = null, stroke = null, lw = 0.6 } = {}) {
    const p = [];
    if (fill) p.push(`${fill.map(n2).join(' ')} rg`);
    if (stroke) p.push(`${stroke.map(n2).join(' ')} RG ${n2(lw)} w`);
    p.push(`${n2(x)} ${n2(y)} ${n2(w)} ${n2(h)} re ${fill && stroke ? 'B' : fill ? 'f' : 'S'}`);
    this.ops.push(`q ${p.join(' ')} Q`);
  }
  line(x1, y1, x2, y2, { color = LINE, lw = 0.6, dash = null } = {}) {
    this.ops.push(`q ${color.map(n2).join(' ')} RG ${n2(lw)} w ${dash ? `[${dash.join(' ')}] 0 d ` : ''}${n2(x1)} ${n2(y1)} m ${n2(x2)} ${n2(y2)} l S Q`);
  }
  // A path through the points [[x, y], …]: stroked (polyline) or, with fill, closed and filled.
  path(pts, { fill = null, stroke = null, lw = 0.8, dash = null, close = false } = {}) {
    if (pts.length < 2) return;
    const p = [];
    if (fill) p.push(`${fill.map(n2).join(' ')} rg`);
    if (stroke) p.push(`${stroke.map(n2).join(' ')} RG ${n2(lw)} w 1 j`);
    if (dash) p.push(`[${dash.join(' ')}] 0 d`);
    const d = pts.map(([x, y], i) => `${n2(x)} ${n2(y)} ${i ? 'l' : 'm'}`).join(' ');
    const op = fill && stroke ? 'b' : fill ? 'f' : close ? 's' : 'S';
    this.ops.push(`q ${p.join(' ')} ${d} ${fill || close ? 'h ' : ''}${op} Q`);
  }
  circle(cx, cy, r, { fill = null, stroke = null, lw = 0.5 } = {}) {
    const k = 0.5523 * r;
    const path = `${n2(cx + r)} ${n2(cy)} m ${n2(cx + r)} ${n2(cy + k)} ${n2(cx + k)} ${n2(cy + r)} ${n2(cx)} ${n2(cy + r)} c ${n2(cx - k)} ${n2(cy + r)} ${n2(cx - r)} ${n2(cy + k)} ${n2(cx - r)} ${n2(cy)} c ${n2(cx - r)} ${n2(cy - k)} ${n2(cx - k)} ${n2(cy - r)} ${n2(cx)} ${n2(cy - r)} c ${n2(cx + k)} ${n2(cy - r)} ${n2(cx + r)} ${n2(cy - k)} ${n2(cx + r)} ${n2(cy)} c`;
    const p = [];
    if (fill) p.push(`${fill.map(n2).join(' ')} rg`);
    if (stroke) p.push(`${stroke.map(n2).join(' ')} RG ${n2(lw)} w`);
    this.ops.push(`q ${p.join(' ')} ${path} ${fill && stroke ? 'B' : fill ? 'f' : 'S'} Q`);
  }
  // Flowing content.
  // Headings: level 1 is a numbered section with a rule above it, level 2 a sub-heading, level 3 a small one.
  heading(t, level = 1) {
    const size = level === 1 ? 15 : level === 2 ? 11 : 9.5;
    const lines = wrap(t, this.width, size, true);
    const h = lines.length * size * 1.25 + (level === 1 ? 22 : 8);
    this.ensure(h + 40); // keep a heading with what follows
    if (level === 1) {
      if (this.y < A4.h - this.m - 1) this.y -= 10;
      this.line(this.m, this.y, this.m + this.width, this.y, { color: INK, lw: 0.9 });
      this.y -= 6;
    } else this.y -= level === 2 ? 7 : 4;
    if (level <= 2) this.outline.push({ title: t, level, page: this.pages.length - 1, y: this.y + 4 });
    for (const l of lines) { this.y -= size * 1.22; this.text(this.m, this.y, l, size, true, INK); }
    this.y -= level === 1 ? 10 : 5;
  }
  para(t, { size = 9.5, bold = false, font = null, color = INK, indent = 0, gap = 5 } = {}) {
    const f = font || bold;
    const lines = wrap(t, this.width - indent, size, f);
    for (const l of lines) {
      this.ensure(size * 1.35);
      this.y -= size * 1.35;
      this.text(this.m + indent, this.y, l, size, f, color);
    }
    this.y -= gap;
  }
  // Body text in Times with "**bold**" runs; lead = line height ÷ size.
  prose(t, { size = 10, color = INK, indent = 0, gap = 7, lead = 1.42, base = 'F3', strong = 'F4', width = null } = {}) {
    const lines = wrapRich(t, (width || this.width) - indent, size, base, strong);
    for (const l of lines) {
      this.ensure(size * lead);
      this.y -= size * lead;
      this.segs(this.m + indent, this.y, l, size, color);
    }
    this.y -= gap;
  }
  // A small, letter-spaced line in capitals above a title.
  kicker(t, { size = 7.5, color = MUTED, spacing = 1.6 } = {}) {
    this.y -= size * 1.3;
    this.text(this.m, this.y, toWinAnsi(String(t).toUpperCase()), size, 'F1', color, spacing);
    this.y -= 10;
  }
  // Figure caption: small sans, muted.
  caption(t, { size = 7.5, gap = 10 } = {}) { this.prose(t, { size, color: MUTED, base: 'F1', strong: 'F2', lead: 1.35, gap }); }
  rule({ color = LINE, lw = 0.6, before = 4, after = 8 } = {}) {
    this.y -= before;
    this.line(this.m, this.y, this.m + this.width, this.y, { color, lw });
    this.y -= after;
  }
  bullets(items, opts = {}) {
    const size = opts.size || 9.5;
    for (const it of items) {
      const lines = wrap(it, this.width - 12, size);
      lines.forEach((l, i) => {
        this.ensure(size * 1.35);
        this.y -= size * 1.35;
        if (i === 0) this.text(this.m + 2, this.y, toWinAnsi('•'), size, false, opts.color || INK);
        this.text(this.m + 12, this.y, l, size, false, opts.color || INK);
      });
      this.y -= 2;
    }
    this.y -= 4;
  }
  // A list in Times with "**bold**" runs: numbered (1. 2. …) or with bullets.
  list(items, { numbered = false, size = 9.5, lead = 1.38, gap = 3, after = 6, color = INK, base = 'F3', strong = 'F4' } = {}) {
    const ind = numbered ? 16 : 13;
    items.forEach((it, k) => {
      const lines = wrapRich(it, this.width - ind, size, base, strong);
      lines.forEach((l, i) => {
        this.ensure(size * lead);
        this.y -= size * lead;
        if (i === 0) {
          const mark = toWinAnsi(numbered ? `${k + 1}.` : '•');
          this.text(this.m + (numbered ? ind - 4 - textWidth(mark, size, base) : 3), this.y, mark, size, base, color);
        }
        this.segs(this.m + ind, this.y, l, size, color);
      });
      this.y -= gap;
    });
    this.y -= after;
  }
  // Headline figures in a row: [{ big, caption }]; a rule above each, the figure large and a caption under it.
  tiles(items, { gap = 14, bigSize = 17, capSize = 7 } = {}) {
    const n = items.length;
    const w = (this.width - gap * (n - 1)) / n;
    const caps = items.map((it) => wrap(it.caption || '', w, capSize, 'F1'));
    const h = 8 + bigSize * 1.15 + 10 + Math.max(1, ...caps.map((c) => c.length)) * capSize * 1.3;
    this.ensure(h + 8);
    const top = this.y;
    items.forEach((it, i) => {
      const x = this.m + i * (w + gap);
      this.line(x, top, x + w, top, { color: INK, lw: 1.5 });
      let sz = bigSize;
      const enc = toWinAnsi(it.big);
      while (sz > 9 && textWidth(enc, sz, 'F2') > w) sz -= 0.5;
      this.text(x, top - 6 - sz, enc, sz, 'F2', INK);
      caps[i].forEach((l, j) => this.text(x, top - 6 - bigSize * 1.15 - 10 - j * capSize * 1.3, l, capSize, 'F1', MUTED));
    });
    this.y = top - h - 10;
  }
  // Columns of short rich lines side by side (a title block): cols = [[line, …], …]; returns nothing.
  columns(cols, { size = 7.5, lead = 1.45, gap = 18 } = {}) {
    const w = (this.width - gap * (cols.length - 1)) / cols.length;
    const wrapped = cols.map((c) => c.flatMap((t) => wrapRich(t, w, size, 'F1', 'F2')));
    const h = Math.max(...wrapped.map((c) => c.length)) * size * lead;
    this.ensure(h);
    const top = this.y;
    wrapped.forEach((c, i) => c.forEach((l, j) => this.segs(this.m + i * (w + gap), top - (j + 1) * size * lead, l, size, INK)));
    this.y = top - h;
  }
  space(h) { this.y -= h; }
  // Table: cols [{ label, w (fraction), align }]; rows: arrays of strings. Header repeats on a new page.
  // highlight: row indexes drawn on a light blue tint; font: body font (default Helvetica).
  table(cols, rows, { size = 8, headSize = 8, zebra = true, boldFirst = false, highlight = null, font = 'F1', headFill = [0.9, 0.89, 0.86] } = {}) {
    const W = this.width;
    const tot = cols.reduce((a, c) => a + (c.w || 1), 0);
    const xs = [];
    let acc = this.m;
    for (const c of cols) { xs.push(acc); acc += ((c.w || 1) / tot) * W; }
    const ws = cols.map((c) => ((c.w || 1) / tot) * W);
    const pad = 3;
    const lh = size * 1.25;
    const boldF = font === 'F3' ? 'F4' : 'F2';
    const header = () => {
      const hl = cols.map((c, i) => wrap(c.label, ws[i] - 2 * pad, headSize, true));
      const hh = Math.max(...hl.map((l) => l.length)) * headSize * 1.25 + 2 * pad;
      this.ensure(hh + lh + 2 * pad);
      this.rect(this.m, this.y - hh, W, hh, { fill: headFill });
      hl.forEach((ls, i) => ls.forEach((l, j) => {
        const tw = textWidth(l, headSize, true);
        const x = cols[i].align === 'right' ? xs[i] + ws[i] - pad - tw : xs[i] + pad;
        this.text(x, this.y - pad - (j + 1) * headSize * 1.25 + 2, l, headSize, true);
      }));
      this.y -= hh;
    };
    header();
    rows.forEach((row, ri) => {
      const cl = row.map((v, i) => wrapRich(v, ws[i] - 2 * pad, size, boldFirst && i === 0 ? boldF : font, boldF));
      const rh = Math.max(1, ...cl.map((l) => l.length)) * lh + 2 * pad;
      if (this.y - rh < this.m + 24) { this.newPage(); header(); }
      if (highlight && highlight.has(ri)) this.rect(this.m, this.y - rh, W, rh, { fill: TINT });
      else if (zebra && ri % 2 === 1) this.rect(this.m, this.y - rh, W, rh, { fill: ZEBRA });
      cl.forEach((ls, i) => ls.forEach((l, j) => {
        const tw = segWidth(l, size);
        const x = cols[i].align === 'right' ? xs[i] + ws[i] - pad - tw : xs[i] + pad;
        this.segs(x, this.y - pad - (j + 1) * lh + 2, l, size, INK);
      }));
      this.y -= rh;
      this.line(this.m, this.y, this.m + W, this.y, { color: LINE, lw: 0.4 });
    });
    this.y -= 8;
  }
  // A drawing block of height h: fn(x0, y0 (bottom), w, h) draws with the low-level methods.
  figure(h, fn) {
    this.ensure(h + 6);
    const y0 = this.y - h;
    fn(this.m, y0, this.width, h);
    this.y = y0 - 8;
  }

  // The finished PDF as bytes (latin1 string → Uint8Array).
  bytes({ created = null } = {}) {
    const N = this.pages.length;
    const footerEnc = toWinAnsi(this.footer);
    const objs = []; // index = object number - 1
    const add = (s) => { objs.push(s); return objs.length; };
    const catalog = add(null), pagesObj = add(null);
    const fontIds = Object.fromEntries(Object.entries(FONTS).map(([k, name]) => [k, add(`<< /Type /Font /Subtype /Type1 /BaseFont /${name} /Encoding /WinAnsiEncoding >>`)]));
    const fontRes = Object.entries(fontIds).map(([k, id]) => `/${k} ${id} 0 R`).join(' ');
    const pageIds = [];
    this.pages.forEach((ops, i) => {
      const foot = [];
      const ft = toWinAnsi(`Page ${i + 1} of ${N}`);
      foot.push(`BT ${MUTED.map(n2).join(' ')} rg /F1 7 Tf ${n2(A4.w - this.m - textWidth(ft, 7))} ${n2(this.m - 22)} Td (${esc(ft)}) Tj ET`);
      if (footerEnc) {
        const fl = wrap(this.footer, this.width - 70, 6.5)[0];
        foot.push(`BT ${MUTED.map(n2).join(' ')} rg /F1 6.5 Tf ${n2(this.m)} ${n2(this.m - 22)} Td (${esc(fl)}) Tj ET`);
      }
      const content = [...ops, ...foot].join('\n');
      const cs = add(`<< /Length ${content.length} >>\nstream\n${content}\nendstream`);
      pageIds.push(add(`<< /Type /Page /Parent ${pagesObj} 0 R /MediaBox [0 0 ${A4.w} ${A4.h}] /Resources << /Font << ${fontRes} >> >> /Contents ${cs} 0 R >>`));
    });
    objs[pagesObj - 1] = `<< /Type /Pages /Kids [${pageIds.map((p) => `${p} 0 R`).join(' ')}] /Count ${N} >>`;
    // Bookmarks (outline) for the level-1 headings, so a reader's side panel lists the sections.
    const top = this.outline.filter((o) => o.level === 1);
    let outlineRef = '';
    if (top.length) {
      const root = add(null);
      const ids = top.map(() => add(null));
      top.forEach((o, i) => {
        objs[ids[i] - 1] = `<< /Title (${esc(toWinAnsi(o.title))}) /Parent ${root} 0 R${i > 0 ? ` /Prev ${ids[i - 1]} 0 R` : ''}${i < top.length - 1 ? ` /Next ${ids[i + 1]} 0 R` : ''} /Dest [${pageIds[o.page]} 0 R /XYZ 0 ${n2(o.y)} 0] >>`;
      });
      objs[root - 1] = `<< /Type /Outlines /First ${ids[0]} 0 R /Last ${ids[ids.length - 1]} 0 R /Count ${top.length} >>`;
      outlineRef = ` /Outlines ${root} 0 R /PageMode /UseOutlines`;
    }
    objs[catalog - 1] = `<< /Type /Catalog /Pages ${pagesObj} 0 R${outlineRef} /Lang (en-GB) >>`;
    const d = created instanceof Date ? created : null;
    const pdfDate = d ? `D:${d.getUTCFullYear()}${String(d.getUTCMonth() + 1).padStart(2, '0')}${String(d.getUTCDate()).padStart(2, '0')}${String(d.getUTCHours()).padStart(2, '0')}${String(d.getUTCMinutes()).padStart(2, '0')}00Z` : null;
    const info = add(`<< /Title (${esc(toWinAnsi(this.title))}) /Producer (Data centre energy strategy tool)${pdfDate ? ` /CreationDate (${pdfDate})` : ''} >>`);
    let out = '%PDF-1.4\n%\xe2\xe3\xcf\xd3\n';
    const offsets = [];
    objs.forEach((o, i) => { offsets.push(out.length); out += `${i + 1} 0 obj\n${o}\nendobj\n`; });
    const xref = out.length;
    out += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n${offsets.map((o) => `${String(o).padStart(10, '0')} 00000 n \n`).join('')}`;
    out += `trailer\n<< /Size ${objs.length + 1} /Root ${catalog} 0 R /Info ${info} 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
    const bytes = new Uint8Array(out.length);
    for (let i = 0; i < out.length; i++) bytes[i] = out.charCodeAt(i) & 0xff;
    return bytes;
  }
}

// Text drawn on each page, decoded (for tests): one entry per text object (the strings of its Tj operators joined, so a
// line of rich text comes back whole), page by page.
export function pdfPageTexts(bytes) {
  let s = '';
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
  const pages = [];
  const re = /stream\n([\s\S]*?)\nendstream/g;
  let m;
  while ((m = re.exec(s))) {
    const strs = [];
    for (const op of m[1].split('\n')) {
      if (!op.includes(') Tj')) continue;
      const tj = /\(((?:\\.|[^\\)])*)\) Tj/g;
      let t, line = '';
      while ((t = tj.exec(op))) line += t[1].replace(/\\(.)/g, '$1');
      strs.push(line);
    }
    pages.push(strs.join('\n'));
  }
  return pages;
}
