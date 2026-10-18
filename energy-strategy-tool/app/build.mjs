// Build: compiles JSX with esbuild into dist/ (app.js, worker.js, app.css, index.html),
// plus dist/energy-tool-single-file.html (CSS, JS and worker inlined) and dist/energy-tool-hosted.html (the same app
// as page content for a host that adds the document: <title>, <style> and the body content only).
import * as esbuild from 'esbuild';
import { copyFileSync, mkdirSync, statSync, readFileSync, writeFileSync } from 'node:fs';

mkdirSync('dist', { recursive: true });
// __HOSTED__ (port slice): false in the normal and single-file builds; true in the hosted page, where the run-log
// download (ignored by a host's frame) is replaced by copy-to-clipboard and the download code is dropped.
const common = { bundle: true, minify: true, sourcemap: false, target: ['es2020'], logLevel: 'info', define: { 'process.env.NODE_ENV': '"production"', __HOSTED__: 'false' }, legalComments: 'none' };
await esbuild.build({ ...common, entryPoints: ['src/main.jsx'], outfile: 'dist/app.js', jsx: 'automatic', loader: { '.js': 'jsx' }, define: { ...common.define, __INLINE_WORKER_SRC__: 'null' } });
await esbuild.build({ ...common, entryPoints: ['src/worker.js'], outfile: 'dist/worker.js', format: 'iife' });
await esbuild.build({ entryPoints: ['src/styles.css'], outfile: 'dist/app.css', bundle: true, minify: true, logLevel: 'info' });
copyFileSync('index.html', 'dist/index.html');
for (const f of ['app.js', 'worker.js', 'app.css', 'index.html']) console.log(`dist/${f}: ${(statSync(`dist/${f}`).size / 1024).toFixed(1)} KB`);

// Single-file build: index.html with app.css and app.js inlined (dist/energy-tool-single-file.html).
// The worker is inlined too: dist/worker.js is passed into a second app bundle as the string
// __INLINE_WORKER_SRC__, and useCompute creates the workers from a Blob URL, so the single file
// loads no other file. If workers still fail (synchronously or asynchronously) the app uses the
// main-thread fallback (time-sliced, live progress panel kept) and says so in the status line.
// "</script" and "<!--" inside the bundle are escaped. The normal build above keeps worker.js.
// index.html carries a loading message inside #root (replaced when the app mounts; it stays, with instructions, if
// the viewer never runs scripts) and a small inline startup-error handler, so the page is never blank.
{
  const workerSrc = readFileSync('dist/worker.js', 'utf8');
  const css = readFileSync('dist/app.css', 'utf8').replace(/<\/style/gi, '<\\/style');
  const inline = (bundle) => {
    const js = bundle.replace(/<\/script/gi, '<\\/script').replace(/<!--/g, '<\\!--');
    let html = readFileSync('index.html', 'utf8');
    html = html.replace('<link rel="stylesheet" href="app.css" />', () => `<style>${css}</style>`);
    html = html.replace('<script src="app.js"></script>', () => `<script>${js}</script>`);
    if (html.includes('href="app.css"') || html.includes('src="app.js"')) throw new Error('single-file inlining failed');
    if (/["'`]worker\.js["'`]/.test(html)) throw new Error('single-file build still references worker.js');
    return html;
  };
  const bundleWith = async (hosted) => (await esbuild.build({
    ...common, logLevel: 'warning', entryPoints: ['src/main.jsx'], write: false, outfile: hosted ? 'dist/app-hosted.js' : 'dist/app-single.js', jsx: 'automatic', loader: { '.js': 'jsx' },
    define: { ...common.define, __INLINE_WORKER_SRC__: JSON.stringify(workerSrc), __HOSTED__: hosted ? 'true' : 'false' },
  })).outputFiles[0].text;

  writeFileSync('dist/energy-tool-single-file.html', inline(await bundleWith(false)));
  console.log(`dist/energy-tool-single-file.html: ${(statSync('dist/energy-tool-single-file.html').size / 1024).toFixed(1)} KB (worker inlined, ${(workerSrc.length / 1024).toFixed(1)} KB)`);

  // Hosted page (dist/energy-tool-hosted.html): the same app for publishing as a hosted page. The host wraps it in its
  // own document, so only <title>, <style> and the body content are kept (no doctype, <html>, <head> or <body>).
  const full = inline(await bundleWith(true));
  const title = full.match(/<title>[\s\S]*?<\/title>/)[0];
  const style = full.match(/<style>[\s\S]*?<\/style>/)[0];
  const body = full.match(/<body>([\s\S]*)<\/body>/)[1].trim();
  const hostedHtml = `${title}\n${style}\n${body}\n`;
  if (/<!doctype|<html[\s>]|<head[\s>]|<body[\s>]/i.test(hostedHtml.replace(/<script>[\s\S]*?<\/script>/g, ''))) throw new Error('hosted page still carries document tags');
  writeFileSync('dist/energy-tool-hosted.html', hostedHtml);
  console.log(`dist/energy-tool-hosted.html: ${(statSync('dist/energy-tool-hosted.html').size / 1024).toFixed(1)} KB (page content for the host's document; run log copied, not downloaded)`);
}
