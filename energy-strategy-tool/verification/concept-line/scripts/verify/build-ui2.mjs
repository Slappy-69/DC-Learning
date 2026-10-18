import { createRequire } from 'node:module';
const req = createRequire('/tmp/claude-0/-home-claude/3ded6fb1-dffa-5614-ab8f-4144dc966e9a/scratchpad/dc-learning/energy-strategy-tool/app/package.json');
const esbuild = req('esbuild');
await esbuild.build({ entryPoints: ['ui-stack.jsx'], bundle: true, platform: 'node', format: 'esm', jsx: 'automatic', outfile: 'ui-stack-bundle.mjs', nodePaths: ['/tmp/claude-0/-home-claude/3ded6fb1-dffa-5614-ab8f-4144dc966e9a/scratchpad/dc-learning/energy-strategy-tool/app/node_modules'], define: { 'process.env.NODE_ENV': '"development"' }, logLevel: 'warning' });
console.log('bundle ok');
