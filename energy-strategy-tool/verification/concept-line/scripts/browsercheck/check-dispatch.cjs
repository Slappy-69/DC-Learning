const { chromium } = require('playwright');
(async () => {
  const file = 'file:///tmp/claude-0/-home-claude/3ded6fb1-dffa-5614-ab8f-4144dc966e9a/scratchpad/dc-learning/energy-strategy-tool/app/dist/energy-tool-single-file.html';
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox'] });
  for (const [label, vp, scheme] of [['desktop-light', { width: 1366, height: 900 }, 'light'], ['phone-dark', { width: 390, height: 844 }, 'dark']]) {
    const ctx = await browser.newContext({ viewport: vp, colorScheme: scheme });
    const page = await ctx.newPage();
    const errors = [];
    page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
    page.on('pageerror', (e) => errors.push('PAGEERROR ' + e.message));
    await page.goto(file);
    await page.waitForSelector('#tab-dispatch', { timeout: 180000 });
    await page.click('#tab-dispatch');
    await page.waitForSelector('.dv .sc-svg', { timeout: 60000 });
    const info = await page.evaluate(() => {
      const svgs = [...document.querySelectorAll('.dv .sc-svg')];
      const bands = svgs.map((s) => s.querySelectorAll('.sc-band').length);
      const strips = svgs.map((s) => s.querySelectorAll('.sc-strip').length);
      const facts = (document.querySelector('.dv-facts') || {}).textContent || '';
      const note = [...document.querySelectorAll('.dv-note')].map((n) => n.textContent).join(' | ');
      const pressed = [...document.querySelectorAll('.dv .chip-btn[aria-pressed=true]')].map((b) => b.textContent);
      const notes = [...document.querySelectorAll('.dv .sens-notes li')].map((l) => l.textContent);
      const totals = [...document.querySelectorAll('.dv-total td')].map((t) => t.textContent);
      return { svgs: svgs.length, bands, strips, facts, note, pressed, notes, totals, overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth };
    });
    const ov0 = info.overflow;
    console.log(`\n[${label}] charts ${info.svgs}; bands per chart ${JSON.stringify(info.bands)}; strip runs ${JSON.stringify(info.strips)}; overflow ${info.overflow}px`);
    console.log(`  facts: ${info.facts}`);
    console.log(`  year/week: ${info.note}`);
    console.log(`  pressed: ${info.pressed.join(' · ')}`);
    console.log(`  totals: ${info.totals.join(' / ')}`);
    console.log(`  notes: ${info.notes.slice(0, 2).join(' || ')}`);
    // Keyboard readout on the hourly chart: focus it, press Right twice, read the tooltip.
    const wraps = await page.$$('.dv .sc-wrap');
    if (wraps[1]) {
      await wraps[1].focus();
      await page.keyboard.press('ArrowRight');
      await page.keyboard.press('ArrowRight');
      const tip = await page.evaluate(() => { const t = document.querySelectorAll('.dv .sc-tip'); return t.length ? t[0].innerText.replace(/\n+/g, ' | ') : 'none'; });
      console.log(`  keyboard readout: ${tip.slice(0, 260)}`);
      const live = await page.evaluate(() => [...document.querySelectorAll('.dv .sc-wrap .sr-only')].map((e) => e.textContent).find((t) => t) || '');
      console.log(`  live region: ${live.slice(0, 120)}`);
    }
    // Pointer hover on the timeline chart.
    const tlSvg = await page.$('.dv .sc-svg');
    await page.keyboard.press('Escape');
    await tlSvg.scrollIntoViewIfNeeded();
    const box = await tlSvg.boundingBox();
    await page.mouse.move(box.x + box.width * 0.3, box.y + box.height * 0.6);
    const tip2 = await page.evaluate(() => { const t = document.querySelector('.dv .sc-wrap .sc-tip'); const w = document.querySelector('.dv .sc-wrap'); return t && w.contains(t) ? t.innerText.replace(/\n+/g, ' | ') : 'none'; });
    console.log(`  hover readout (timeline): ${tip2.slice(0, 200)}`);
    if (label === 'desktop-light') {
      // Week box: clear and type 24, then 52 (8-day week).
      const wk = await page.$('#dv-week');
      await wk.click({ clickCount: 3 });
      await page.keyboard.press('Backspace');
      const afterClear = await page.$eval('#dv-week', (e) => e.value);
      await page.keyboard.type('24');
      await page.keyboard.press('Enter');
      const w24 = await page.evaluate(() => ({ v: document.getElementById('dv-week').value, ticks: [...document.querySelectorAll('.dv .sc-svg')][1].querySelectorAll('.sc-tick').length }));
      await wk.click({ clickCount: 3 });
      await page.keyboard.type('52');
      await page.keyboard.press('Enter');
      const w52 = await page.evaluate(() => { const svg = [...document.querySelectorAll('.dv .sc-svg')][1]; const days = [...svg.querySelectorAll('.sc-tick')].map((t) => t.textContent).filter((t) => t.startsWith('Day')); return { v: document.getElementById('dv-week').value, days }; });
      console.log(`  week box: after clearing "${afterClear}", typed 24 -> "${w24.v}"; typed 52 -> "${w52.v}", day ticks ${w52.days.join(', ')}`);
      await page.mouse.move(5, 5);
      const sec = await page.$('.dv');
      await sec.screenshot({ path: __dirname + '/dispatch-desktop.png' });
    }
    console.log(`  console errors: ${errors.length ? errors.slice(0, 3).join(' | ') : 'none'}`);
    await ctx.close();
  }
  await browser.close();
})().catch((e) => { console.error('FAILED', e.message); process.exit(1); });
