#!/usr/bin/env python3
"""Audit browser pass (2026-11-14): runs T1 in the built page once and saves the text of every screen for the
leader, the islanded option #3346 and the step-down SMR card #3708, the tornado axis, the breakevens and the PDF
the app saves. Run from /home/claude/fable-audit:  python3 -I scripts/browser.py"""
import json, time, pathlib
from playwright.sync_api import sync_playwright

URL = 'file:///home/claude/dc-learning/energy-strategy-tool/energy-tool-single-file.html'
OUT = pathlib.Path('/home/claude/fable-audit/out/browser'); OUT.mkdir(parents=True, exist_ok=True)
log = []
def note(*a):
    s = ' '.join(str(x) for x in a); print(s, flush=True); log.append(s)
def save(name, text): (OUT / f'{name}.txt').write_text(text)

with sync_playwright() as p:
    b = p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
    pg = b.new_page(viewport={'width': 1440, 'height': 1000}, accept_downloads=True)
    t0 = time.time()
    pg.goto(URL)
    pg.wait_for_selector('.top5-card', timeout=240000)
    pg.wait_for_function("() => !document.body.innerText.includes('Screening options')", timeout=240000)
    time.sleep(2)
    note('run done in', round(time.time() - t0, 1), 's')
    save('01_options', pg.inner_text('body'))
    pg.screenshot(path=str(OUT / 'options.png'), full_page=False)
    # The options table (first page)
    tbl = pg.locator('table').filter(has_text='LCOE').first
    save('02_table_header_rows', tbl.inner_text() if tbl.count() else 'no table')
    # Leader's detail from its card
    pg.locator('.top5-card .tc-name').first.click(); time.sleep(1.5)
    save('03_leader_detail', pg.inner_text('body'))
    # Compare: tick the leader's card and the step-down card (last card)
    cards = pg.locator('.top5-card')
    note('cards', cards.count())
    cards.nth(0).locator('input[type=checkbox]').check()
    cards.nth(cards.count() - 1).locator('input[type=checkbox]').check()
    # The islanded option: search, open its row, add to compare
    pg.fill('input[type=search]', 'Islanded gas recips · retained-plant backup · PV 6.7 MWp'); time.sleep(1.5)
    rows = pg.locator('tr').filter(has_text='#3346')
    note('island rows', rows.count())
    if rows.count():
        save('04_island_row', rows.first.inner_text())
        rows.first.locator('button.row-btn').first.click(); time.sleep(1.5)
        save('05_island_detail', pg.inner_text('body'))
        add = pg.get_by_role('button', name='Add to compare')
        if add.count(): add.first.click(); time.sleep(0.5)
    # The SMR step-down card's detail
    pg.fill('input[type=search]', 'Grid · SMR · HVO N+1'); time.sleep(1.5)
    r = pg.locator('tr').filter(has_text='#3708')
    if r.count():
        save('06_smr_row', r.first.inner_text())
        r.first.locator('button.row-btn').first.click(); time.sleep(1.5)
        save('07_smr_detail', pg.inner_text('body'))
    pg.fill('input[type=search]', ''); time.sleep(1)
    # Compare tab
    pg.click('#tab-compare'); time.sleep(1.5)
    save('08_compare', pg.inner_text('body'))
    # Trade-offs tab
    pg.click('#tab-tradeoffs'); time.sleep(2)
    save('09_tradeoffs', pg.inner_text('body'))
    # Dispatch tab (the leader)
    pg.click('#tab-dispatch'); time.sleep(4)
    save('10_dispatch', pg.inner_text('body'))
    # Sensitivity: tornado (default seven drivers, LCOE), then breakevens
    pg.click('#tab-sensitivity'); time.sleep(1)
    pg.click('button.sens-run')
    pg.wait_for_function("() => /Done: \\d+ drivers/.test(document.body.innerText)", timeout=180000); time.sleep(1)
    ticks = pg.eval_on_selector_all('.tor-svg text.tor-tick', 'els => els.map(e => e.textContent)')
    note('tornado axis texts', json.dumps(ticks, ensure_ascii=False))
    pg.locator('#tornado-chart').screenshot(path=str(OUT / 'tornado.png'))
    pg.click('button.be-run')
    pg.wait_for_function("() => /flips? found/.test(document.body.innerText)", timeout=300000); time.sleep(1)
    save('11_sensitivity', pg.inner_text('body'))
    # The PDF the app saves (with the compared options, the tornado and the breakevens)
    with pg.expect_download(timeout=180000) as dl:
        pg.click('#save-pdf')
    dl.value.save_as(str(OUT / 'report_app.pdf'))
    time.sleep(1)
    save('12_after_pdf', pg.inner_text('header') if pg.locator('header').count() else '')
    note('total', round(time.time() - t0, 1), 's')
    (OUT / 'log.txt').write_text('\n'.join(log))
    b.close()
