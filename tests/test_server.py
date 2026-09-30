import http.cookiejar
import io
import json
import sqlite3
import sys
import tempfile
import threading
import unittest
import urllib.error
import urllib.request
import zipfile
from pathlib import Path
from xml.etree import ElementTree

sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
import server

class Client:
    def __init__(self,base):
        self.base=base;self.csrf=''
        self.opener=urllib.request.build_opener(urllib.request.HTTPCookieProcessor(http.cookiejar.CookieJar()))
    def request(self,path,method='GET',data=None,csrf=True,origin=None):
        headers={'Content-Type':'application/json'}
        if csrf: headers['X-CSRF-Token']=self.csrf
        if origin: headers['Origin']=origin
        req=urllib.request.Request(self.base+'/api'+path,data=json.dumps(data).encode() if data is not None else None,headers=headers,method=method)
        try: response=self.opener.open(req)
        except urllib.error.HTTPError as e: response=e
        raw=response.read()
        status,headers=response.status,response.headers
        response.close()
        return status,json.loads(raw) if headers['Content-Type'].startswith('application/json') else raw,headers
    def signup(self,email):
        status,body,headers=self.request('/signup','POST',{'name':'Test User','email':email,'password':'A-secure-password-2026'})
        assert status==200,body
        self.csrf=body['csrf'];return headers

class ServerTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.temp=tempfile.TemporaryDirectory()
        server.DB_PATH=Path(cls.temp.name)/'test.sqlite3'
        server.initialize()
        cls.http=server.ThreadingHTTPServer(('127.0.0.1',0),server.Handler)
        server.PORT=cls.http.server_address[1]
        server.PUBLIC_ORIGIN=f'http://127.0.0.1:{server.PORT}'
        cls.thread=threading.Thread(target=cls.http.serve_forever,daemon=True);cls.thread.start()
    @classmethod
    def tearDownClass(cls):
        cls.http.shutdown();cls.http.server_close()
    def setUp(self):
        with server.db() as conn:
            conn.execute('DELETE FROM users');conn.execute('DELETE FROM rate_limits')
        self.a=Client(server.PUBLIC_ORIGIN);self.b=Client(server.PUBLIC_ORIGIN)
        self.a.signup('a@example.com');self.b.signup('b@example.com')
    def receipt(self,**kw):
        r={'merchant':'Test store','date':'2026-09-30','category':'Food & Dining','currency':'PHP','payment_method':'Cash','total':120,'subtotal':100,'tax':20,'items':[{'name':'Lunch','quantity':2,'unit_price':50,'total':100}]}
        r.update(kw);return r
    def test_private_crud_and_export(self):
        code,result,_=self.a.request('/receipts','POST',self.receipt());self.assertEqual(code,200)
        rid=result['receipt']['id']
        self.assertEqual(len(self.a.request('/receipts')[1]['receipts']),1)
        self.assertEqual(self.b.request('/receipts')[1]['receipts'],[])
        self.assertEqual(self.b.request('/receipts/'+rid,'PUT',self.receipt())[0],404)
        self.assertEqual(self.b.request('/receipts/'+rid,'DELETE')[0],404)
        _,blob,_=self.a.request('/export','POST',{'ids':[rid]})
        with zipfile.ZipFile(io.BytesIO(blob)) as z:
            for name in z.namelist(): ElementTree.fromstring(z.read(name))
            self.assertIn(b'Test store',z.read('xl/worksheets/sheet1.xml'))
        _,blob,_=self.b.request('/export','POST',{'ids':[rid]})
        with zipfile.ZipFile(io.BytesIO(blob)) as z: self.assertNotIn(b'Test store',z.read('xl/worksheets/sheet1.xml'))
        self.assertEqual(self.a.request('/receipts/'+rid,'PUT',self.receipt(merchant='Updated'))[0],200)
        self.assertEqual(self.a.request('/receipts/'+rid,'DELETE')[0],200)
        with server.db() as conn: self.assertEqual(conn.execute('SELECT count(*) FROM receipt_items').fetchone()[0],0)
        self.assertEqual(self.a.request('/receipts')[1]['receipts'],[])
    def test_auth_and_csrf(self):
        self.assertEqual(Client(server.PUBLIC_ORIGIN).request('/receipts')[0],401)
        self.assertEqual(self.a.request('/receipts','POST',self.receipt(),csrf=False)[0],403)
        self.assertEqual(self.a.request('/receipts','POST',self.receipt(),origin='https://attacker.example')[0],403)
        self.assertEqual(self.a.request('/logout','POST',{})[0],200)
        self.assertEqual(self.a.request('/receipts')[0],401)
        code,body,_=self.a.request('/login','POST',{'email':'a@example.com','password':'wrong'});self.assertEqual(code,401)
        code,body,headers=self.a.request('/login','POST',{'email':'a@example.com','password':'A-secure-password-2026'});self.assertEqual(code,200)
        self.assertIn('HttpOnly',headers['Set-Cookie']);self.assertIn('SameSite=Strict',headers['Set-Cookie'])
    def test_validation(self):
        for kw in [{'total':-1},{'total':float('nan')},{'date':'2026-02-31'},{'category':'bad'},{'currency':'ZZZ'},{'total':999},{'items':[{'name':'Bad','quantity':0,'unit_price':5,'total':0}]}]:
            self.assertEqual(self.a.request('/receipts','POST',self.receipt(**kw))[0],400,kw)
        self.assertEqual(self.a.request('/receipts','POST',self.receipt(total=999,verified_mismatch=True))[0],200)
    def test_mask_and_image_rules(self):
        _,result,_=self.a.request('/receipts','POST',self.receipt(notes='Visa 4111 1111 1111 1111',payment_method='Credit Card',image='bad'))
        self.assertNotIn('4111',result['receipt']['notes']);self.assertIn('1111',result['receipt']['notes']);self.assertIsNone(result['receipt']['image'])
        self.assertEqual(self.a.request('/receipts','POST',self.receipt(image='data:image/jpeg;base64,YmFk',card_checked=True))[0],400)
    def test_corrections_are_per_user(self):
        self.a.request('/receipts','POST',self.receipt(category='Business'))
        data={'receipt':{'merchant':'Test store','category':'Other'}}
        self.assertEqual(self.a.request('/classify','POST',data)[1]['category'],'Business')
        self.assertEqual(self.b.request('/classify','POST',data)[1]['category'],'Other')
    def test_password_change(self):
        code,body,_=self.a.request('/change-password','POST',{'current_password':'wrong','password':'new-password-12345'});self.assertEqual(code,400)
        self.assertEqual(self.a.request('/change-password','POST',{'current_password':'A-secure-password-2026','password':'new-password-12345'})[0],200)
        self.assertEqual(Client(server.PUBLIC_ORIGIN).request('/login','POST',{'email':'a@example.com','password':'new-password-12345'})[0],200)
    def test_no_private_files(self):
        for path in ['/server.py','/data/tally.sqlite3','/../server.py']:
            try: urllib.request.urlopen(server.PUBLIC_ORIGIN+path)
            except urllib.error.HTTPError as e:
                self.assertEqual(e.code,404)
                e.close()
            else: self.fail('Private file exposed')

    def test_reset_token_is_single_use_and_revokes_sessions(self):
        with server.db() as conn:
            uid=conn.execute('SELECT id FROM users WHERE email=?',('a@example.com',)).fetchone()[0]
            conn.execute('INSERT INTO reset_tokens VALUES(?,?,?)',(server.digest('test-reset-token'),uid,server.time.time()+60))
        data={'token':'test-reset-token','password':'replacement-password-123'}
        self.assertEqual(self.a.request('/reset-password','POST',data)[0],200)
        self.assertEqual(self.a.request('/receipts')[0],401)
        self.assertEqual(self.a.request('/reset-password','POST',data)[0],400)
        self.assertEqual(self.a.request('/login','POST',{'email':'a@example.com','password':data['password']})[0],200)

if __name__=='__main__': unittest.main()
