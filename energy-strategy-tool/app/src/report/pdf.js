// Minimal PDF writer (work package 10, BRIEF §12.10). No dependency and no network: the PDF is built in memory from
// text, tables and simple vector shapes, using the 14 standard PDF fonts (Helvetica and Helvetica-Bold, which every
// PDF reader has), so nothing is embedded or fetched. Text is WinAnsi-encoded; characters outside WinAnsi are
// replaced by plain equivalents (≥ → ">=", CO₂ → "CO2"). Pure: no browser APIs; output is a Uint8Array.

export const A4 = { w: 595.28, h: 841.89 };

// Helvetica and Helvetica-Bold advance widths (1/1000 em) for ASCII 32–126 (Adobe AFM).
const HELV = [278, 278, 355, 556, 556, 889, 667, 191, 333, 333, 389, 584, 278, 333, 278, 278, 556, 556, 556, 556, 556, 556, 556, 556, 556, 556, 278, 278, 584, 584, 584, 556, 1015, 667, 667, 722, 722, 667, 611, 778, 722, 278, 500, 667, 556, 833, 722, 778, 667, 778, 722, 667, 611, 722, 667, 944, 667, 667, 611, 278, 278, 278, 469, 556, 333, 556, 556, 500, 556, 556, 278, 556, 556, 222, 222, 500, 222, 833, 556, 556, 556, 556, 333, 500, 278, 556, 500, 722, 500, 500, 500, 334, 260, 334, 584];
const HELVB = [278, 333, 474, 556, 556, 889, 722, 238, 333, 333, 389, 584, 278, 333, 278, 278, 556, 556, 556, 556, 556, 556, 556, 556, 556, 556, 333, 333, 584, 584, 584, 611, 975, 722, 722, 722, 722, 667, 611, 778, 722, 278, 556, 722, 611, 833, 722, 778, 667, 778, 722, 667, 611, 722, 667, 944, 667, 667, 611, 333, 278, 333, 584, 556, 333, 556, 611, 556, 611, 556, 333, 611, 611, 278, 278, 556, 278, 889, 611, 611, 611, 611, 389, 556, 333, 611, 556, 778, 556, 556, 500, 389, 280, 389, 584];
// WinAnsi bytes above 127 that are not Latin-1, with their widths (regular and bold are equal for these).
const WIN = { '€': [0x80, 556], '‚': [0x82, 222], '„': [0x84, 333], '…': [0x85, 1000], '†': [0x86, 556], '‡': [0x87, 556], '‰': [0x89, 1000], '‘': [0x91, 222], '’': [0x92, 222], '“': [0x93, 333], '”': [0x94, 333], '•': [0x95, 350], '–': [0x96, 556], '—': [0x97, 1000], '™': [0x99, 1000] };
const LATIN1_W = { 0xa0: 278, 0xb0: 400, 0xb7: 278, 0xd7: 584, 0xb1: 584, 0xa3: 556, 0xa7: 556, 0xb2: 333, 0xb3: 333, 0xb9: 333, 0xbd: 834, 0xbc: 834, 0xbe: 834 };
// Characters outside WinAnsi: plain replacements.
const SUBST = { '≥': '>=', '≤': '<=', '≈': '~', '→': '->', '←': '<-', '↔': '<->', '−': '-', '✓': 'yes', '✗': 'x', '✔': 'yes', '✘': 'x', '≠': '!=', '∞': 'infinite', 'Δ': 'delta ', '…': '...', ' ': ' ', ' ': ' ', '‑': '-', '​': '' };
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
function charW(code, bold) {
  if (code >= 32 && code <= 126) return (bold ? HELVB : HELV)[code - 32];
  if (WIN_BY_BYTE[code]) return WIN_BY_BYTE[code];
  if (LATIN1_W[code]) return LATIN1_W[code];
  return code >= 0xc0 ? 667 : 556; // accented capitals and small letters: near enough for wrapping
}
// Width in points of an already-encoded WinAnsi string.
export function textWidth(enc, size, bold = false) {
  let w = 0;
  for (let i = 0; i < enc.length; i++) w += charW(enc.charCodeAt(i), bold);
  return (w * size) / 1000;
}
// Wrap text (any string) to a width; returns encoded lines. Long words are broken.
export function wrap(text, width, size, bold = false) {
  const lines = [];
  for (const para of String(text ?? '').split('\n')) {
    const words = toWinAnsi(para).split(' ');
    let line = '';
    for (let word of words) {
      const cand = line ? `${line} ${word}` : word;
      if (textWidth(cand, size, bold) <= width) { line = cand; continue; }
      if (line) lines.push(line);
      while (textWidth(word, size, bold) > width && word.length > 1) {
        let k = word.length - 1;
        while (k > 1 && textWidth(word.slice(0, k), size, bold) > width) k--;
        lines.push(word.slice(0, k));
        word = word.slice(k);
      }
      line = word;
    }
    lines.push(line);
  }
  return lines;
}
const esc = (enc) => enc.replace(/[\\()]/g, (m) => `\\${m}`);
const n2 = (x) => (Math.round(x * 100) / 100).toString();

// Colours as [r, g, b] in 0–1.
export const INK = [0.1, 0.1, 0.12], MUTED = [0.38, 0.38, 0.42], LINE = [0.78, 0.77, 0.73], ACCENT = [0.12, 0.36, 0.55], FLAG = [0.62, 0.16, 0.12], ZEBRA = [0.955, 0.95, 0.94];

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
  // Low-level drawing (PDF coordinates: origin bottom left).
  text(x, y, enc, size = 10, bold = false, color = INK) {
    this.ops.push(`BT ${color.map(n2).join(' ')} rg /${bold ? 'F2' : 'F1'} ${n2(size)} Tf ${n2(x)} ${n2(y)} Td (${esc(enc)}) Tj ET`);
  }
  // Like text(), for a plain JS string (encoded here).
  label(x, y, str, size = 10, bold = false, color = INK) { this.text(x, y, toWinAnsi(str), size, bold, color); }
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
  circle(cx, cy, r, { fill = null, stroke = null, lw = 0.5 } = {}) {
    const k = 0.5523 * r;
    const path = `${n2(cx + r)} ${n2(cy)} m ${n2(cx + r)} ${n2(cy + k)} ${n2(cx + k)} ${n2(cy + r)} ${n2(cx)} ${n2(cy + r)} c ${n2(cx - k)} ${n2(cy + r)} ${n2(cx - r)} ${n2(cy + k)} ${n2(cx - r)} ${n2(cy)} c ${n2(cx - r)} ${n2(cy - k)} ${n2(cx - k)} ${n2(cy - r)} ${n2(cx)} ${n2(cy - r)} c ${n2(cx + k)} ${n2(cy - r)} ${n2(cx + r)} ${n2(cy - k)} ${n2(cx + r)} ${n2(cy)} c`;
    const p = [];
    if (fill) p.push(`${fill.map(n2).join(' ')} rg`);
    if (stroke) p.push(`${stroke.map(n2).join(' ')} RG ${n2(lw)} w`);
    this.ops.push(`q ${p.join(' ')} ${path} ${fill && stroke ? 'B' : fill ? 'f' : 'S'} Q`);
  }
  // Flowing content.
  heading(t, level = 1) {
    const size = level === 1 ? 16 : level === 2 ? 12.5 : 10.5;
    const lines = wrap(t, this.width, size, true);
    const h = lines.length * size * 1.25 + (level === 1 ? 14 : 8);
    this.ensure(h + 40); // keep a heading with what follows
    this.y -= level === 1 ? 6 : 4;
    if (level <= 2) this.outline.push({ title: t, level, page: this.pages.length - 1, y: this.y + size });
    for (const l of lines) { this.y -= size * 1.25; this.text(this.m, this.y, l, size, true, level === 1 ? ACCENT : INK); }
    if (level === 1) { this.y -= 5; this.line(this.m, this.y, this.m + this.width, this.y, { color: ACCENT, lw: 1 }); }
    this.y -= level === 1 ? 8 : 4;
  }
  para(t, { size = 9.5, bold = false, color = INK, indent = 0, gap = 5 } = {}) {
    const lines = wrap(t, this.width - indent, size, bold);
    for (const l of lines) {
      this.ensure(size * 1.35);
      this.y -= size * 1.35;
      this.text(this.m + indent, this.y, l, size, bold, color);
    }
    this.y -= gap;
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
  space(h) { this.y -= h; }
  // Table: cols [{ label, w (fraction), align }]; rows: arrays of strings. Header repeats on a new page.
  table(cols, rows, { size = 8, headSize = 8, zebra = true, boldFirst = false } = {}) {
    const W = this.width;
    const tot = cols.reduce((a, c) => a + (c.w || 1), 0);
    const xs = [];
    let acc = this.m;
    for (const c of cols) { xs.push(acc); acc += ((c.w || 1) / tot) * W; }
    const ws = cols.map((c) => ((c.w || 1) / tot) * W);
    const pad = 3;
    const lh = size * 1.25;
    const header = () => {
      const hl = cols.map((c, i) => wrap(c.label, ws[i] - 2 * pad, headSize, true));
      const hh = Math.max(...hl.map((l) => l.length)) * headSize * 1.25 + 2 * pad;
      this.ensure(hh + lh + 2 * pad);
      this.rect(this.m, this.y - hh, W, hh, { fill: [0.9, 0.89, 0.86] });
      hl.forEach((ls, i) => ls.forEach((l, j) => {
        const tw = textWidth(l, headSize, true);
        const x = cols[i].align === 'right' ? xs[i] + ws[i] - pad - tw : xs[i] + pad;
        this.text(x, this.y - pad - (j + 1) * headSize * 1.25 + 2, l, headSize, true);
      }));
      this.y -= hh;
    };
    header();
    rows.forEach((row, ri) => {
      const cl = row.map((v, i) => wrap(v, ws[i] - 2 * pad, size, boldFirst && i === 0));
      const rh = Math.max(1, ...cl.map((l) => l.length)) * lh + 2 * pad;
      if (this.y - rh < this.m + 24) { this.newPage(); header(); }
      if (zebra && ri % 2 === 1) this.rect(this.m, this.y - rh, W, rh, { fill: ZEBRA });
      cl.forEach((ls, i) => ls.forEach((l, j) => {
        const bold = boldFirst && i === 0;
        const tw = textWidth(l, size, bold);
        const x = cols[i].align === 'right' ? xs[i] + ws[i] - pad - tw : xs[i] + pad;
        this.text(x, this.y - pad - (j + 1) * lh + 2, l, size, bold);
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
    const catalog = add(null), pagesObj = add(null), f1 = add('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>'), f2 = add('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>');
    const pageIds = [];
    this.pages.forEach((ops, i) => {
      const foot = [];
      const ft = toWinAnsi(`Page ${i + 1} of ${N}`);
      foot.push(`BT ${MUTED.map(n2).join(' ')} rg /F1 7.5 Tf ${n2(A4.w - this.m - textWidth(ft, 7.5))} ${n2(this.m - 22)} Td (${esc(ft)}) Tj ET`);
      if (footerEnc) {
        const fl = wrap(this.footer, this.width - 70, 7)[0];
        foot.push(`BT ${MUTED.map(n2).join(' ')} rg /F1 7 Tf ${n2(this.m)} ${n2(this.m - 22)} Td (${esc(fl)}) Tj ET`);
      }
      const content = [...ops, ...foot].join('\n');
      const cs = add(`<< /Length ${content.length} >>\nstream\n${content}\nendstream`);
      pageIds.push(add(`<< /Type /Page /Parent ${pagesObj} 0 R /MediaBox [0 0 ${A4.w} ${A4.h}] /Resources << /Font << /F1 ${f1} 0 R /F2 ${f2} 0 R >> >> /Contents ${cs} 0 R >>`));
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

// Text drawn on each page, decoded (for tests): the strings inside Tj operators, page by page.
export function pdfPageTexts(bytes) {
  let s = '';
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
  const pages = [];
  const re = /stream\n([\s\S]*?)\nendstream/g;
  let m;
  while ((m = re.exec(s))) {
    const strs = [];
    const tj = /\(((?:\\.|[^\\)])*)\) Tj/g;
    let t;
    while ((t = tj.exec(m[1]))) strs.push(t[1].replace(/\\(.)/g, '$1'));
    pages.push(strs.join('\n'));
  }
  return pages;
}
