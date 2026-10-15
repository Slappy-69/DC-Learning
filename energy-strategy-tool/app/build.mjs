// Build: compiles JSX with esbuild into dist/ (app.js, worker.js, app.css, index.html).
import * as esbuild from 'esbuild';
import { copyFileSync, mkdirSync, statSync, readFileSync, writeFileSync } from 'node:fs';

mkdirSync('dist', { recursive: true });
const common = { bundle: true, minify: true, sourcemap: false, target: ['es2020'], logLevel: 'info', define: { 'process.env.NODE_ENV': '"production"' }, legalComments: 'none' };
await esbuild.build({ ...common, entryPoints: ['src/main.jsx'], outfile: 'dist/app.js', jsx: 'automatic', loader: { '.js': 'jsx' } });
await esbuild.build({ ...common, entryPoints: ['src/worker.js'], outfile: 'dist/worker.js', format: 'iife' });
await esbuild.build({ entryPoints: ['src/styles.css'], outfile: 'dist/app.css', bundle: true, minify: true, logLevel: 'info' });
copyFileSync('index.html', 'dist/index.html');
for (const f of ['app.js', 'worker.js', 'app.css', 'index.html']) console.log(`dist/${f}: ${(statSync(`dist/${f}`).size / 1024).toFixed(1)} KB`);

// Single-file build: index.html with app.css and app.js inlined (dist/energy-tool-single-file.html).
// The worker stays a separate file, so opened on its own this page uses the main-thread fallback
// (time-sliced, live progress panel kept). "</script" and "<!--" inside the bundle are escaped.
{
  const css = readFileSync('dist/app.css', 'utf8').replace(/<\/style/gi, '<\\/style');
  const js = readFileSync('dist/app.js', 'utf8').replace(/<\/script/gi, '<\\/script').replace(/<!--/g, '<\\!--');
  let html = readFileSync('index.html', 'utf8');
  html = html.replace('<link rel="stylesheet" href="app.css" />', () => `<style>${css}</style>`);
  html = html.replace('<script src="app.js"></script>', () => `<script>${js}</script>`);
  if (html.includes('href="app.css"') || html.includes('src="app.js"')) throw new Error('single-file inlining failed');
  writeFileSync('dist/energy-tool-single-file.html', html);
  console.log(`dist/energy-tool-single-file.html: ${(statSync('dist/energy-tool-single-file.html').size / 1024).toFixed(1)} KB`);
}
