// The real view components bundled once with esbuild and rendered to static markup with react-dom/server (tests 8d,
// 8f, 8g, 8h, 9i, 12e, 13). Moved here from run-tests.mjs in the port slice so tests/port-tests.mjs can use it too.
// Bundle the real view components once with esbuild and render them to static markup with
// react-dom/server. The bundle has its own module instances, so it also exports its own registry:
// tests that change a view record to check the behaviour follows (8f) change the bundle's copy.
let viewBundle = null;
export async function getViewBundle() {
  if (viewBundle) return viewBundle;
  const esbuild = await import('esbuild');
  const { mkdtempSync, writeFileSync: wf, rmSync } = await import('node:fs');
  const { tmpdir } = await import('node:os');
  const { join } = await import('node:path');
  const { pathToFileURL, fileURLToPath } = await import('node:url');
  const root = fileURLToPath(new URL('..', import.meta.url));
  const dir = mkdtempSync(join(tmpdir(), 'pareto-test-'));
  try {
    const entry = join(dir, 'entry.jsx');
    const src = (f) => JSON.stringify(join(root, f));
    wf(entry, `import React from 'react'; import { renderToStaticMarkup } from 'react-dom/server.browser';
      import ParetoChart from ${src('src/components/ParetoChart.jsx')};
      import ParetoTable from ${src('src/components/ParetoTable.jsx')};
      import ParetoView from ${src('src/components/ParetoView.jsx')};
      export { getRegistry } from ${src('src/engine/defaults.js')};
      export function renderChart(model, width, forceSvg = true) {
        return renderToStaticMarkup(React.createElement(ParetoChart, { model, onSelect: () => {}, forceSvg, initialWidth: width }));
      }
      export function renderTable(model, pageSize = Infinity) {
        return renderToStaticMarkup(React.createElement(ParetoTable, { model, pageSize }));
      }
      export function renderView(run, view, siteBeta = false) {
        return renderToStaticMarkup(React.createElement(ParetoView, { run, view, setView: () => {}, start: '2027-01', siteBeta }));
      }
      import SiteView from ${src('src/components/SiteView.jsx')};
      import RunSummary from ${src('src/components/RunSummary.jsx')};
      import OptionDetail from ${src('src/components/OptionDetail.jsx')};
      export { blockRows } from ${src('src/components/site/BlocksTable.jsx')};
      export function renderSite(run, inputs, optionId = null) {
        return renderToStaticMarkup(React.createElement(SiteView, { run, inputs, update: () => {}, optionId, setOptionId: () => {}, computing: false }));
      }
      export function renderSummary(run, siteBeta = false) {
        return renderToStaticMarkup(React.createElement(RunSummary, { run, open: true, onToggle: () => {}, onInclude: () => {}, onSamplingOff: () => {}, siteBeta }));
      }
      export function renderOptionDetail(o, siteBeta = false) {
        return renderToStaticMarkup(React.createElement(OptionDetail, { o, start: '2027-01', onClose: () => {}, siteBeta }));
      }
      import { DispatchPanel } from ${src('src/components/DispatchView.jsx')};
      import { SensitivityResult } from ${src('src/components/SensitivityView.jsx')};
      export function renderSensitivity(result) {
        return renderToStaticMarkup(React.createElement(SensitivityResult, { result, ms: 0, chartWidth: 900 }));
      }
      export function renderDispatch(run, option, I, initialYear = null) {
        return renderToStaticMarkup(React.createElement(DispatchPanel, { run, option, I, ms: 0, chartWidth: 900, initialYear }));
      }`);
    const out = join(dir, 'bundle.mjs');
    await esbuild.build({ entryPoints: [entry], bundle: true, format: 'esm', platform: 'node', outfile: out, jsx: 'automatic', loader: { '.js': 'jsx' }, logLevel: 'silent', nodePaths: [join(root, 'node_modules')], define: { 'process.env.NODE_ENV': '"production"' } });
    viewBundle = await import(pathToFileURL(out).href);
    return viewBundle;
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}
