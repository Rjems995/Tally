"""Run with Playwright installed, while server.py is running on port 8080."""
import json
import sys
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/'.test-tools'))
from playwright.sync_api import sync_playwright

out=ROOT/'test-results';out.mkdir(exist_ok=True)
with sync_playwright() as p:
    browser=p.chromium.launch(executable_path=r'C:\Program Files\Google\Chrome\Application\chrome.exe',headless=True)
    page=browser.new_page(viewport={'width':1440,'height':1100},device_scale_factor=1)
    errors=[]
    page.on('pageerror',lambda e: errors.append(str(e)))
    page.goto('http://localhost:8080',wait_until='networkidle')
    page.screenshot(path=str(out/'dashboard-desktop.png'),full_page=True)
    assert page.locator('h1').inner_text().startswith('A little clarity')
    page.locator('[data-action="add"]').first.click()
    page.locator('[name="merchant"]').fill('Browser Test Merchant')
    page.locator('[name="total"]').fill('321.50')
    page.get_by_role('button',name='Save Receipt',exact=True).click()
    page.locator('.nav [data-page="receipts"]').click()
    page.locator('#receipt-search').fill('Browser Test Merchant')
    assert page.locator('[data-receipt]').count()==1
    page.locator('[data-receipt]').click()
    page.locator('#edit-receipt').click()
    page.locator('[name="total"]').fill('400')
    page.get_by_role('button',name='Save changes',exact=True).click()
    assert '400.00' in page.locator('#receipt-results').inner_text()
    page.locator('[data-receipt]').click()
    page.locator('#delete-receipt').click()
    page.locator('#confirm-delete').click()
    assert page.locator('[data-receipt]').count()==0
    page.locator('.nav [data-page="analytics"]').click()
    page.locator('#chart-mode').select_option('Month')
    page.locator('#analytics-currency').select_option('USD')
    assert '$0.00' in page.locator('.stats').inner_text()
    page.locator('.nav [data-page="dashboard"]').click()
    page.locator('[data-period="today"]').click()
    page.locator('#theme').click()
    assert page.locator('body').evaluate('(el)=>el.classList.contains("dark")')
    page.screenshot(path=str(out/'dashboard-dark.png'),full_page=True)
    page.locator('#theme').click()
    page.locator('.nav [data-page="profile"]').click()
    page.locator('#profile-currency').select_option('PHP')
    page.locator('.nav [data-page="dashboard"]').click()
    page.locator('[data-period="month"]').click()
    page.set_viewport_size({'width':390,'height':844})
    page.screenshot(path=str(out/'dashboard-mobile.png'),full_page=True)
    assert page.evaluate('document.documentElement.scrollWidth<=window.innerWidth')
    page.locator('.nav [data-page="scan"]').click()
    page.screenshot(path=str(out/'scan-mobile.png'),full_page=True)
    parsed=page.evaluate('''() => parseReceipt(`Jollibee\nReceipt No. 00023918\n2026-09-30\nBurger Meal 2 100.00 200.00\nSubtotal 200.00\nVAT 24.00\nTotal 224.00\nGCash`,95)''')
    assert parsed['merchant']=='Jollibee',parsed
    assert parsed['total']==224 and parsed['category']=='Food & Dining',parsed
    assert parsed['items'][0]['quantity']==2,parsed
    assert page.evaluate('maskCards("Visa 4111 1111 1111 1111")')=='Visa •••• 1111'
    assert not errors,errors
    print(json.dumps({'browser_errors':errors,'checks':'dashboard, demo CRUD, search, analytics grouping, currencies, theme, mobile overflow, scanner, receipt parser','screenshots':str(out)},indent=2))
    browser.close()
