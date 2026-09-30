"""End-to-end browser-local OCR and private account persistence checks."""
import json
import sys
import tempfile
import threading
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT));sys.path.insert(0,str(ROOT/'.test-tools'))
import server
from PIL import Image,ImageDraw,ImageFont
from playwright.sync_api import sync_playwright

out=ROOT/'test-results';out.mkdir(exist_ok=True)
image=Image.new('RGB',(950,1050),'white')
draw=ImageDraw.Draw(image)
font=ImageFont.truetype(r'C:\Windows\Fonts\arial.ttf',36)
text='Jollibee\nReceipt No. 00023918\n2026-09-30\n\nBurger Meal 2 100.00 200.00\n\nSubtotal 200.00\nVAT 24.00\nTotal 224.00\nGCash\n\nThank you!'
draw.multiline_text((65,60),text,font=font,fill='black',spacing=22)
image.save(out/'ocr-fixture.png')
with tempfile.TemporaryDirectory() as temp:
    server.DB_PATH=Path(temp)/'e2e.sqlite3';server.PORT=8082;server.PUBLIC_ORIGIN='http://localhost:8082';server.initialize()
    http=server.ThreadingHTTPServer(('127.0.0.1',8082),server.Handler)
    thread=threading.Thread(target=http.serve_forever,daemon=True);thread.start()
    try:
        with sync_playwright() as p:
            browser=p.chromium.launch(executable_path=r'C:\Program Files\Google\Chrome\Application\chrome.exe',headless=True)
            page=browser.new_page(viewport={'width':1440,'height':1050})
            errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
            page.goto(server.PUBLIC_ORIGIN,wait_until='networkidle')
            page.locator('.nav [data-page="profile"]').click()
            page.locator('[data-auth="signup"]').click()
            page.locator('[name="name"]').fill('Receipt Tester')
            page.locator('[name="email"]').fill('tester@example.com')
            page.locator('[name="password"]').fill('test-password-123456')
            page.locator('#auth-form button').click()
            page.get_by_role('heading',name='A little clarity, Receipt.').wait_for()
            assert page.locator('[data-receipt]').count()==0
            page.locator('.nav [data-page="scan"]').click()
            page.locator('#file-input').set_input_files(str(out/'ocr-fixture.png'))
            page.locator('#process-image').wait_for()
            page.locator('#process-image').click()
            page.locator('#receipt-form').wait_for(timeout=180000)
            assert page.locator('[name="merchant"]').input_value()=='Jollibee'
            assert float(page.locator('[name="total"]').input_value())==224
            assert page.locator('[name="category"]').input_value()=='Food & Dining'
            assert page.locator('[name="date"]').input_value()=='2026-09-30'
            page.screenshot(path=str(out/'scan-review-desktop.png'),full_page=True)
            page.locator('#receipt-form input[type="checkbox"]').check()
            page.get_by_role('button',name='Save Receipt',exact=True).click()
            page.locator('#receipt-form').wait_for(state='hidden')
            page.reload(wait_until='networkidle')
            page.locator('.nav [data-page="receipts"]').click()
            page.locator('[data-receipt]').wait_for()
            assert page.locator('[data-receipt]').count()==1
            page.locator('[data-receipt]').click()
            assert page.locator('.modal img').count()==1
            page.locator('#export-receipt').click()
            page.locator('[name="format"]').select_option('Excel / XLSX')
            with page.expect_download() as info: page.locator('#export-form button[type="submit"], #export-form button.primary').click()
            assert info.value.suggested_filename=='tally-expenses.xlsx'
            page.locator('.nav [data-page="profile"]').click()
            page.locator('#logout').click()
            page.locator('[data-auth="login"]').wait_for()
            assert not errors,errors
            print(json.dumps({'passed':['signup','empty private workspace','real browser OCR','Philippine receipt parsing','review-before-save','receipt image persistence','reload session','XLSX download','logout'],'browser_errors':errors},indent=2))
            browser.close()
    finally: http.shutdown();http.server_close();thread.join()
