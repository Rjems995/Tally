"""Regression coverage for receipt filters, account loading, and scan navigation."""
import sys
import tempfile
import threading
import runpy
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
sys.path.insert(0, str(ROOT / '.test-tools'))
import server
from playwright.sync_api import sync_playwright

with tempfile.TemporaryDirectory() as temp:
    server.DB_PATH = Path(temp) / 'regressions.sqlite3'
    server.PORT = 8080
    server.PUBLIC_ORIGIN = 'http://localhost:8080'
    server.initialize()
    http = server.ThreadingHTTPServer(('127.0.0.1', 8080), server.Handler)
    threading.Thread(target=http.serve_forever, daemon=True).start()
    try:
        runpy.run_path(str(ROOT / 'tests/browser_check.py'))
        with sync_playwright() as p:
            browser = p.chromium.launch(executable_path=r'C:\Program Files\Google\Chrome\Application\chrome.exe', headless=True)
            page = browser.new_page(timezone_id='Pacific/Kiritimati')
            errors = []
            page.on('pageerror', lambda e: errors.append(str(e)))
            page.goto(server.PUBLIC_ORIGIN, wait_until='networkidle')
            assert page.evaluate('''() => {
                state.receipts = [
                    {...seed[0], id:'usd', currency:'USD', date:'2026-09-30'},
                    {...seed[0], id:'php', currency:'PHP', date:'2026-09-24'},
                    {...seed[0], id:'old', currency:'PHP', date:'2026-09-23'}
                ];
                state.range = 'This Week';
                return filteredReceipts().map(r => r.id).join(',') === 'usd,php';
            }''')
            assert page.evaluate('''() => {
                state.receipts = [{...seed[0], total:0}];
                return !dashboard().includes('NaN');
            }''')
            page.route('**/api/session', lambda route: route.fulfill(json={'user':{'id':'private','name':'Private','email':'private@example.com'},'csrf':'test'}))
            page.route('**/api/receipts', lambda route: route.fulfill(status=503,json={'error':'Unavailable'}))
            page.reload(wait_until='networkidle')
            assert page.evaluate('!state.demo && state.receipts.length === 0')
            assert 'Could not load' in page.locator('#toast').inner_text()
            page.unroute('**/api/session')
            page.unroute('**/api/receipts')
            page.reload(wait_until='networkidle')
            page.evaluate('''() => {
                navigate('scan');
                const stage = document.createElement('div'); stage.id='image-stage';
                const canvas = document.createElement('canvas'); canvas.id='receipt-canvas';
                stage.append(canvas); document.querySelector('#app').append(stage);
                window.loadScript = async () => {};
                window.Tesseract = {createWorker: async () => ({
                    recognize: () => new Promise(resolve => {window.finishScan = () => resolve({data:{text:'Test store\\nTotal 20.00',confidence:90}})}),
                    terminate: async () => {}
                })};
                window.scanTask = processImage();
            }''')
            page.wait_for_function('Boolean(window.finishScan)')
            page.evaluate("navigate('dashboard'); finishScan()")
            page.evaluate('window.scanTask')
            assert page.locator('.modal').count() == 0
            assert page.evaluate('!state.processing')
            # Editing amounts invalidates earlier acknowledgments, and corrected totals save.
            page.evaluate("editReceipt({...seed[0], id:undefined, total:20, subtotal:10, tax:0, items:[]})")
            page.get_by_role('button', name='Save Receipt', exact=True).click()
            page.locator('#ack-math').check()
            page.locator('[name=total]').fill('30')
            assert page.locator('#ack-math').count() == 0
            page.get_by_role('button', name='Save Receipt', exact=True).click()
            assert not page.locator('#ack-math').is_checked()
            page.locator('[name=total]').fill('10')
            page.get_by_role('button', name='Save Receipt', exact=True).click()
            assert page.locator('#receipt-form').count() == 0
            # A rejected request after closing its dialog must not dereference removed elements.
            page.evaluate("""() => {
                window.api = () => new Promise((resolve, reject) => { window.rejectRequest = reject; });
                authDialog('login');
            }""")
            page.locator('[name=email]').fill('test@example.com')
            page.locator('[name=password]').fill('example-password')
            page.get_by_role('button', name='Log in', exact=True).click()
            page.wait_for_function('Boolean(window.rejectRequest)')
            page.evaluate("closeModal(); rejectRequest(Error('Connection lost'))")
            page.wait_for_function("document.querySelector('#toast').textContent === 'Connection lost'")
            # Reset revokes server sessions; clear private client state before showing login.
            page.route('**/api/session', lambda route: route.fulfill(json={'user':{'id':'private','name':'Private','email':'private@example.com'},'csrf':'test'}))
            page.route('**/api/receipts', lambda route: route.fulfill(json={'receipts':[]}))
            page.route('**/api/reset-password', lambda route: route.fulfill(json={'ok':True}))
            page.goto(server.PUBLIC_ORIGIN + '/?reset=test-token', wait_until='networkidle')
            page.locator('#reset-form [name=password]').fill('replacement-password')
            page.get_by_role('button', name='Reset password', exact=True).click()
            page.wait_for_selector('#auth-form')
            assert page.evaluate('state.user === null && state.demo && state.csrf === ""')
            assert not errors, errors
            browser.close()
        print('Browser regressions passed')
    finally:
        http.shutdown()
        http.server_close()
