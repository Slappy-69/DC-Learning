// Build: compiles JSX with esbuild into dist/ (app.js, worker.js, app.css, index.html),
// plus dist/energy-tool-single-file.html (CSS, JS and worker inlined).
import * as esbuild from 'esbuild';
import { copyFileSync, mkdirSync, statSync, readFileSync, writeFileSync } from 'node:fs';

mkdirSync('dist', { recursive: true });
const common = { bundle: true, minify: true, sourcemap: false, target: ['es2020'], logLevel: 'info', define: { 'process.env.NODE_ENV': '"production"' }, legalComments: 'none' };
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
{
  const workerSrc = readFileSync('dist/worker.js', 'utf8');
  const single = await esbuild.build({
    ...common, logLevel: 'warning', entryPoints: ['src/main.jsx'], write: false, outfile: 'dist/app-single.js', jsx: 'automatic', loader: { '.js': 'jsx' },
    define: { ...common.define, __INLINE_WORKER_SRC__: JSON.stringify(workerSrc) },
  });
  const appSingle = single.outputFiles[0].text;
  const css = readFileSync('dist/app.css', 'utf8').replace(/<\/style/gi, '<\\/style');
  const js = appSingle.replace(/<\/script/gi, '<\\/script').replace(/<!--/g, '<\\!--');
  let html = readFileSync('index.html', 'utf8');
  html = html.replace('<link rel="stylesheet" href="app.css" />', () => `<style>${css}</style>`);
  html = html.replace('<script src="app.js"></script>', () => `<script>${js}</script>`);
  if (html.includes('href="app.css"') || html.includes('src="app.js"')) throw new Error('single-file inlining failed');
  if (/["'`]worker\.js["'`]/.test(html)) throw new Error('single-file build still references worker.js');
  writeFileSync('dist/energy-tool-single-file.html', html);
  console.log(`dist/energy-tool-single-file.html: ${(statSync('dist/energy-tool-single-file.html').size / 1024).toFixed(1)} KB (worker inlined, ${(workerSrc.length / 1024).toFixed(1)} KB)`);
}
