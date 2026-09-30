"""Tally: a local-first, dependency-free receipt application. Python 3.10+."""
import base64
import hashlib
import hmac
import io
import json
import math
import os
import re
import secrets
import smtplib
import sqlite3
import ssl
import time
import uuid
import zipfile
from datetime import date
from contextlib import contextmanager
from email.message import EmailMessage
from http import cookies
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlparse
from xml.sax.saxutils import escape

ROOT = Path(__file__).resolve().parent
DB_PATH = Path(os.environ.get('TALLY_DB', ROOT / 'data' / 'tally.sqlite3'))
HOST = os.environ.get('TALLY_HOST', '127.0.0.1')
PORT = int(os.environ.get('TALLY_PORT', '8080'))
PUBLIC_ORIGIN = os.environ.get('TALLY_ORIGIN', f'http://localhost:{PORT}')
SECURE = PUBLIC_ORIGIN.startswith('https://')
CATEGORIES = ['Food & Dining','Groceries','Transportation','Shopping','Electronics','Utilities','Entertainment','Healthcare','Education','Travel','Fuel','Household','Personal Care','Business','Subscriptions','Other']
PAYMENTS = ['Cash','Credit Card','Debit Card','GCash','Maya','Bank Transfer','Other']
CURRENCIES = ['PHP','USD','EUR','GBP','JPY','SGD','AUD','CAD']
CARD = re.compile(r'\b(?:\d[ -]?){13,19}\b')
TEXT_FIELDS = ['merchant','branch','address','phone','email','website','receipt_number','invoice_number','transaction_id','reference_number','order_number','terminal','cashier','time','tin','notes']
MONEY_FIELDS = ['total','subtotal','tax','discount','service_charge','other_charges','amount_paid','change','vatable_sales','vat_exempt','zero_rated']

@contextmanager
def db():
    conn = sqlite3.connect(DB_PATH, timeout=15)
    conn.row_factory = sqlite3.Row
    conn.execute('PRAGMA foreign_keys = ON')
    try:
        with conn:
            yield conn
    finally:
        conn.close()

def initialize():
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    with db() as conn:
        conn.executescript('''
        PRAGMA journal_mode=WAL;
        CREATE TABLE IF NOT EXISTS users(id TEXT PRIMARY KEY,name TEXT NOT NULL,email TEXT UNIQUE NOT NULL,password_hash TEXT NOT NULL,created_at REAL NOT NULL);
        CREATE TABLE IF NOT EXISTS sessions(token_hash TEXT PRIMARY KEY,user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,csrf TEXT NOT NULL,expires REAL NOT NULL);
        CREATE TABLE IF NOT EXISTS receipts(id TEXT PRIMARY KEY,user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,merchant_name TEXT NOT NULL,date TEXT NOT NULL,category TEXT NOT NULL,total REAL NOT NULL,data TEXT NOT NULL,created_at REAL NOT NULL);
        CREATE INDEX IF NOT EXISTS receipts_owner_date ON receipts(user_id,date);
        CREATE TABLE IF NOT EXISTS receipt_items(id INTEGER PRIMARY KEY,receipt_id TEXT NOT NULL REFERENCES receipts(id) ON DELETE CASCADE,item_name TEXT NOT NULL,product_code TEXT,quantity REAL NOT NULL,unit_price REAL NOT NULL,total_price REAL NOT NULL,discount REAL NOT NULL DEFAULT 0);
        CREATE TABLE IF NOT EXISTS categories(name TEXT PRIMARY KEY);
        CREATE TABLE IF NOT EXISTS category_corrections(user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,merchant TEXT NOT NULL,category TEXT NOT NULL,PRIMARY KEY(user_id,merchant));
        CREATE TABLE IF NOT EXISTS reset_tokens(token_hash TEXT PRIMARY KEY,user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,expires REAL NOT NULL);
        CREATE TABLE IF NOT EXISTS rate_limits(key TEXT PRIMARY KEY,count INTEGER NOT NULL,expires REAL NOT NULL);
        ''')
        conn.executemany('INSERT OR IGNORE INTO categories(name) VALUES(?)', [(c,) for c in CATEGORIES])

def digest(s): return hashlib.sha256(s.encode()).hexdigest()

def password_hash(password, salt=None):
    salt = salt or secrets.token_hex(16)
    derived = hashlib.pbkdf2_hmac('sha256', password.encode(), bytes.fromhex(salt), 600000).hex()
    return salt + ':' + derived

def check_password(password, stored):
    return hmac.compare_digest(password_hash(password, stored.split(':')[0]), stored)

def mask_cards(value):
    return CARD.sub(lambda m: '•••• ' + re.sub(r'\D', '', m.group())[-4:], str(value))

class APIError(Exception):
    def __init__(self, message, status=400): self.message, self.status = message, status

def require_password(value):
    if not isinstance(value, str) or not 12 <= len(value) <= 256:
        raise APIError('Use a password between 12 and 256 characters.')

def amount(value, required=False):
    if value is None and not required: return None
    if isinstance(value, bool) or not isinstance(value, (int, float)) or not math.isfinite(value) or not 0 <= value <= 100000000:
        raise APIError('Amounts must be finite, non-negative numbers below 100,000,000.')
    return round(value, 2)

def clean_image(value, checked):
    if not value: return None
    if not checked: raise APIError('The receipt image must be checked for payment card details before saving.')
    if not isinstance(value,str) or not value.startswith('data:image/jpeg;base64,'):
        raise APIError('Only processed JPEG receipt images can be stored.')
    try: raw = base64.b64decode(value.split(',',1)[1], validate=True)
    except ValueError: raise APIError('Invalid receipt image.')
    if len(raw)>8*1024*1024 or not raw.startswith(b'\xff\xd8\xff') or not raw.endswith(b'\xff\xd9'):
        raise APIError('Invalid or oversized receipt image.')
    return value

def validate_receipt(data):
    if not isinstance(data,dict): raise APIError('Invalid receipt.')
    r={k:mask_cards(data.get(k) or '')[:4000 if k=='notes' else 300] for k in TEXT_FIELDS}
    r['merchant']=r['merchant'].strip()
    if not r['merchant']: raise APIError('Enter a merchant name.')
    try: r['date']=date.fromisoformat(str(data.get('date',''))).isoformat()
    except ValueError: raise APIError('Enter a valid receipt date.')
    for key,allowed,default in [('category',CATEGORIES,'Other'),('payment_method',PAYMENTS,'Other'),('currency',CURRENCIES,'PHP')]:
        r[key]=data.get(key,default)
        if r[key] not in allowed: raise APIError(f'Invalid {key.replace("_"," ")}.')
    for key in MONEY_FIELDS: r[key]=amount(data.get(key),key=='total')
    items=data.get('items',[])
    if not isinstance(items,list) or len(items)>300: raise APIError('A receipt may contain up to 300 items.')
    r['items']=[]
    for item in items:
        if not isinstance(item,dict): raise APIError('Invalid receipt item.')
        name=mask_cards(item.get('name','')).strip()[:200]
        if not name: raise APIError('Every item needs a name.')
        qty=amount(item.get('quantity'),True)
        if qty<=0: raise APIError('Item quantity must be greater than zero.')
        r['items'].append({'name':name,'product_code':mask_cards(item.get('product_code',''))[:100],'quantity':qty,'unit_price':amount(item.get('unit_price'),True),'total':amount(item.get('total'),True),'discount':amount(item.get('discount',0),True)})
    issues=[]
    if any(abs(i['quantity']*i['unit_price']-i['discount']-i['total'])>.021 for i in r['items']): issues.append('Item arithmetic needs review.')
    if r['subtotal'] is not None:
        if r['items'] and abs(sum(i['total'] for i in r['items'])-r['subtotal'])>.021: issues.append('Item totals differ from subtotal.')
        expected=r['subtotal']+(r['tax'] or 0)+(r['service_charge'] or 0)+(r['other_charges'] or 0)-(r['discount'] or 0)
        if abs(expected-r['total'])>.021: issues.append('Payment breakdown differs from total.')
    if issues and data.get('verified_mismatch') is not True: raise APIError(' '.join(issues)+' Review and acknowledge the mismatch before saving.')
    r['verified_mismatch']=bool(issues)
    r['card_checked']=data.get('card_checked') is True
    # Card transactions never retain an image, even when OCR failed to detect the PAN.
    r['image']=None if 'Card' in r['payment_method'] else clean_image(data.get('image'),r['card_checked'])
    r['original_image']=None if 'Card' in r['payment_method'] else clean_image(data.get('original_image'),r['card_checked'])
    return r

def make_xlsx(receipts):
    rows=[['Date','Merchant','Category','Receipt No.','Payment Method','Currency','Amount']]
    rows += [[r['date'],r['merchant'],r['category'],r.get('receipt_number',''),r['payment_method'],r['currency'],r['total']] for r in receipts]
    xml=['<?xml version="1.0" encoding="UTF-8"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>']
    for idx,row in enumerate(rows,1):
        xml.append(f'<row r="{idx}">')
        for col,v in enumerate(row):
            ref=f'{chr(65+col)}{idx}'
            if isinstance(v,(int,float)): xml.append(f'<c r="{ref}"><v>{v}</v></c>')
            else:
                safe=re.sub(r'[\x00-\x08\x0b\x0c\x0e-\x1f]','',str(v))
                xml.append(f'<c r="{ref}" t="inlineStr"><is><t xml:space="preserve">{escape(safe)}</t></is></c>')
        xml.append('</row>')
    xml.append('</sheetData></worksheet>')
    out=io.BytesIO()
    with zipfile.ZipFile(out,'w',zipfile.ZIP_DEFLATED) as z:
        z.writestr('[Content_Types].xml','<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/></Types>')
        z.writestr('_rels/.rels','<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>')
        z.writestr('xl/workbook.xml','<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Expenses" sheetId="1" r:id="rId1"/></sheets></workbook>')
        z.writestr('xl/_rels/workbook.xml.rels','<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/></Relationships>')
        z.writestr('xl/worksheets/sheet1.xml',''.join(xml))
    return out.getvalue()

class Handler(BaseHTTPRequestHandler):
    server_version='Tally'
    def log_message(self, *_): pass  # Never log credentials, reset tokens, or receipt data.
    def send(self,status,data,content_type='application/json; charset=utf-8',cookie=None):
        raw=json.dumps(data,ensure_ascii=False).encode() if content_type.startswith('application/json') else data
        self.send_response(status)
        self.send_header('Content-Type',content_type)
        self.send_header('Content-Length',str(len(raw)))
        self.send_header('Cache-Control','no-store')
        self.send_header('X-Content-Type-Options','nosniff')
        self.send_header('Referrer-Policy','no-referrer')
        self.send_header('X-Frame-Options','DENY')
        self.send_header('Permissions-Policy','camera=(self), microphone=(), geolocation=()')
        self.send_header('Content-Security-Policy',"default-src 'self'; script-src 'self' 'wasm-unsafe-eval' https://cdn.jsdelivr.net https://cdn.sheetjs.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src 'self' data: blob:; connect-src 'self' https://cdn.jsdelivr.net https://tessdata.projectnaptha.com https://cdn.sheetjs.com; worker-src 'self' blob:; object-src 'none'; base-uri 'self'; frame-ancestors 'none'; form-action 'self'")
        if SECURE: self.send_header('Strict-Transport-Security','max-age=31536000')
        if cookie: self.send_header('Set-Cookie',cookie)
        self.end_headers()
        self.wfile.write(raw)
    def body(self):
        if not self.headers.get('Content-Type','').startswith('application/json'): raise APIError('JSON is required.',415)
        try: size=int(self.headers.get('Content-Length',0))
        except ValueError: raise APIError('Invalid request length.')
        if not 0<size<=12*1024*1024: raise APIError('Request is too large or empty.',413)
        try: data=json.loads(self.rfile.read(size))
        except (ValueError,UnicodeError): raise APIError('Invalid JSON.')
        if not isinstance(data,dict): raise APIError('Expected an object.')
        return data
    def session(self,required=True):
        jar=cookies.SimpleCookie()
        try: jar.load(self.headers.get('Cookie',''))
        except cookies.CookieError: pass
        token=jar.get('tally_session')
        with db() as conn:
            s=conn.execute('SELECT s.*,u.name,u.email FROM sessions s JOIN users u ON u.id=s.user_id WHERE token_hash=? AND expires>?',(digest(token.value) if token else '',time.time())).fetchone()
        if not s and required: raise APIError('Please log in to continue.',401)
        return dict(s) if s else None
    def check_origin(self):
        origin=self.headers.get('Origin')
        allowed={PUBLIC_ORIGIN}
        if not SECURE: allowed.update({f'http://localhost:{PORT}',f'http://127.0.0.1:{PORT}'})
        if origin and origin not in allowed: raise APIError('Cross-origin request blocked.',403)
        if self.headers.get('Sec-Fetch-Site')=='cross-site': raise APIError('Cross-site request blocked.',403)
    def csrf(self,s):
        if not hmac.compare_digest(self.headers.get('X-CSRF-Token',''),s['csrf']): raise APIError('Session verification failed. Refresh the page.',403)
    def limit(self,key,max_count=12):
        now=time.time()
        with db() as conn:
            conn.execute('DELETE FROM rate_limits WHERE expires<?',(now,))
            key=digest(key)
            conn.execute('INSERT INTO rate_limits(key,count,expires) VALUES(?,1,?) ON CONFLICT(key) DO UPDATE SET count=count+1',(key,now+900))
            count=conn.execute('SELECT count FROM rate_limits WHERE key=?',(key,)).fetchone()[0]
        if count>max_count: raise APIError('Too many attempts. Please try again in 15 minutes.',429)
    def start_session(self,user):
        token=secrets.token_urlsafe(32);csrf=secrets.token_urlsafe(32)
        with db() as conn:
            conn.execute('DELETE FROM sessions WHERE expires<?',(time.time(),))
            conn.execute('INSERT INTO sessions VALUES(?,?,?,?)',(digest(token),user['id'],csrf,time.time()+7*86400))
        self.send(200,{'user':{k:user[k] for k in ['id','name','email']},'csrf':csrf},cookie=f'tally_session={token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=604800'+('; Secure' if SECURE else ''))
    def do_GET(self): self.dispatch('GET')
    def do_POST(self): self.dispatch('POST')
    def do_PUT(self): self.dispatch('PUT')
    def do_DELETE(self): self.dispatch('DELETE')
    def dispatch(self,method):
        try:
            # Only explicitly allowed origins/hosts can reach the local server.
            allowed_hosts={urlparse(PUBLIC_ORIGIN).netloc,f'localhost:{PORT}',f'127.0.0.1:{PORT}'}
            if self.headers.get('Host') not in allowed_hosts: raise APIError('Invalid host.',403)
            path=urlparse(self.path).path
            if not path.startswith('/api/'):
                if method!='GET': raise APIError('Method not allowed.',405)
                files={'/':('index.html','text/html; charset=utf-8'),'/index.html':('index.html','text/html; charset=utf-8'),'/app.js':('app.js','text/javascript; charset=utf-8'),'/services.js':('services.js','text/javascript; charset=utf-8'),'/styles.css':('styles.css','text/css; charset=utf-8')}
                if path not in files: raise APIError('Not found.',404)
                filename,mime=files[path];self.send(200,(ROOT/filename).read_bytes(),mime);return
            if method!='GET': self.check_origin()
            if path=='/api/session' and method=='GET':
                s=self.session(False);self.send(200,{'user':{'id':s['user_id'],'name':s['name'],'email':s['email']} if s else None,'csrf':s['csrf'] if s else ''});return
            if path in ['/api/signup','/api/login'] and method=='POST':
                self.limit(self.client_address[0]+path)
                data=self.body();email=str(data.get('email','')).strip().lower();password=data.get('password','')
                if not re.fullmatch(r'[^\s@]+@[^\s@]+\.[^\s@]+',email) or len(email)>254: raise APIError('Enter a valid email address.')
                if not isinstance(password,str) or len(password)>256: raise APIError('Invalid password.')
                with db() as conn:
                    if path.endswith('signup'):
                        require_password(password);name=str(data.get('name','')).strip()[:100]
                        if not name: raise APIError('Enter your name.')
                        user={'id':str(uuid.uuid4()),'name':name,'email':email}
                        try: conn.execute('INSERT INTO users VALUES(?,?,?,?,?)',(user['id'],name,email,password_hash(password),time.time()))
                        except sqlite3.IntegrityError: raise APIError('This email cannot be registered. Try logging in or resetting the password.',409)
                    else:
                        user=conn.execute('SELECT * FROM users WHERE email=?',(email,)).fetchone()
                        stored=user['password_hash'] if user else password_hash('dummy-authentication-value')
                        valid=check_password(password,stored)
                        if not user or not valid: raise APIError('Email or password is incorrect.',401)
                self.start_session(user);return
            if path=='/api/forgot-password' and method=='POST':
                self.limit(self.client_address[0]+path,5);data=self.body()
                if not os.environ.get('TALLY_SMTP_HOST'): raise APIError('Password reset email is not configured. Ask the server administrator to configure SMTP.',503)
                email=str(data.get('email','')).strip().lower()
                with db() as conn:
                    user=conn.execute('SELECT id,email FROM users WHERE email=?',(email,)).fetchone()
                    if user:
                        token=secrets.token_urlsafe(32)
                        conn.execute('DELETE FROM reset_tokens WHERE user_id=? OR expires<?',(user['id'],time.time()))
                        conn.execute('INSERT INTO reset_tokens VALUES(?,?,?)',(digest(token),user['id'],time.time()+1800))
                if user:
                    msg=EmailMessage();msg['Subject']='Reset your Tally password';msg['From']=os.environ.get('TALLY_SMTP_FROM','tally@localhost');msg['To']=email
                    msg.set_content(f'Reset your password within 30 minutes:\n{PUBLIC_ORIGIN}/?reset={token}\n\nIf you did not request this, ignore this email.')
                    with smtplib.SMTP(os.environ['TALLY_SMTP_HOST'],int(os.environ.get('TALLY_SMTP_PORT','587')),timeout=15) as smtp:
                        smtp.starttls(context=ssl.create_default_context())
                        if os.environ.get('TALLY_SMTP_USER'): smtp.login(os.environ['TALLY_SMTP_USER'],os.environ['TALLY_SMTP_PASSWORD'])
                        smtp.send_message(msg)
                self.send(200,{'message':'If that account exists, a reset link has been sent.'});return
            if path=='/api/reset-password' and method=='POST':
                self.limit(self.client_address[0]+path,8);data=self.body();require_password(data.get('password'))
                with db() as conn:
                    row=conn.execute('DELETE FROM reset_tokens WHERE token_hash=? AND expires>? RETURNING user_id',(digest(str(data.get('token',''))),time.time())).fetchone()
                    if not row: raise APIError('This reset link is invalid or expired.')
                    conn.execute('UPDATE users SET password_hash=? WHERE id=?',(password_hash(data['password']),row['user_id']))
                    conn.execute('DELETE FROM sessions WHERE user_id=?',(row['user_id'],))
                self.send(200,{'message':'Password reset.'});return
            s=self.session()
            if method!='GET': self.csrf(s)
            if path=='/api/logout' and method=='POST':
                with db() as conn: conn.execute('DELETE FROM sessions WHERE token_hash=?',(s['token_hash'],))
                self.send(200,{'ok':True},cookie='tally_session=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0');return
            if path=='/api/change-password' and method=='POST':
                self.limit(s['user_id']+path,8);data=self.body();require_password(data.get('password'))
                with db() as conn:
                    user=conn.execute('SELECT * FROM users WHERE id=?',(s['user_id'],)).fetchone()
                    current=data.get('current_password','')
                    if not isinstance(current,str) or len(current)>256 or not check_password(current,user['password_hash']): raise APIError('Current password is incorrect.')
                    conn.execute('UPDATE users SET password_hash=? WHERE id=?',(password_hash(data['password']),s['user_id']))
                    conn.execute('DELETE FROM sessions WHERE user_id=? AND token_hash<>?',(s['user_id'],s['token_hash']))
                self.send(200,{'message':'Password changed. Other sessions have been logged out.'});return
            if path=='/api/receipts' and method=='GET':
                with db() as conn: rows=conn.execute('SELECT id,data FROM receipts WHERE user_id=? ORDER BY date DESC,created_at DESC',(s['user_id'],)).fetchall()
                self.send(200,{'receipts':[dict(json.loads(row['data']),id=row['id']) for row in rows]});return
            if (path=='/api/receipts' and method=='POST') or (re.fullmatch(r'/api/receipts/[a-f0-9-]{36}',path) and method=='PUT'):
                data=validate_receipt(self.body());receipt_id=path.rsplit('/',1)[-1] if method=='PUT' else str(uuid.uuid4())
                with db() as conn:
                    if method=='PUT':
                        row=conn.execute('SELECT id FROM receipts WHERE id=? AND user_id=?',(receipt_id,s['user_id'])).fetchone()
                        if not row: raise APIError('Receipt not found.',404)
                        conn.execute('UPDATE receipts SET merchant_name=?,date=?,category=?,total=?,data=? WHERE id=? AND user_id=?',(data['merchant'],data['date'],data['category'],data['total'],json.dumps(data),receipt_id,s['user_id']))
                        conn.execute('DELETE FROM receipt_items WHERE receipt_id=?',(receipt_id,))
                    else: conn.execute('INSERT INTO receipts VALUES(?,?,?,?,?,?,?,?)',(receipt_id,s['user_id'],data['merchant'],data['date'],data['category'],data['total'],json.dumps(data),time.time()))
                    conn.executemany('INSERT INTO receipt_items(receipt_id,item_name,product_code,quantity,unit_price,total_price,discount) VALUES(?,?,?,?,?,?,?)',[(receipt_id,i['name'],i['product_code'],i['quantity'],i['unit_price'],i['total'],i['discount']) for i in data['items']])
                    conn.execute('INSERT INTO category_corrections VALUES(?,?,?) ON CONFLICT(user_id,merchant) DO UPDATE SET category=excluded.category',(s['user_id'],data['merchant'].lower(),data['category']))
                self.send(200,{'receipt':dict(data,id=receipt_id)});return
            if re.fullmatch(r'/api/receipts/[a-f0-9-]{36}',path) and method=='DELETE':
                with db() as conn:
                    cursor=conn.execute('DELETE FROM receipts WHERE id=? AND user_id=?',(path.rsplit('/',1)[-1],s['user_id']))
                    if cursor.rowcount!=1: raise APIError('Receipt not found.',404)
                self.send(200,{'ok':True});return
            if path=='/api/classify' and method=='POST':
                receipt=self.body().get('receipt',{})
                if not isinstance(receipt,dict): raise APIError('Invalid receipt.')
                with db() as conn: row=conn.execute('SELECT category FROM category_corrections WHERE user_id=? AND merchant=?',(s['user_id'],str(receipt.get('merchant','')).lower())).fetchone()
                self.send(200,{'category':row['category'] if row else receipt.get('category','Other'),'source':'saved correction' if row else 'structured classifier'});return
            if path=='/api/export' and method=='POST':
                ids=self.body().get('ids',[])
                if not isinstance(ids,list) or len(ids)>5000 or any(not isinstance(i,str) for i in ids): raise APIError('Invalid receipt selection.')
                with db() as conn: rows=conn.execute('SELECT id,data FROM receipts WHERE user_id=?',(s['user_id'],)).fetchall()
                wanted=set(ids);receipts=[json.loads(r['data']) for r in rows if r['id'] in wanted]
                self.send(200,make_xlsx(receipts),'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');return
            raise APIError('Not found.',404)
        except APIError as e: self.send(e.status,{'error':e.message})
        except (BrokenPipeError,ConnectionResetError): pass
        except Exception:
            self.send(500,{'error':'The server could not complete the request. Please try again.'})

if __name__=='__main__':
    if HOST not in ['127.0.0.1','localhost','::1'] and not SECURE:
        raise SystemExit('Non-local hosting requires an HTTPS TALLY_ORIGIN and a TLS reverse proxy.')
    initialize()
    print(f'Tally is ready at {PUBLIC_ORIGIN}',flush=True)
    ThreadingHTTPServer((HOST,PORT),Handler).serve_forever()
