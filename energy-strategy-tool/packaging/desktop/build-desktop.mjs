// Builds the desktop program with @electron/packager, one platform at a time, from the single-file web app build.
//
// Usage: node desktop/build-desktop.mjs [--input <energy-tool-single-file.html>] [--platforms linux-x64,win32-x64,darwin-x64,darwin-arm64]
//                                       [--electron <version>] [--version <x.y.z>] [--keep-unpacked] [--no-sign]
// Per platform: package (asar) -> flip Electron fuses -> (macOS) ad-hoc sign with rcodesign -> archive -> delete the
// unpacked folder and the downloaded Electron zip (disk). Output in out/desktop/:
//   Concept-Energy-Optioneering-<version>-linux-x64.tar.gz      (folder with the executable concept-energy-optioneering)
//   Concept-Energy-Optioneering-<version>-win32-x64.zip         (folder with "Concept Energy Optioneering.exe")
//   Concept-Energy-Optioneering-<version>-darwin-x64.zip        (folder with "Concept Energy Optioneering.app"; zip -y)
//   Concept-Energy-Optioneering-<version>-darwin-arm64.zip      (same, Apple silicon)
//   SHA256SUMS.txt, build-desktop.json (versions, fuses, signing, sizes), icons/ (icon.ico, icon.icns, icon.png)
import { execFileSync } from 'node:child_process';
import { copyFileSync, createWriteStream, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { packager } from '@electron/packager';
import { flipFuses } from '@electron/fuses';
import { FUSES, readFuses } from './fuses.mjs';
import { verifyAdhocMachO } from './macho-verify.mjs';
import { APP_ID, APP_NAME, DEFAULT_SINGLE_FILE, PACKAGING_ROOT, args, sha256 } from '../lib/common.mjs';
import { CONFIG, stage } from './stage.mjs';

const a = args();
const ALL = ['linux-x64', 'win32-x64', 'darwin-x64', 'darwin-arm64'];
const PLATFORMS = a.platforms ? String(a.platforms).split(',') : ALL;
for (const p of PLATFORMS) if (!ALL.includes(p)) throw new Error(`unknown platform ${p} (choose from ${ALL.join(', ')})`);
const ELECTRON = a.electron || CONFIG.electronVersion;
const OUT = join(PACKAGING_ROOT, 'out', 'desktop');
const WORK = join(PACKAGING_ROOT, 'out', '.work');
const CACHE = join(PACKAGING_ROOT, 'out', '.electron-cache');
const TOOLS = join(PACKAGING_ROOT, 'out', '.tools');
const RCODESIGN_VERSION = '0.29.0';
const RCODESIGN_SHA256 = 'dbe85cedd8ee4217b64e9a0e4c2aef92ab8bcaaa41f20bde99781ff02e600002';

/**
 * Downloads the Electron zip for one platform into the packager's cache, in a child process, up to 3 attempts.
 * undici (inside @electron/get) can throw an uncaught assertion from a socket event when a connection drops mid-download
 * (seen through an HTTPS proxy), which kills the whole process; a child process contains it, so a retry is possible.
 */
function ensureElectronZip(platform, arch) {
  const script = `import('@electron/get').then(({ downloadArtifact }) => downloadArtifact({ version: ${JSON.stringify(ELECTRON)}, platform: ${JSON.stringify(platform)}, arch: ${JSON.stringify(arch)}, artifactName: 'electron', cacheRoot: ${JSON.stringify(CACHE)} })).then((p) => console.log(p)).catch((e) => { console.error(e && e.message || e); process.exit(1); });`;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      execFileSync(process.execPath, ['--input-type=module', '-e', script], { cwd: PACKAGING_ROOT, stdio: ['ignore', 'pipe', 'pipe'], timeout: 15 * 60 * 1000 });
      return;
    } catch (e) {
      const why = String(e.stderr || e.message).split('\n').find((l) => l.trim()) || 'unknown error';
      console.warn(`Electron ${ELECTRON} ${platform}-${arch} download attempt ${attempt} of 3 failed: ${why}`);
      if (attempt === 3) throw new Error(`Electron download failed 3 times for ${platform}-${arch}`);
    }
  }
}

const run = (cmd, argv, opts = {}) => execFileSync(cmd, argv, { stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 64 * 1024 * 1024, ...opts }).toString();
const mb = (n) => `${(n / 1048576).toFixed(1)} MB`;
const duMB = (p) => Number(run('du', ['-sm', p]).split(/\s+/)[0]);

async function ensureRcodesign() {
  const exe = join(TOOLS, 'rcodesign', 'rcodesign');
  if (existsSync(exe)) return exe;
  const dl = join(TOOLS, 'dl');
  mkdirSync(dl, { recursive: true });
  const tgz = join(dl, `apple-codesign-${RCODESIGN_VERSION}.tar.gz`);
  const url = `https://github.com/indygreg/apple-platform-rs/releases/download/apple-codesign%2F${RCODESIGN_VERSION}/apple-codesign-${RCODESIGN_VERSION}-x86_64-unknown-linux-musl.tar.gz`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`rcodesign download failed: ${res.status} ${url}`);
  const buf = Buffer.from(await res.arrayBuffer());
  if (sha256(buf) !== RCODESIGN_SHA256) throw new Error('rcodesign download: checksum mismatch');
  writeFileSync(tgz, buf);
  mkdirSync(join(TOOLS, 'rcodesign'), { recursive: true });
  run('tar', ['-xzf', tgz, '-C', join(TOOLS, 'rcodesign'), '--strip-components=1']);
  return exe;
}

/** Every Mach-O file inside a bundle (by magic number), for signature verification. */
function machOFiles(dir) {
  const out = [];
  const MAGIC = new Set(['feedface', 'feedfacf', 'cefaedfe', 'cffaedfe', 'cafebabe', 'bebafeca']);
  const walk = (d) => {
    for (const e of readdirSync(d, { withFileTypes: true })) {
      const p = join(d, e.name);
      if (e.isSymbolicLink()) continue;
      if (e.isDirectory()) { walk(p); continue; }
      if (!e.isFile() || statSync(p).size < 4096) continue;
      const fd = readFileSync(p, { flag: 'r' }).subarray(0, 4).toString('hex');
      if (MAGIC.has(fd)) out.push(p);
    }
  };
  walk(dir);
  return out;
}

/** Windows: does the exe carry an Authenticode certificate table (it would no longer match after editing)? */
function peHasCertificate(exe) {
  const b = readFileSync(exe);
  const pe = b.readUInt32LE(0x3c);
  const magic = b.readUInt16LE(pe + 24);
  const dd = pe + 24 + (magic === 0x20b ? 112 : 96);
  return b.readUInt32LE(dd + 4 * 8 + 4) > 0; // data directory 4 (security): size
}

const s = stage({ input: a.input || DEFAULT_SINGLE_FILE, out: join(PACKAGING_ROOT, 'out', '.stage'), version: a.version });
console.log(`Staged ${APP_NAME} ${s.version} (numeric ${s.numeric}); Electron ${ELECTRON}; platforms ${PLATFORMS.join(', ')}`);
mkdirSync(OUT, { recursive: true });
mkdirSync(join(OUT, 'icons'), { recursive: true });
for (const f of ['icon.ico', 'icon.icns', 'icon.png']) copyFileSync(join(s.resources, f), join(OUT, 'icons', f));
const reportFile = join(OUT, 'build-desktop.json');
const report = existsSync(reportFile) ? JSON.parse(readFileSync(reportFile, 'utf8')) : {};
report.app = APP_NAME; report.version = s.version; report.electron = ELECTRON; report.webSha256 = s.info.webSha256; report.csp = s.csp;
report.targets = report.targets || {};

for (const target of PLATFORMS) {
  const [platform, arch] = target.split('-');
  const t0 = Date.now();
  rmSync(WORK, { recursive: true, force: true });
  mkdirSync(WORK, { recursive: true });
  ensureElectronZip(platform, arch); // packager then finds the zip in CACHE and does not download
  const [dir] = await packager({
    dir: s.app,
    out: WORK,
    platform,
    arch,
    electronVersion: ELECTRON,
    name: APP_NAME,
    executableName: platform === 'linux' ? CONFIG.linuxExecutableName : APP_NAME,
    appVersion: s.numeric,
    buildVersion: platform === 'win32' ? `${s.numeric}.0` : s.numeric,
    appBundleId: APP_ID,
    appCategoryType: CONFIG.macCategory,
    icon: platform === 'win32' ? join(s.resources, 'icon.ico') : platform === 'darwin' ? join(s.resources, 'icon.icns') : undefined,
    win32metadata: { FileDescription: APP_NAME, ProductName: APP_NAME, InternalName: CONFIG.packageName, OriginalFilename: `${APP_NAME}.exe` },
    asar: true,
    prune: false,
    overwrite: true,
    junk: true,
    quiet: true,
    download: { cacheRoot: CACHE },
  });
  const info = { archive: null, bytes: 0, unpackedMB: duMB(dir), fuses: null, signing: 'none', notes: [] };
  const binary = platform === 'linux' ? join(dir, CONFIG.linuxExecutableName) : platform === 'win32' ? join(dir, `${APP_NAME}.exe`) : join(dir, `${APP_NAME}.app`);
  if (!existsSync(binary)) throw new Error(`packaged binary not found: ${binary}`);

  await flipFuses(binary, FUSES);
  info.fuses = await readFuses(binary);

  if (platform === 'win32') {
    info.notes.push(peHasCertificate(binary) ? 'exe still carries a certificate table (signature no longer valid after editing)' : 'exe unsigned (no certificate table); icon and version info embedded with resedit');
  }
  if (platform === 'darwin') {
    if (a['no-sign']) {
      info.signing = 'none (--no-sign): the edited bundle keeps a broken Electron signature; macOS reports it as damaged until the quarantine flag is removed';
    } else {
      const rc = await ensureRcodesign();
      run(rc, ['sign', binary]);
      const files = machOFiles(binary);
      const bad = [];
      // `rcodesign verify` (0.29) rejects every ad hoc signature ("CMS error: missing further values": ad hoc signatures
      // have no CMS blob), so each file is checked by macho-verify.mjs: ad hoc CodeDirectory, every page hash matches.
      for (const f of files) { const p = verifyAdhocMachO(f); if (p.length) bad.push(`${f.slice(binary.length)}: ${p.join('; ')}`); }
      if (bad.length) throw new Error(`ad hoc signature check failed for ${bad.length} of ${files.length} Mach-O files:\n${bad.join('\n')}`);
      // Self-check of the checker on every build: copies of the main executable with one byte flipped (in the Mach-O
      // header page, and a third of the way in) and with the signature's blob count corrupted must all fail.
      const mainExe = join(binary, 'Contents', 'MacOS', APP_NAME);
      const orig = readFileSync(mainExe);
      const sigOff = (() => { const n = orig.readUInt32LE(16); let p = orig.readUInt32LE(0) === 0xfeedfacf ? 32 : 28; for (let i = 0; i < n; i++) { if (orig.readUInt32LE(p) === 0x1d) return orig.readUInt32LE(p + 8); p += orig.readUInt32LE(p + 4); } return 0; })();
      const probes = [['header byte', 100], ['code byte', Math.floor(sigOff / 3)], ['signature blob count', sigOff + 8]];
      for (const [what, at] of probes) {
        const copy = Buffer.from(orig);
        if (what === 'signature blob count') copy.writeUInt32BE(0xffff, at); else copy[at] ^= 0xff;
        const tmp = join(WORK, 'macho-selfcheck.bin');
        writeFileSync(tmp, copy);
        const p = verifyAdhocMachO(tmp);
        rmSync(tmp, { force: true });
        if (!p.length) throw new Error(`macho-verify self-check: a copy with a changed ${what} (offset ${at}) passed`);
      }
      info.signing = `ad hoc (rcodesign ${RCODESIGN_VERSION}); ${files.length} Mach-O files: CodeDirectory ad hoc, every page hash matches the file; checker self-check: 3 of 3 altered copies rejected`;
    }
  }

  const base = `Concept-Energy-Optioneering-${s.version}-${target}`;
  const folder = dir.split('/').pop();
  run('chmod', ['755', dir]); // the packager's temporary folder is created 700; others may need to read an /opt install
  let archive;
  if (platform === 'linux') {
    archive = join(OUT, `${base}.tar.gz`);
    rmSync(archive, { force: true });
    run('tar', ['--owner=0', '--group=0', '--numeric-owner', '-czf', archive, '-C', WORK, folder]);
  } else {
    archive = join(OUT, `${base}.zip`);
    rmSync(archive, { force: true });
    // -y stores symbolic links as links (the macOS frameworks need them); -X leaves out extra file attributes.
    run('zip', ['-q', '-r', '-X', ...(platform === 'darwin' ? ['-y'] : []), archive, folder], { cwd: WORK });
  }
  info.archive = archive.split('/').pop();
  info.bytes = statSync(archive).size;
  info.sha256 = sha256(readFileSync(archive));
  info.seconds = Math.round((Date.now() - t0) / 1000);
  report.targets[target] = info;
  console.log(`${target}: ${info.archive} ${mb(info.bytes)} (unpacked ${info.unpackedMB} MB), fuses ${JSON.stringify(info.fuses)}, signing: ${info.signing}${info.notes.length ? `; ${info.notes.join('; ')}` : ''}`);

  if (!a['keep-unpacked']) rmSync(WORK, { recursive: true, force: true });
  rmSync(CACHE, { recursive: true, force: true }); // the Electron zip for this platform (~100 MB)
}

// Checksums for every archive present (other platforms may come from an earlier run of this script).
const sums = readdirSync(OUT).filter((f) => /\.(zip|tar\.gz)$/.test(f)).sort().map((f) => `${sha256(readFileSync(join(OUT, f)))}  ${f}`);
writeFileSync(join(OUT, 'SHA256SUMS.txt'), `${sums.join('\n')}\n`);
writeFileSync(reportFile, `${JSON.stringify(report, null, 2)}\n`);
console.log(`Done. ${OUT}\n${sums.join('\n')}`);
