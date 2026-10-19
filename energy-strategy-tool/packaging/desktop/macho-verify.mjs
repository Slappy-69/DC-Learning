// Independent check of an ad hoc code signature on a Mach-O file (thin or universal): finds LC_CODE_SIGNATURE, reads
// every CodeDirectory in the signature SuperBlob, recomputes each code page's hash from the file and compares it with
// the hash stored in the CodeDirectory. Used instead of `rcodesign verify`, which (version 0.29) reports
// "CMS error: missing further values" for every ad hoc signature, because ad hoc signatures carry no CMS blob.
//
// Covers: an ad hoc CodeDirectory exists and every code page's hash matches the file. Does not cover: the special slots
// (Info.plist, resources, requirements) or CodeDirectory fields outside the page hashes, such as the identifier.
//
// Usage: node desktop/macho-verify.mjs <file> [...]   (exit 1 if any file fails)
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const LC_CODE_SIGNATURE = 0x1d;
const CSMAGIC_EMBEDDED_SIGNATURE = 0xfade0cc0;
const CSMAGIC_CODEDIRECTORY = 0xfade0c02;
const CS_ADHOC = 0x2;
const HASH = { 1: ['sha1', 20], 2: ['sha256', 32], 3: ['sha256', 20], 4: ['sha384', 48] }; // 3 = sha256 truncated to 20 bytes

/** Slices of a universal (fat) file, or the whole buffer for a thin one. */
function slices(buf) {
  const m = buf.readUInt32BE(0);
  if (m === 0xcafebabe || m === 0xcafebabf) {
    const wide = m === 0xcafebabf;
    const n = buf.readUInt32BE(4);
    const out = [];
    for (let i = 0; i < n; i++) {
      const e = 8 + i * (wide ? 32 : 20);
      const off = wide ? Number(buf.readBigUInt64BE(e + 8)) : buf.readUInt32BE(e + 8);
      const size = wide ? Number(buf.readBigUInt64BE(e + 16)) : buf.readUInt32BE(e + 12);
      out.push(buf.subarray(off, off + size));
    }
    return out;
  }
  return [buf];
}

/** Verifies one thin Mach-O slice; returns a list of problems (empty when the signature matches the file). */
function verifySlice(b, label) {
  const magic = b.readUInt32LE(0);
  const is64 = magic === 0xfeedfacf;
  if (!is64 && magic !== 0xfeedface) return [`${label}: not a little-endian Mach-O (magic ${magic.toString(16)})`];
  const ncmds = b.readUInt32LE(16);
  let p = is64 ? 32 : 28;
  let sig = null;
  for (let i = 0; i < ncmds; i++) {
    const cmd = b.readUInt32LE(p);
    const size = b.readUInt32LE(p + 4);
    if (cmd === LC_CODE_SIGNATURE) sig = { off: b.readUInt32LE(p + 8), size: b.readUInt32LE(p + 12) };
    p += size;
  }
  if (!sig) return [`${label}: no code signature`];
  const sb = b.subarray(sig.off, sig.off + sig.size);
  if (sb.readUInt32BE(0) !== CSMAGIC_EMBEDDED_SIGNATURE) return [`${label}: signature is not an embedded-signature SuperBlob`];
  const count = sb.readUInt32BE(8);
  const problems = [];
  let directories = 0;
  for (let i = 0; i < count; i++) {
    const off = sb.readUInt32BE(12 + i * 8 + 4);
    const cd = sb.subarray(off);
    if (cd.readUInt32BE(0) !== CSMAGIC_CODEDIRECTORY) continue;
    directories++;
    const version = cd.readUInt32BE(8);
    const flags = cd.readUInt32BE(12);
    const hashOffset = cd.readUInt32BE(16);
    const nCodeSlots = cd.readUInt32BE(28);
    let codeLimit = cd.readUInt32BE(32);
    const hashSize = cd.readUInt8(36);
    const hashType = cd.readUInt8(37);
    const pageSize = 2 ** cd.readUInt8(39);
    if (version >= 0x20300) { const cl64 = Number(cd.readBigUInt64BE(56)); if (cl64) codeLimit = cl64; }
    const h = HASH[hashType];
    if (!h || h[1] !== hashSize) { problems.push(`${label}: unsupported hash type ${hashType}/${hashSize}`); continue; }
    if (!(flags & CS_ADHOC)) problems.push(`${label}: CodeDirectory is not ad hoc (flags ${flags.toString(16)})`);
    if (nCodeSlots !== Math.ceil(codeLimit / pageSize)) problems.push(`${label}: ${nCodeSlots} code slots for code limit ${codeLimit} (page ${pageSize})`);
    let bad = 0;
    for (let s = 0; s < nCodeSlots; s++) {
      const page = b.subarray(s * pageSize, Math.min((s + 1) * pageSize, codeLimit));
      const got = createHash(h[0]).update(page).digest().subarray(0, hashSize);
      if (!got.equals(cd.subarray(hashOffset + s * hashSize, hashOffset + (s + 1) * hashSize))) bad++;
    }
    if (bad) problems.push(`${label}: ${bad} of ${nCodeSlots} ${h[0]} page hashes do not match the file`);
  }
  if (!directories) problems.push(`${label}: no CodeDirectory in the signature`);
  return problems;
}

/** Problems for one file (all slices); empty array when every slice's signature matches. */
export function verifyAdhocMachO(file) {
  const buf = readFileSync(file);
  let parts;
  try { parts = slices(buf); } catch (e) { return [`malformed universal header (${e.message})`]; }
  return parts.flatMap((s, i) => {
    const label = parts.length > 1 ? `slice ${i}` : 'file';
    // A truncated or malformed signature makes the reads above run past the buffer: report it, do not crash.
    try { return verifySlice(s, label); } catch (e) { return [`${label}: malformed Mach-O or signature (${e.code || e.name}: ${e.message})`]; }
  });
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  let failed = 0;
  for (const f of process.argv.slice(2)) {
    const p = verifyAdhocMachO(f);
    if (p.length) failed++;
    console.log(`${p.length ? 'FAIL' : 'OK  '}  ${f}${p.length ? `\n      ${p.join('\n      ')}` : ''}`);
  }
  process.exit(failed ? 1 : 0);
}
