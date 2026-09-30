'use strict';
async function loadImage(file) {
  if (!file) return;
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
    toast('Choose a JPG, PNG, or WebP image.');
    return;
  }
  if (file.size > 10 * 1024 * 1024) {
    toast('This image is too large. Please choose one under 10 MB.');
    return;
  }
  const reader = new FileReader();
  reader.onload = () => {
    const img = new Image();
    img.onload = () => {
      if (img.width * img.height > 40000000) {
        toast('Please choose an image smaller than 40 megapixels.');
        return;
      }
      state.image = img;
      state.original = reader.result;
      state.rotation = 0;
      state.brightness = 100;
      state.contrast = 110;
      state.crop = null;
      render();
    };
    img.onerror = () => toast('This image could not be read. Try a different image.');
    img.src = reader.result;
  };
  reader.readAsDataURL(file);
}
function drawImage() {
  const canvas = document.querySelector('#receipt-canvas');
  if (!canvas || !state.image) return;
  const img = state.image,
    scale = Math.min(1, 2400 / Math.max(img.width, img.height)),
    w = img.width * scale,
    h = img.height * scale,
    swapped = state.rotation % 180 !== 0;
  canvas.width = swapped ? h : w;
  canvas.height = swapped ? w : h;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = 'white';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.save();
  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.rotate((state.rotation * Math.PI) / 180);
  ctx.filter = `brightness(${state.brightness}%) contrast(${state.contrast}%)`;
  ctx.drawImage(img, -w / 2, -h / 2, w, h);
  ctx.restore();
  if (state.crop) {
    const c = state.crop,
      tmp = document.createElement('canvas');
    tmp.width = c.w;
    tmp.height = c.h;
    tmp.getContext('2d').drawImage(canvas, c.x, c.y, c.w, c.h, 0, 0, c.w, c.h);
    canvas.width = c.w;
    canvas.height = c.h;
    canvas.getContext('2d').drawImage(tmp, 0, 0);
  }
}
function enableCrop() {
  const canvas = document.querySelector('#receipt-canvas');
  document.querySelector('#crop-hint').textContent =
    'Drag across the image to select the area to keep.';
  canvas.style.touchAction = 'none';
  canvas.style.cursor = 'crosshair';
  let start;
  canvas.onpointerdown = (e) => {
    const box = canvas.getBoundingClientRect();
    start = {
      x: ((e.clientX - box.left) * canvas.width) / box.width,
      y: ((e.clientY - box.top) * canvas.height) / box.height,
    };
    canvas.setPointerCapture(e.pointerId);
  };
  canvas.onpointerup = (e) => {
    if (!start) return;
    const box = canvas.getBoundingClientRect(),
      end = {
        x: Math.max(0, Math.min(canvas.width, ((e.clientX - box.left) * canvas.width) / box.width)),
        y: Math.max(
          0,
          Math.min(canvas.height, ((e.clientY - box.top) * canvas.height) / box.height),
        ),
      },
      c = {
        x: Math.min(start.x, end.x),
        y: Math.min(start.y, end.y),
        w: Math.abs(start.x - end.x),
        h: Math.abs(start.y - end.y),
      };
    if (c.w > 40 && c.h > 40) {
      const temp = document.createElement('canvas');
      temp.width = c.w;
      temp.height = c.h;
      temp.getContext('2d').drawImage(canvas, c.x, c.y, c.w, c.h, 0, 0, c.w, c.h);
      const img = new Image();
      img.onload = () => {
        state.image = img;
        state.rotation = 0;
        state.brightness = 100;
        state.contrast = 100;
        state.crop = null;
        render();
        toast('Receipt cropped.');
      };
      img.src = temp.toDataURL('image/jpeg', 0.9);
    }
    canvas.onpointerdown = null;
    canvas.onpointerup = null;
    canvas.style.cursor = 'default';
    canvas.style.touchAction = 'auto';
  };
}
const scriptLoads = {};
function loadScript(src) {
  if (scriptLoads[src]) return scriptLoads[src];
  scriptLoads[src] = new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = src;
    s.onload = resolve;
    s.onerror = () => {
      delete scriptLoads[src];
      s.remove();
      reject(Error('Could not load the scanning engine. Check your connection and try again.'));
    };
    document.head.append(s);
  });
  return scriptLoads[src];
}
function maskCards(text) {
  return String(text).replace(
    /\b(?:\d[ -]?){13,19}\b/g,
    (m) => '•••• ' + m.replace(/\D/g, '').slice(-4),
  );
}
function classify(merchant, items) {
  const learned = state.receipts
    .filter((r) => r.merchant.toLowerCase() === merchant.toLowerCase())
    .at(0);
  if (learned) return learned.category;
  const text = (merchant + ' ' + items.map((i) => i.name).join(' ')).toLowerCase();
  const rules = [
    [
      'Food & Dining',
      /jollibee|mcdonald|starbucks|coffee|burger|restaurant|pizza|meal|chicken|dining|cafe/,
    ],
    [
      'Groceries',
      /supermarket|grocery|groceries|marketplace|puregold|savemore|rice|milk|vegetable/,
    ],
    ['Fuel', /shell|petron|caltex|gasoline|diesel|fuel/],
    ['Transportation', /grab|uber|taxi|fare|transport|parking|toll/],
    ['Utilities', /meralco|electric|water bill|pldt|globe|internet bill/],
    ['Education', /book store|bookstore|notebook|tuition|school|ballpen/],
    ['Healthcare', /hospital|clinic|pharmacy|mercury drug|medicine/],
    ['Personal Care', /watsons|salon|shampoo|skincare/],
    ['Shopping', /uniqlo|h&m|zara|shirt|shoes|clothing/],
    ['Electronics', /computer|laptop|electronic|keyboard/],
    ['Subscriptions', /netflix|spotify|subscription/],
    ['Travel', /airline|hotel|resort|airbnb/],
    ['Entertainment', /cinema|movie|theater|concert/],
    ['Household', /hardware|furniture|detergent/],
  ];
  return rules.find(([, rx]) => rx.test(text))?.[0] || 'Other';
}
function parseReceipt(raw, confidence = 0) {
  const safe = maskCards(raw),
    lines = safe
      .split(/\r?\n/)
      .map((s) => s.trim())
      .filter(Boolean),
    price = (line) => {
      const m = line.match(/(?:₱|PHP|P|\$)?\s*(-?\d[\d,]*\.\d{2})\s*$/i);
      return m ? Number(m[1].replaceAll(',', '')) : null;
    },
    find = (rx) => {
      const l = lines.find((l) => rx.test(l));
      return l ? price(l) : null;
    };
  const r = {
    merchant:
      lines.find((l) => /[a-z]{3}/i.test(l) && !/^receipt|^invoice|^date|^tel|^tin/i.test(l)) || '',
    date: '',
    receipt_number: '',
    currency: /\bUSD\b|\$/.test(safe)
      ? 'USD'
      : /\bEUR\b|€/.test(safe)
        ? 'EUR'
        : /\bSGD\b/.test(safe)
          ? 'SGD'
          : 'PHP',
    payment_method: /gcash/i.test(safe)
      ? 'GCash'
      : /maya/i.test(safe)
        ? 'Maya'
        : /debit/i.test(safe)
          ? 'Debit Card'
          : /visa|mastercard|credit/i.test(safe)
            ? 'Credit Card'
            : /cash/i.test(safe)
              ? 'Cash'
              : 'Other',
    items: [],
    confidence: { merchant: Math.min(confidence, 80), date: 0, total: 0, receipt_number: 0 },
  };
  const iso = safe.match(/\b(20\d{2})[-/.](\d{1,2})[-/.](\d{1,2})\b/),
    us = safe.match(/\b(\d{1,2})[-/.](\d{1,2})[-/.](20\d{2})\b/),
    named = safe.match(
      /\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2},?\s+20\d{2}\b/i,
    );
  if (iso) r.date = `${iso[1]}-${iso[2].padStart(2, '0')}-${iso[3].padStart(2, '0')}`;
  else if (us) r.date = `${us[3]}-${us[1].padStart(2, '0')}-${us[2].padStart(2, '0')}`;
  else if (named) {
    const d = new Date(named[0]);
    if (!isNaN(d))
      r.date = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }
  if (r.date) r.confidence.date = iso ? confidence : 70;
  const id = safe.match(
    /(?:receipt|invoice|\bOR|\bSI)\s*(?:no\.?|number|#)?\s*[:#-]?\s*([A-Z0-9-]{3,})/i,
  );
  if (id) r.receipt_number = id[1];
  r.time = safe.match(/\b([01]?\d|2[0-3]):([0-5]\d)(?::[0-5]\d)?\b/)?.[0]?.slice(0, 5) || '';
  r.total = find(
    /^(?:grand\s+total|total\s+(?:amount|due)|amount\s+due|balance\s+due|total\b)(?!.*(?:discount|tax|item))/i,
  );
  r.subtotal = find(/^sub\s*total/i);
  r.tax = find(/^(?:vat\s*(?:amount)?|tax\s*(?:amount)?)\s*[:\s]/i);
  r.discount = find(/^(?:total\s+)?discount/i);
  r.service_charge = find(/^service\s+charge/i);
  r.amount_paid = find(/^(?:cash\s+tendered|amount\s+paid|cash\s+paid)/i);
  r.change = find(/^change/i);
  r.vatable_sales = find(/^vatable\s+sales/i);
  r.vat_exempt = find(/^vat\s+exempt/i);
  r.zero_rated = find(/^zero\s+rated/i);
  r.confidence.total = r.total !== null ? Math.min(confidence, 90) : 0;
  r.confidence.receipt_number = id ? 70 : 0;
  const skip =
    /total|vat|tax|discount|cash|change|tender|amount|payment|balance|receipt|invoice|tin\b|tel\b|visa|mastercard|gcash|maya|service charge|zero rated/i;
  for (const line of lines) {
    if (skip.test(line)) continue;
    const v = price(line);
    if (v === null) continue;
    let name = line.replace(/(?:₱|PHP|P|\$)?\s*-?\d[\d,]*\.\d{2}\s*$/i, '').trim(),
      qty = 1,
      unit = v;
    const full = name.match(/^(.*?)\s+(\d+(?:\.\d+)?)\s+(?:[xX@]\s*)?(\d[\d,]*\.\d{2})$/);
    if (full) {
      name = full[1];
      qty = Number(full[2]);
      unit = Number(full[3].replaceAll(',', ''));
    } else {
      const q = name.match(/^(\d+)\s*[xX]?\s+(.+)/);
      if (q) {
        qty = Number(q[1]);
        name = q[2];
        unit = v / qty;
      }
    }
    if (/[a-z]{2}/i.test(name) && name.length < 180)
      r.items.push({ name, quantity: qty, unit_price: Math.round(unit * 100) / 100, total: v });
  }
  const labels = {
    branch: 'branch',
    address: 'address',
    phone: '(?:tel|phone)',
    email: 'email',
    website: 'website',
    transaction_id: '(?:transaction|txn)\\s*(?:id|no)',
    reference_number: 'ref(?:erence)?\\s*(?:no|number)?',
    order_number: 'order\\s*(?:no|number|#)',
    terminal: '(?:pos|terminal)\\s*(?:no|number)?',
    cashier: 'cashier',
    tin: 'tin',
    invoice_number: 'invoice\\s*(?:no|number)',
  };
  for (const [key, label] of Object.entries(labels)) {
    const m = safe.match(new RegExp('(?:^|\\n)' + label + '\\s*[:#-]?\\s*([^\\n]+)', 'i'));
    r[key] = m?.[1]?.trim() || '';
  }
  r.category = classify(r.merchant, r.items);
  r.notes = '';
  return r;
}
async function processImage() {
  if (state.processing) return;
  state.processing = true;
  const stage = document.querySelector('#image-stage'),
    overlay = document.createElement('div');
  overlay.className = 'processing';
  overlay.innerHTML =
    '<div class="spinner"></div><strong>Scanning receipt...</strong><span id="scan-progress">Loading the reading engine</span>';
  stage.append(overlay);
  document
    .querySelectorAll('.image-tools button,.image-tools input,#process-image,#retake')
    .forEach((e) => (e.disabled = true));
  let worker;
  try {
    await loadScript('https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/tesseract.min.js');
    worker = await Tesseract.createWorker('eng', 1, {
      logger: (m) => {
        const el = document.querySelector('#scan-progress');
        if (el)
          el.textContent =
            m.status === 'recognizing text'
              ? `Reading the details · ${Math.round(m.progress * 100)}%`
              : m.status;
      },
    });
    const canvas = document.querySelector('#receipt-canvas'),
      result = await worker.recognize(canvas);
    if (result.data.text.trim().length < 8)
      throw Error('We couldn’t read enough text. Try a brighter, sharper photo.');
    const r = parseReceipt(result.data.text, result.data.confidence);
    let originalCanvas = null,
      originalText = '';
    if (state.original) {
      const originalImage = new Image();
      originalImage.src = state.original;
      await originalImage.decode();
      originalCanvas = document.createElement('canvas');
      const factor = Math.min(1, 2400 / Math.max(originalImage.width, originalImage.height));
      originalCanvas.width = originalImage.width * factor;
      originalCanvas.height = originalImage.height * factor;
      const originalContext = originalCanvas.getContext('2d');
      originalContext.fillStyle = 'white';
      originalContext.fillRect(0, 0, originalCanvas.width, originalCanvas.height);
      originalContext.drawImage(originalImage, 0, 0, originalCanvas.width, originalCanvas.height);
      const originalResult = await worker.recognize(originalCanvas);
      originalText = originalResult.data.text;
    }
    const combinedText = result.data.text + '\n' + originalText;
    const hasCard =
      /\b(?:\d[ -]?){13,19}\b/.test(combinedText) ||
      /card|visa|mastercard|amex|debit/i.test(combinedText);
    if (hasCard) {
      r.image = null;
      r.original_image = null;
      r.notes =
        'Receipt image omitted because payment card information may be present. Only masked text is kept.';
    } else {
      r.image = canvas.toDataURL('image/jpeg', 0.86);
      r.original_image = originalCanvas ? originalCanvas.toDataURL('image/jpeg', 0.86) : null;
    }
    r.card_checked = true;
    if (!state.demo) {
      try {
        const enriched = await api('/classify', 'POST', { receipt: r });
        r.category = enriched.category || r.category;
      } catch {}
    }
    editReceipt(r, true);
  } catch (e) {
    toast(e.message || 'Scanning failed. Please try again.');
  } finally {
    if (worker) await worker.terminate();
    state.processing = false;
    overlay.remove();
    document
      .querySelectorAll('.image-tools button,.image-tools input,#process-image,#retake')
      .forEach((e) => (e.disabled = false));
  }
}
function authDialog(mode = 'login') {
  const signup = mode === 'signup',
    change = mode === 'change',
    forgot = mode === 'forgot';
  showModal(
    signup
      ? 'A little more organized starts here.'
      : change
        ? 'Change your password'
        : forgot
          ? 'Reset your password'
          : 'Welcome back.',
    `<p>${signup ? 'Create your private receipt workspace.' : forgot ? 'Enter your email to receive a password reset link.' : change ? 'Use a unique password with at least 12 characters.' : 'Log in to your personal workspace.'}</p><form id="auth-form"><div class="form-grid" style="grid-template-columns:1fr">${signup ? field('name', 'Your name', '', 'text', 'required autocomplete="name" maxlength="100"') : ''}${!change ? field('email', 'Email address', '', 'email', 'required autocomplete="email"') : field('current_password', 'Current password', '', 'password', 'required autocomplete="current-password"')}${!forgot ? field('password', change ? 'New password' : 'Password', '', 'password', `required minlength="${signup || change ? 12 : 1}" autocomplete="${signup || change ? 'new-password' : 'current-password'}"`) : ''}</div><p class="error-text" id="auth-error" role="alert"></p><button class="primary" style="width:100%;margin-top:18px">${signup ? 'Create account' : change ? 'Update password' : forgot ? 'Send reset link' : 'Log in'} ${icon('arrow')}</button></form>${!change ? `<div class="auth-switch"><button class="text-btn" id="switch-auth">${signup ? 'Already have an account? Log in' : 'New to Tally? Create an account'}</button>${!signup && !forgot ? '<br><button class="text-btn" style="margin-top:15px" id="forgot-password">Forgot password?</button>' : ''}</div>` : ''}`,
    true,
  );
  document
    .querySelector('#switch-auth')
    ?.addEventListener('click', () => authDialog(signup ? 'login' : 'signup'));
  document.querySelector('#forgot-password')?.addEventListener('click', () => authDialog('forgot'));
  document.querySelector('#auth-form').onsubmit = async (e) => {
    e.preventDefault();
    const button = e.target.querySelector('button');
    button.disabled = true;
    try {
      const data = Object.fromEntries(new FormData(e.target)),
        result = await api(
          '/' +
            (signup ? 'signup' : change ? 'change-password' : forgot ? 'forgot-password' : 'login'),
          'POST',
          data,
        );
      if (forgot || change) {
        closeModal();
        toast(result.message);
        return;
      }
      state.user = result.user;
      state.csrf = result.csrf;
      state.demo = false;
      state.receipts = (await api('/receipts')).receipts;
      state.page = 'dashboard';
      closeModal();
      render();
      toast(signup ? 'Your workspace is ready. Welcome to Tally.' : 'Welcome back.');
    } catch (err) {
      document.querySelector('#auth-error').textContent = err.message;
      button.disabled = false;
    }
  };
}
function exportDialog(single = null) {
  const source = single || (state.page === 'receipts' ? filteredReceipts() : periodReceipts());
  showModal(
    'A copy for your records.',
    `<p>Export ${source.length} ${single ? 'receipt' : 'receipts from the current view'}. Refine the dates below if you’d like.</p><form id="export-form"><div class="form-grid">${field('from', 'From', '', 'date')}${field('to', 'To', '', 'date')}${selectField('format', 'File format', ['CSV', 'Excel / XLSX', 'PDF'], 'CSV')}</div><div class="form-actions"><button type="button" data-close>Cancel</button><button class="primary">${icon('export')} Export receipts</button></div><p id="export-error" class="error-text"></p></form>`,
    true,
  );
  document.querySelector('#export-form').onsubmit = async (e) => {
    e.preventDefault();
    const f = new FormData(e.target),
      from = f.get('from'),
      to = f.get('to');
    if (from && to && from > to) {
      document.querySelector('#export-error').textContent =
        'The end date must follow the start date.';
      return;
    }
    const rs = source.filter((r) => (!from || r.date >= from) && (!to || r.date <= to));
    if (!rs.length) {
      document.querySelector('#export-error').textContent =
        'There are no receipts in that date range.';
      return;
    }
    const headers = [
        'Date',
        'Merchant',
        'Category',
        'Receipt No.',
        'Payment Method',
        'Currency',
        'Amount',
      ],
      rows = rs.map((r) => [
        r.date,
        r.merchant,
        r.category,
        r.receipt_number,
        r.payment_method,
        r.currency,
        r.total,
      ]);
    try {
      if (f.get('format') === 'PDF') {
        showModal(
          'Expense report',
          `<p>${from || 'All dates'} — ${to || 'All dates'} · ${rs.length} receipts</p>${receiptTable(rs)}<div class="form-actions"><button class="primary" id="print-report">Save as PDF / Print</button></div>`,
        );
        document.querySelector('#print-report').onclick = () => window.print();
        return;
      }
      if (f.get('format') === 'Excel / XLSX') {
        if (state.demo) {
          await loadScript('https://cdn.sheetjs.com/xlsx-0.20.3/package/dist/xlsx.full.min.js');
          const book = XLSX.utils.book_new();
          XLSX.utils.book_append_sheet(
            book,
            XLSX.utils.aoa_to_sheet([headers, ...rows]),
            'Expenses',
          );
          XLSX.writeFile(book, 'tally-expenses.xlsx');
        } else {
          const response = await fetch('/api/export', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': state.csrf },
            body: JSON.stringify({ ids: rs.map((r) => r.id) }),
          });
          if (!response.ok) throw Error('Export failed. Please try again.');
          download(await response.blob(), 'tally-expenses.xlsx');
        }
      } else {
        const cell = (v) => {
          let s = String(v ?? '');
          if (/^[=+@\-\t\r]/.test(s)) s = "'" + s;
          return '"' + s.replaceAll('"', '""') + '"';
        };
        download(
          new Blob(
            ['\uFEFF' + [headers, ...rows].map((row) => row.map(cell).join(',')).join('\r\n')],
            { type: 'text/csv;charset=utf-8' },
          ),
          'tally-expenses.csv',
        );
      }
      closeModal();
      toast('Your export is ready.');
    } catch (err) {
      document.querySelector('#export-error').textContent = err.message;
    }
  };
}
function download(blob, name) {
  const url = URL.createObjectURL(blob),
    a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
async function init() {
  try {
    if (localStorage.getItem('tally-theme') === 'dark') document.body.classList.add('dark');
  } catch {}
  render();
  if (location.protocol !== 'file:') {
    try {
      const session = await api('/session');
      if (session.user) {
        state.user = session.user;
        state.csrf = session.csrf;
        state.demo = false;
        state.receipts = (await api('/receipts')).receipts;
        render();
      }
    } catch {}
  }
  const token = new URLSearchParams(location.search).get('reset');
  if (token) {
    history.replaceState({}, '', location.pathname);
    showModal(
      'Choose a new password',
      `<form id="reset-form">${field('password', 'New password', '', 'password', 'required minlength="12" autocomplete="new-password"')}<p class="error-text" id="reset-error"></p><button class="primary" style="margin-top:20px">Reset password</button></form>`,
      true,
    );
    document.querySelector('#reset-form').onsubmit = async (e) => {
      e.preventDefault();
      try {
        await api('/reset-password', 'POST', {
          token,
          password: new FormData(e.target).get('password'),
        });
        closeModal();
        authDialog('login');
        toast('Password updated. Please log in.');
      } catch (err) {
        document.querySelector('#reset-error').textContent = err.message;
      }
    };
  }
}
init();
