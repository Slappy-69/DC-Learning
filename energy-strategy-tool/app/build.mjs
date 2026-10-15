// Build: compiles JSX with esbuild into dist/ (app.js, worker.js, app.css, index.html).
import * as esbuild from 'esbuild';
import { copyFileSync, mkdirSync, statSync } from 'node:fs';

mkdirSync('dist', { recursive: true });
const common = { bundle: true, minify: true, sourcemap: false, target: ['es2020'], logLevel: 'info', define: { 'process.env.NODE_ENV': '"production"' }, legalComments: 'none' };
await esbuild.build({ ...common, entryPoints: ['src/main.jsx'], outfile: 'dist/app.js', jsx: 'automatic', loader: { '.js': 'jsx' } });
await esbuild.build({ ...common, entryPoints: ['src/worker.js'], outfile: 'dist/worker.js', format: 'iife' });
await esbuild.build({ entryPoints: ['src/styles.css'], outfile: 'dist/app.css', bundle: true, minify: true, logLevel: 'info' });
copyFileSync('index.html', 'dist/index.html');
for (const f of ['app.js', 'worker.js', 'app.css', 'index.html']) console.log(`dist/${f}: ${(statSync(`dist/${f}`).size / 1024).toFixed(1)} KB`);
