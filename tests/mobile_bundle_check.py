"""Check the bundled mobile UI/OCR and native bridge calls with a browser test adapter.

This verifies JavaScript integration, not a physical device's camera or native cookie jar.
"""
import json
import sys
import threading
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/'.test-tools'))
from playwright.sync_api import sync_playwright
from PIL import Image,ImageDraw,ImageFont

out=ROOT/'test-results';out.mkdir(exist_ok=True)
fixture=Image.new('RGB',(900,900),'white')
ImageDraw.Draw(fixture).multiline_text((60,60),'Jollibee\nReceipt No. 00023918\n2026-09-30\n\nBurger Meal 2 100.00 200.00\nSubtotal 200.00\nVAT 24.00\nTotal 224.00\nGCash',font=ImageFont.truetype(r'C:\Windows\Fonts\arial.ttf',36),fill='black',spacing=22)
fixture.save(out/'mobile-ocr-fixture.png')
class QuietHandler(SimpleHTTPRequestHandler):
    def log_message(self,*args): pass
http=ThreadingHTTPServer(('127.0.0.1',8093),partial(QuietHandler,directory=str(ROOT/'mobile/www')))
thread=threading.Thread(target=http.serve_forever,daemon=True);thread.start()
try:
    with sync_playwright() as p:
        browser=p.chromium.launch(executable_path=r'C:\Program Files\Google\Chrome\Application\chrome.exe',headless=True)
        page=browser.new_page(viewport={'width':390,'height':844})
        errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
        page.on('console',lambda message: print('Browser:',message.text,flush=True) if message.type=='error' else None)
        page.add_init_script('''
          window.nativeCalls = [];
          window.androidBridge = {};
          window.Capacitor = {
            getPlatform: () => 'android',
            isNativePlatform: () => true,
            PluginHeaders: ['App','Camera','Filesystem','Share','CapacitorHttp'].map(name => ({name,methods:['addListener','removeListener','rmdir','writeFile','share','request','getPhoto'].map(name => ({name,rtype:'promise'}))})),
            nativePromise: async (plugin, method, options) => {
              window.nativeCalls.push({plugin,method,options});
              if (method === 'writeFile') { window.lastExport = options; return {uri:'file:///cache/export'}; }
              if (method === 'share') return {};
              if (method === 'getPhoto') throw Error('User cancelled photos app');
              return {};
            },
            nativeCallback: () => 'test-listener'
          };
        ''')
        page.goto('http://localhost:8093',wait_until='networkidle')
        print('Mobile bundle loaded',flush=True)
        assert page.evaluate('TallyNative.isNative')
        assert page.evaluate('document.documentElement.scrollWidth <= innerWidth')
        page.locator('.nav [data-page="scan"]').click()
        page.locator('#camera-receipt').click()
        assert page.evaluate("nativeCalls.some(c=>c.plugin==='Camera' && c.method==='getPhoto')")
        page.locator('#file-input').set_input_files(str(out/'mobile-ocr-fixture.png'))
        page.locator('#process-image').click()
        print('Reading bundled OCR fixture',flush=True)
        page.locator('#receipt-form').wait_for(timeout=90000)
        print('OCR review opened',flush=True)
        assert page.locator('[name="merchant"]').input_value()=='Jollibee'
        assert float(page.locator('[name="total"]').input_value())==224
        page.screenshot(path=str(out/'mobile-native-review.png'),full_page=True)
        page.locator('#receipt-form input[type="checkbox"]').check()
        page.get_by_role('button',name='Save Receipt',exact=True).click()
        page.locator('#receipt-form').wait_for(state='hidden')
        awaitable="""async () => {
          await TallyNative.shareXlsx([{date:'2026-09-30',merchant:'Store & Co.',category:'Food & Dining',receipt_number:'001',payment_method:'Cash',currency:'PHP',total:120}]);
          return window.lastExport.data;
        }"""
        xlsx=page.evaluate(awaitable)
        import base64,io,zipfile
        from xml.etree import ElementTree
        with zipfile.ZipFile(io.BytesIO(base64.b64decode(xlsx))) as z:
            for name in z.namelist(): ElementTree.fromstring(z.read(name))
            assert b'Store &amp; Co.' in z.read('xl/worksheets/sheet1.xml')
        page.evaluate("async () => { await TallyNative.sharePdf([{date:'2026-09-30',merchant:'Jollibee',category:'Food & Dining',payment_method:'Cash',currency:'PHP',total:120}]); }")
        assert base64.b64decode(page.evaluate('window.lastExport.data')).startswith(b'%PDF')
        page.locator('.nav [data-page="profile"]').click()
        page.locator('[data-auth="login"]').click()
        page.locator('[name="email"]').fill('preview@example.com')
        page.locator('[name="password"]').fill('does-not-save')
        page.locator('#auth-form button').click()
        assert 'preview' in page.locator('#auth-error').inner_text()
        assert not errors,errors
        print(json.dumps({'passed':['native bridge camera dispatch','bundled on-device OCR','mobile overflow','editable scan review','native XLSX XML','native PDF','preview cannot connect an unconfigured backend'],'browser_errors':errors},indent=2))
        browser.close()
finally:
    http.shutdown();http.server_close();thread.join()
