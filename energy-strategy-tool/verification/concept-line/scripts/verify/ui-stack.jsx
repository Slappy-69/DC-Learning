import React from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react-dom/test-utils';
import StackChart from '/tmp/claude-0/-home-claude/3ded6fb1-dffa-5614-ab8f-4144dc966e9a/scratchpad/dc-learning/energy-strategy-tool/app/src/components/StackChart.jsx';

export async function main(window) {
  const document = window.document;
  Object.defineProperty(window.Element.prototype, 'clientWidth', { configurable: true, get() { return 360; } });
  const container = document.getElementById('root');
  const root = createRoot(container);
  const pos = [
    { key: 'a', label: 'A', color: 'red', values: new Float64Array([1, 2, 0, 3]) },
    { key: 'b', label: 'B', color: 'blue', values: new Float64Array([1, 1, 1, 1]) },
  ];
  const neg = [{ key: 'c', label: 'C', color: 'green', values: new Float64Array([2, 0, 1, 0]) }];
  const line = { label: 'L', values: new Float64Array([2, 3, 1, 4]) };
  act(() => { root.render(<StackChart n={4} pos={pos} neg={neg} line={line} height={100} unit="MW" readout={(i) => ({ title: `i${i}`, rows: [{ label: 'x', text: String(i) }] })} ariaLabel="test" />); });
  const paths = Array.from(container.querySelectorAll('path.sc-band'));
  const line_ = container.querySelector('path.sc-line');
  // Expected geometry (hand-derived): ticks -2..4 step 2, y(v)=6+(1-(v+2)/6)*100, x(i)=46+i/4*304
  const y = (v) => 6 + (1 - (v + 2) / 6) * 100;
  const x = (i) => 46 + (i / 4) * 304;
  const f1 = (v) => (Math.round(v * 10) / 10).toString();
  const band = (base, top) => {
    let d = `M${f1(x(0))},${f1(y(top[0]))}H${f1(x(1))}`;
    for (let i = 1; i < 4; i++) d += `V${f1(y(top[i]))}H${f1(x(i + 1))}`;
    for (let i = 3; i >= 0; i--) d += `V${f1(y(base[i]))}H${f1(x(i))}`;
    return d + 'Z';
  };
  const expA = band([0, 0, 0, 0], [1, 2, 0, 3]);
  const expB = band([1, 2, 0, 3], [2, 3, 1, 4]);
  const expC = band([0, 0, 0, 0], [-2, 0, -1, 0]);
  const got = paths.map((p) => p.getAttribute('d'));
  const res = [];
  res.push(`fills: ${paths.map((p) => p.getAttribute('fill')).join(',')}`);
  res.push(`A ${got[0] === expA ? 'matches' : 'DIFFERS'}`);
  res.push(`B ${got[1] === expB ? 'matches' : 'DIFFERS'}`);
  res.push(`C ${got[2] === expC ? 'matches' : 'DIFFERS'}`);
  if (got[0] !== expA) res.push(`  got A ${got[0]}\n  exp A ${expA}`);
  if (got[1] !== expB) res.push(`  got B ${got[1]}\n  exp B ${expB}`);
  if (got[2] !== expC) res.push(`  got C ${got[2]}\n  exp C ${expC}`);
  // line: M x0,y(2) H x1 V y(3) H x2 V y(1) H x3 V y(4) H x4
  const expL = `M${f1(x(0))},${f1(y(2))}H${f1(x(1))}V${f1(y(3))}H${f1(x(2))}V${f1(y(1))}H${f1(x(3))}V${f1(y(4))}H${f1(x(4))}`;
  res.push(`line ${line_ && line_.getAttribute('d') === expL ? 'matches' : 'DIFFERS ' + (line_ && line_.getAttribute('d'))}`);
  // tick labels and zero line
  const ticks = Array.from(container.querySelectorAll('text.sc-tick')).map((t) => t.textContent);
  res.push(`ticks ${ticks.join(' ')} (expect -2 0 2 4)`);
  // hover readout mapping: overlay at x(2) center -> index 2
  const ov = container.querySelector('rect[fill="transparent"]');
  act(() => { ov.dispatchEvent(new window.MouseEvent('pointermove', { clientX: x(2) + 1, clientY: 30, bubbles: true })); });
  res.push(`hover at x(2)+1 -> ${container.querySelector('.sc-tip-title') ? container.querySelector('.sc-tip-title').textContent : 'none'}`);
  act(() => { ov.dispatchEvent(new window.MouseEvent('pointermove', { clientX: x(4) - 0.2, clientY: 30, bubbles: true })); });
  res.push(`hover at x(4)-0.2 -> ${container.querySelector('.sc-tip-title') ? container.querySelector('.sc-tip-title').textContent : 'none'}`);
  // Keyboard: Shift+Right with n=4 steps by round(4/12)=0 -> max(1,0)=1
  root.unmount();
  console.log(res.join('\n'));
}
