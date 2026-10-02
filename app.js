'use strict';
const icons = {
  dashboard: 'M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h7v7h-7z',
  scan: 'M8 3H4a1 1 0 0 0-1 1v4 M16 3h4a1 1 0 0 1 1 1v4 M21 16v4a1 1 0 0 1-1 1h-4 M8 21H4a1 1 0 0 1-1-1v-4 M3 12h18 M8 7h8v10H8z',
  receipt: 'M5 3l2 1 2-1 3 1 3-1 2 1 2-1v18l-2-1-2 1-3-1-3 1-2-1-2 1z M9 8h6 M9 12h6 M9 16h4',
  chart: 'M4 3v17h17 M8 15v-4 M13 15V7 M18 15V4',
  user: 'M20 21v-2a6 6 0 0 0-6-6h-4a6 6 0 0 0-6 6v2 M16 6a4 4 0 1 1-8 0 4 4 0 0 1 8 0',
  search: 'M21 21l-5-5 M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0',
  chevron: 'M9 5l7 7-7 7',
  down: 'M6 9l6 6 6-6',
  plus: 'M12 5v14 M5 12h14',
  export: 'M12 3v12 M7 10l5 5 5-5 M4 15v5a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-5',
  calendar:
    'M8 2v4 M16 2v4 M3 10h18 M4 4h16a1 1 0 0 1 1 1v15a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1',
  wallet: 'M20 8V5H5a2 2 0 0 1 0-4h13v4 M3 3v16a2 2 0 0 0 2 2h16V8H6 M16 12h5v5h-5z',
  arrow: 'M5 12h14 M14 7l5 5-5 5',
  up: 'M5 16l6-6 4 4 6-10 M15 4h6v6',
  spark: 'M12 3l2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5z M20 2v4 M18 4h4',
  shield: 'M12 3l8 3v6c0 5-8 9-8 9s-8-4-8-9V6z M8 12l3 3 5-6',
  check: 'M5 12l4 4L19 6',
  food: 'M4 3v6a3 3 0 0 0 6 0V3 M7 3v18 M20 21V3c-5 2-6 9 0 10',
  bag: 'M4 7h16l1 14H3z M8 8V6a4 4 0 0 1 8 0v2',
  car: 'M5 6h14l3 8v5H2v-5z M2 13h20 M6 16h1 M17 16h1 M5 19v2 M19 19v2',
  bolt: 'M13 2L4 14h7l-1 8 10-13h-8z',
  dots: 'M5 12h.01 M12 12h.01 M19 12h.01',
  bell: 'M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9 M10 21h4',
  moon: 'M21 13A9 9 0 1 1 11 3a7 7 0 0 0 10 10',
  close: 'M6 6l12 12 M6 18L18 6',
  upload: 'M12 16V3 M7 8l5-5 5 5 M4 16v5h16v-5',
  camera: 'M3 6h4l2-3h6l2 3h4v15H3z M16 13a4 4 0 1 1-8 0 4 4 0 0 1 8 0',
  rotate: 'M3 10a9 9 0 1 1 1 7 M3 3v7h7',
  crop: 'M6 3v15h15 M3 6h15v15',
  trash: 'M3 6h18 M9 6V3h6v3 M5 6l1 15h12l1-15 M10 10v7 M14 10v7',
  edit: 'M14 5l5 5 M3 21l5-1L21 7l-5-5L3 15z',
  lock: 'M5 10h14v11H5z M8 10V6a4 4 0 0 1 8 0v4',
  help: 'M9 8a3 3 0 1 1 5 2c-2 1-2 2-2 4 M12 17h.01 M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0',
  card: 'M3 5h18v14H3z M3 9h18 M6 15h4',
  logout: 'M9 3H3v18h6 M12 12h10 M17 7l5 5-5 5',
  globe: 'M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0 M3 12h18 M12 3c5 5 5 13 0 18-5-5-5-13 0-18',
};
const icon = (name, cls = '') =>
  `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${icons[name] || icons.receipt}"/></svg>`;
const categories = [
  'Food & Dining',
  'Groceries',
  'Transportation',
  'Shopping',
  'Electronics',
  'Utilities',
  'Entertainment',
  'Healthcare',
  'Education',
  'Travel',
  'Fuel',
  'Household',
  'Personal Care',
  'Business',
  'Subscriptions',
  'Other',
];
const categoryStyle = {
  'Food & Dining': ['#d99b4b', '#fcf3e8', 'food'],
  Groceries: ['#65a788', '#edf6f0', 'bag'],
  Transportation: ['#728ebe', '#eef1f9', 'car'],
  Shopping: ['#a18cc4', '#f2eef9', 'bag'],
  Utilities: ['#d2af61', '#faf5e6', 'bolt'],
  Fuel: ['#ba8c6b', '#f8f0e9', 'bolt'],
};
const payments = ['Cash', 'Credit Card', 'Debit Card', 'GCash', 'Maya', 'Bank Transfer', 'Other'];
const esc = (s) =>
  String(s ?? '').replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c],
  );
const money = (n, c = 'PHP', digits = 2) =>
  new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: c,
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(Number(n) || 0);
const localDate = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
const dateLabel = (d) =>
  new Date(d + 'T12:00:00').toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
const seed = [
  ['Jollibee', 358.4, 'Food & Dining', '2026-09-30', 'GCash', 'JB', '#e44d4d'],
  ['SM Supermarket', 1845.75, 'Groceries', '2026-09-29', 'Credit Card', 'SM', '#447ac3'],
  ['Shell', 1500, 'Fuel', '2026-09-28', 'Cash', 'S', '#d4a334'],
  ['Uniqlo', 1990, 'Shopping', '2026-09-27', 'Debit Card', 'U', '#e25555'],
  ['Grab', 245, 'Transportation', '2026-09-27', 'GCash', 'G', '#329b65'],
  ['Starbucks', 385, 'Food & Dining', '2026-09-26', 'GCash', 'S', '#277a55'],
  ['Meralco', 1800, 'Utilities', '2026-09-25', 'Maya', 'M', '#e6914d'],
  ['The Marketplace', 1340, 'Groceries', '2026-09-23', 'Credit Card', 'M', '#628665'],
  ['Jollibee', 485, 'Food & Dining', '2026-09-21', 'Cash', 'JB', '#e44d4d'],
  ['National Book Store', 650, 'Education', '2026-09-20', 'Cash', 'N', '#cb5353'],
  ['Grab', 320, 'Transportation', '2026-09-18', 'GCash', 'G', '#329b65'],
  ['Watsons', 890, 'Personal Care', '2026-09-15', 'Debit Card', 'W', '#3f9aa0'],
  ['Starbucks', 275, 'Food & Dining', '2026-09-12', 'GCash', 'S', '#277a55'],
  ['SM Supermarket', 1420, 'Groceries', '2026-09-09', 'Cash', 'SM', '#447ac3'],
  ['Jollibee', 425, 'Food & Dining', '2026-09-06', 'Cash', 'JB', '#e44d4d'],
  ['Grab', 280, 'Transportation', '2026-09-03', 'GCash', 'G', '#329b65'],
  ['SM Supermarket', 2100, 'Groceries', '2026-08-28', 'Cash', 'SM', '#447ac3'],
  ['Uniqlo', 2490, 'Shopping', '2026-08-21', 'Credit Card', 'U', '#e25555'],
  ['Meralco', 1750, 'Utilities', '2026-08-17', 'Maya', 'M', '#e6914d'],
  ['Jollibee', 680, 'Food & Dining', '2026-08-10', 'GCash', 'JB', '#e44d4d'],
  ['Grab', 550, 'Transportation', '2026-08-05', 'Cash', 'G', '#329b65'],
].map((r, i) => ({
  id: 'demo-' + i,
  merchant: r[0],
  total: r[1],
  subtotal: r[1],
  tax: 0,
  discount: 0,
  service_charge: 0,
  other_charges: 0,
  category: r[2],
  date: r[3],
  payment_method: r[4],
  mark: r[5],
  color: r[6],
  receipt_number: String(23918 - i).padStart(8, '0'),
  currency: 'PHP',
  notes: 'Sample receipt — for exploring Tally.',
  items: [
    {
      name: i === 0 ? 'Burger Steak Meal' : r[0] + ' purchase',
      quantity: 1,
      unit_price: r[1],
      total: r[1],
    },
  ],
}));
const state = {
  page: 'dashboard',
  period: 'month',
  user: null,
  csrf: '',
  demo: true,
  receipts: structuredClone(seed),
  query: '',
  category: 'All Categories',
  range: 'All',
  sort: 'Newest',
  currency: 'PHP',
  start: '',
  end: '',
  chartMode: 'Day',
  image: null,
  original: null,
  rotation: 0,
  brightness: 100,
  contrast: 110,
  crop: null,
  processing: false,
};
let toastTimer, modalReturnFocus;
function toast(message) {
  const el = document.querySelector('#toast');
  el.textContent = message;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 4000);
}
function appRequest(path, options, binary = false) {
  if (window.TallyNative?.isNative) return window.TallyNative.request(path, options, binary);
  return fetch(path, options);
}
async function api(path, method = 'GET', data) {
  const response = await appRequest('/api' + path, {
    method,
    headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': state.csrf },
    body: data === undefined ? undefined : JSON.stringify(data),
  });
  let body;
  try {
    body = await response.json();
  } catch {
    throw Error('Account storage requires the Tally server. Start it with python server.py.');
  }
  if (!response.ok) throw Error(body.error || 'Something went wrong. Please try again.');
  return body;
}
function navigate(page) {
  state.page = page;
  state.query = '';
  state.category = 'All Categories';
  state.range = 'All';
  render();
  window.scrollTo(0, 0);
}
function referenceDate() {
  return state.demo ? '2026-09-30' : localDate();
}
function periodReceipts(period = state.period, currency = state.currency) {
  const ref = referenceDate(),
    d = new Date(ref + 'T12:00:00');
  d.setDate(d.getDate() - 6);
  const week = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  return state.receipts.filter(
    (r) =>
      (currency === null || r.currency === currency) &&
      (period === 'month'
        ? r.date.slice(0, 7) === ref.slice(0, 7)
        : period === 'week'
          ? r.date >= week && r.date <= ref
          : r.date === ref),
  );
}
const sum = (rs) => rs.reduce((a, r) => a + Number(r.total), 0);
function breakdown(rs) {
  const map = {};
  rs.forEach((r) => (map[r.category] = (map[r.category] || 0) + r.total));
  return Object.entries(map).sort((a, b) => b[1] - a[1]);
}
function previousMonth() {
  const d = new Date(referenceDate() + 'T12:00:00');
  d.setDate(1);
  d.setMonth(d.getMonth() - 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}
function filteredReceipts() {
  let rs = state.receipts.filter((r) => {
    const hay = [
      r.merchant,
      r.receipt_number,
      r.category,
      r.date,
      r.total,
      ...(r.items || []).map((i) => i.name),
    ]
      .join(' ')
      .toLowerCase();
    return (
      hay.includes(state.query.toLowerCase()) &&
      (state.category === 'All Categories' || r.category === state.category)
    );
  });
  if (state.range !== 'All') {
    const map = { Today: 'today', 'This Week': 'week', 'This Month': 'month' };
    if (map[state.range]) {
      const ids = new Set(periodReceipts(map[state.range], null).map((r) => r.id));
      rs = rs.filter((r) => ids.has(r.id));
    } else
      rs = rs.filter(
        (r) => (!state.start || r.date >= state.start) && (!state.end || r.date <= state.end),
      );
  }
  return rs.sort((a, b) =>
    state.sort === 'Highest amount'
      ? b.total - a.total
      : state.sort === 'Lowest amount'
        ? a.total - b.total
        : state.sort === 'Oldest'
          ? a.date.localeCompare(b.date)
          : b.date.localeCompare(a.date),
  );
}
function brand() {
  return `<div class="brand"><span class="brandmark">${icon('receipt')}</span><span>tally<span style="color:var(--green)">.</span></span><small>AI</small></div>`;
}
function render() {
  const name = state.user?.name || 'Alex Morgan';
  document.querySelector('#app').innerHTML =
    `<aside class="sidebar">${brand()}<div class="nav-label">WORKSPACE</div><nav class="nav" aria-label="Main navigation">${[
      ['dashboard', 'dashboard', 'Dashboard'],
      ['scan', 'scan', 'Scan Receipt'],
      ['receipts', 'receipt', 'My Receipts'],
      ['analytics', 'chart', 'Analytics'],
      ['profile', 'user', 'Profile'],
    ]
      .map(
        ([p, i, t]) =>
          `<button data-page="${p}" class="${state.page === p ? 'active' : ''}" title="${t}">${icon(i)}<span>${t}</span>${p === 'receipts' ? `<span class="count">${state.receipts.length}</span>` : ''}</button>`,
      )
      .join(
        '',
      )}</nav><div class="sidebar-bottom"><div class="helper">${icon('spark')}<strong>Less typing. More living.</strong><p>Your receipts, organized.<br>Your expenses, understood.</p><a href="#" id="how-it-works">See how Tally works ${icon('arrow')}</a></div><div class="profile" data-page="profile"><div class="avatar">${esc(
      name
        .split(' ')
        .map((s) => s[0])
        .slice(0, 2)
        .join(''),
    )}</div><div><strong>${esc(name)}</strong><small>${state.demo ? 'Personal workspace · Demo' : 'Personal workspace'}</small></div>${icon('down')}</div></div></aside><main class="main"><header class="topbar"><div class="breadcrumb">Workspace ${icon('chevron')}<span>${{ dashboard: 'Dashboard', scan: 'Scan Receipt', receipts: 'My Receipts', analytics: 'Analytics', profile: 'Profile' }[state.page]}</span></div><div class="mobile-brand">${brand()}</div><div class="top-actions"><div class="search" id="global-search">${icon('search')} Search anything... <span class="kbd">Ctrl K</span></div><div class="vertical-rule"></div><button class="ghost icon-btn" id="theme" title="Toggle light / dark mode" aria-label="Toggle theme">${icon('moon')}</button><button class="ghost icon-btn" id="notifications" title="Activity" aria-label="Activity">${icon('bell')}</button><div class="avatar" data-page="profile" role="button" tabindex="0" aria-label="Open profile">${esc(
      name
        .split(' ')
        .map((s) => s[0])
        .slice(0, 2)
        .join(''),
    )}</div></div></header><div class="content">${window.TallyNative?.preview ? '<div class="notice warning" role="status">Preview build ? changes are temporary. Cloud accounts are not connected.</div>' : ''}${state.page === 'dashboard' ? dashboard() : state.page === 'receipts' ? receiptsPage() : state.page === 'analytics' ? analytics() : state.page === 'scan' ? scanPage() : profilePage()}<footer class="page-footer"><span>${icon('shield')} ${state.demo ? 'You’re exploring sample data. Your own receipts stay separate.' : 'Your receipts are private and belong to you.'}</span><span>Made for a little more peace of mind. <span style="color:#78a488">✧</span></span></footer></div></main>`;
  bind();
}
function heading(title, subtitle, actions = '') {
  return `<div class="page-heading"><div><h1>${title}</h1><p class="subheading">${subtitle}</p></div><div class="actions">${actions}</div></div>`;
}
const exportButton = () => `<button data-action="export">${icon('export')} Export</button>`;
const addButton = () =>
  `<button class="primary" data-action="add">${icon('plus')} Add Expense</button>`;
function dashboard() {
  const rs = periodReceipts(),
    total = sum(rs),
    cats = breakdown(rs),
    largest = [...rs].sort((a, b) => b.total - a.total)[0],
    prev = sum(
      state.receipts.filter(
        (r) => r.currency === state.currency && r.date.slice(0, 7) === previousMonth(),
      ),
    ),
    delta = prev ? ((total - prev) / prev) * 100 : 0;
  return `${heading(`A little clarity, ${esc((state.user?.name || 'Alex').split(' ')[0])}. <span style="font-size:22px">☀</span>`, 'Here’s where your money is going. Let’s make sense of it.', exportButton() + addButton())}<section class="scan-banner"><div class="banner-copy"><div class="eyebrow">${icon('spark')} SMALL RECEIPT. BIG PICTURE.</div><h2>From paper to peace of mind.</h2><p>Scan a receipt. We’ll take care of the details.</p><button class="primary" data-page="scan">${icon('scan')} Scan a Receipt ${icon('arrow')}</button><span class="banner-note">${icon('shield')} Private. Secure. Effortless.</span></div><div class="receipt-art" aria-hidden="true"><div class="orbit"></div><div class="paper back"><i></i><i></i><i></i><i></i></div><div class="paper"><span class="mini-brand">YOUR EVERYDAY</span><i></i><i></i><i></i><i></i><div class="mini-total"><span>TOTAL</span><span>₱ 358.40</span></div></div><div class="scan-line"></div><div class="verified">${icon('check')}</div></div></section><div class="section-heading"><h2>Your spending at a glance</h2><div class="overview-controls"><div class="segmented">${[
    ['month', 'This Month'],
    ['week', 'This Week'],
    ['today', 'Today'],
  ]
    .map(
      ([v, t]) =>
        `<button data-period="${v}" class="${state.period === v ? 'selected' : ''}">${t}</button>`,
    )
    .join(
      '',
    )}</div><button class="date-btn" id="date-filter">${icon('calendar')} ${new Date(referenceDate() + 'T12:00:00').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })} ${icon('down')}</button></div></div><div class="stats">${stat('Total spending', money(total, state.currency), 'wallet', `<span class="trend">${icon('up')} ${prev && state.period === 'month' ? Math.abs(delta).toFixed(1) + '% ' + (delta >= 0 ? 'more' : 'less') : 'Your expenses'}</span><span>${prev && state.period === 'month' ? 'vs. last month' : 'in one place'}</span>`)}${stat('Receipts saved', rs.length, 'receipt', `${icon('check')} All your little moments, accounted for`)}${stat('Largest expense', money(largest?.total, state.currency), 'up', `${largest ? esc(largest.merchant) + ' <span>· ' + dateLabel(largest.date).replace(', 2026', '') + '</span>' : 'No expenses in this period'}`)}${stat('Top category', cats[0]?.[0] || '—', 'bag', `<span class="dot" style="background:#daa259"></span> ${cats.length ? Math.round(total ? (cats[0][1] / total) * 100 : 0) + '% of your total spending' : 'Your categories will appear here'}`, true)}</div><div class="charts">${trendChart(rs)}${categoryChart(rs)}</div><section class="panel receipts-panel"><div class="panel-head"><div><h2 class="panel-title">Recent receipts</h2><p class="panel-caption">A little history of your everyday.</p></div><button class="text-btn" data-page="receipts">View all receipts ${icon('arrow')}</button></div>${receiptTable([...state.receipts].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5))}</section>`;
}
function stat(title, value, i, foot, cat = false) {
  return `<div class="stat"><div class="stat-top"><span>${title}</span>${icon(i)}</div><div class="stat-value ${cat ? 'category-value' : ''}">${value}</div><div class="stat-bottom">${foot}</div></div>`;
}
function trendChart(rs) {
  let buckets, labels;
  if (state.chartMode === 'Year') {
    buckets = Array(12).fill(0);
    labels = Array.from({ length: 12 }, (_, i) =>
      new Date(2026, i, 1).toLocaleDateString('en', { month: 'short' }),
    );
    state.receipts
      .filter(
        (r) => r.currency === state.currency && r.date.slice(0, 4) === referenceDate().slice(0, 4),
      )
      .forEach((r) => (buckets[Number(r.date.slice(5, 7)) - 1] += r.total));
  } else if (state.chartMode === 'Week') {
    buckets = Array(5).fill(0);
    labels = ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5'];
    rs.forEach(
      (r) => (buckets[Math.min(4, Math.floor((Number(r.date.slice(-2)) - 1) / 7))] += r.total),
    );
  } else if (state.chartMode === 'Month') {
    buckets = Array(6).fill(0);
    const date = new Date(referenceDate() + 'T12:00:00');
    date.setDate(1);
    date.setMonth(date.getMonth() - 5);
    const keys = [];
    labels = [];
    for (let i = 0; i < 6; i++) {
      keys.push(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`);
      labels.push(date.toLocaleDateString('en', { month: 'short' }));
      date.setMonth(date.getMonth() + 1);
    }
    state.receipts
      .filter((r) => r.currency === state.currency)
      .forEach((r) => {
        const i = keys.indexOf(r.date.slice(0, 7));
        if (i >= 0) buckets[i] += r.total;
      });
  } else {
    const count = new Date(
      Number(referenceDate().slice(0, 4)),
      Number(referenceDate().slice(5, 7)),
      0,
    ).getDate();
    buckets = Array(count).fill(0);
    labels = Array.from({ length: count }, (_, i) => String(i + 1).padStart(2, '0'));
    rs.forEach((r) => (buckets[Number(r.date.slice(-2)) - 1] += r.total));
  }
  const max = Math.max(1000, ...buckets) * 1.15;
  const pts = buckets.map((v, i) => [
    43 + (i * 480) / Math.max(1, buckets.length - 1),
    151 - (v / max) * 126,
  ]);
  const line = pts.map((p, i) => (i ? 'L' : 'M') + p.join(',')).join(' ');
  const labelInterval = buckets.length > 12 ? 5 : buckets.length > 6 ? 2 : 1;
  return `<section class="panel"><div class="panel-head"><div><h2 class="panel-title">Spending overview</h2><p class="panel-caption">Your expenses, over time.</p></div><div class="chart-key"><span class="dot" style="background:var(--green)"></span> Expenses <select id="chart-mode" aria-label="Chart grouping">${['Day', 'Week', 'Month', 'Year'].map((v) => `<option ${v === state.chartMode ? 'selected' : ''}>${v}</option>`).join('')}</select></div></div><div class="chart"><svg viewBox="0 0 540 177" role="img" aria-label="Expense trend, ${state.chartMode.toLowerCase()} grouping"><defs><linearGradient id="area" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#7cad8b" stop-opacity=".23"/><stop offset="100%" stop-color="#7cad8b" stop-opacity=".015"/></linearGradient></defs>${[0, 1, 2, 3].map((i) => `<line class="grid" x1="43" y1="${25 + i * 42}" x2="523" y2="${25 + i * 42}"/><text x="0" y="${29 + i * 42}">${money((max * (3 - i)) / 3, state.currency, 0)}</text>`).join('')}<path d="${line} L523,151 L43,151 Z" fill="url(#area)"/><path class="line" d="${line}"/>${pts.map((p, i) => `<circle cx="${p[0]}" cy="${p[1]}" r="3" fill="#398263" opacity="0"><title>${labels[i]}: ${money(buckets[i], state.currency)}</title></circle>`).join('')}${labels.map((l, i) => (i % labelInterval === 0 || i === labels.length - 1 ? `<text x="${pts[i][0]}" y="173" text-anchor="middle">${l}</text>` : '')).join('')}</svg></div><div class="chart-foot">${icon('spark')} ${rs.length ? `Every expense tells a story. You’ve captured ${rs.length} this ${state.period === 'month' ? 'month' : state.period === 'week' ? 'week' : 'day'}.` : 'Scan your first receipt to start seeing the bigger picture.'}</div></section>`;
}
function categoryChart(rs) {
  const total = sum(rs),
    all = breakdown(rs),
    cats = all.slice(0, 4);
  if (all.length > 4) cats.push(['Other', all.slice(4).reduce((a, c) => a + c[1], 0)]);
  const colors = ['#3e8160', '#86aa89', '#d5b36f', '#9d91b1', '#dce3da'];
  let start = 0;
  const stops = cats
    .map(([, v], i) => {
      const old = start;
      start += total ? (v / total) * 100 : 0;
      return `${colors[i]} ${old}% ${start}%`;
    })
    .join(',');
  return `<section class="panel"><div class="panel-head"><div><h2 class="panel-title">Where it all goes</h2><p class="panel-caption">A breakdown by category.</p></div><button class="ghost icon-btn" data-page="analytics" title="Explore categories">${icon('dots')}</button></div><div class="donut-wrap"><div class="donut" style="background:${total ? 'conic-gradient(' + stops + ')' : 'var(--line)'}" role="img" aria-label="Spending by category"><div class="donut-center"><small>Total expenses</small><strong>${money(total, state.currency, 0)}</strong></div></div><div class="legend">${cats.length ? cats.map(([c, v], i) => `<div class="legend-row"><span class="dot" style="background:${colors[i]}"></span><span>${esc(c)}</span><strong>${Math.round(total ? (v / total) * 100 : 0)}%</strong></div>`).join('') : '<p class="panel-caption">Your categories will appear here.</p>'}</div></div></section>`;
}
function receiptTable(rs) {
  return rs.length
    ? `<div class="table-wrap"><table><thead><tr><th>Merchant</th><th>Category</th><th>Date ${icon('down')}</th><th>Payment method</th><th style="text-align:right">Amount</th><th></th></tr></thead><tbody>${rs
        .map((r) => {
          const c = categoryStyle[r.category] || ['#8c9296', '#f0f2f3', 'receipt'];
          return `<tr data-receipt="${esc(r.id)}" tabindex="0" aria-label="Open ${esc(r.merchant)} receipt"><td><div class="merchant"><div class="merchant-mark" style="background:${r.color || '#4c8665'}12;color:${r.color || '#4c8665'}">${esc(r.mark || r.merchant.slice(0, 2).toUpperCase())}</div><div><strong>${esc(r.merchant)}</strong><small>Receipt #${esc(r.receipt_number || '—')}</small></div></div></td><td><span class="badge" style="color:${c[0]};background:${c[1]}">${icon(c[2])}${esc(r.category)}</span></td><td class="table-date">${dateLabel(r.date)}</td><td class="payment">${icon(r.payment_method.includes('Card') ? 'card' : 'wallet')}${esc(r.payment_method)}</td><td class="amount">${money(r.total, r.currency)}</td><td><span class="table-more">${icon('dots')}</span></td></tr>`;
        })
        .join('')}</tbody></table></div>`
    : `<div class="empty">${icon('receipt')}<h3>No receipts here yet</h3><p>Try a different filter, or add your first expense.</p><button class="primary" data-page="scan">${icon('scan')} Scan a Receipt</button></div>`;
}
function receiptsPage() {
  return `${heading('Your receipts, all together.', 'Find the little details. Keep the bigger picture.', exportButton() + addButton())}<div class="filters"><input id="receipt-search" type="search" value="${esc(state.query)}" placeholder="Search merchant, item, receipt number..." aria-label="Search receipts"><select id="category-filter" aria-label="Filter category">${['All Categories', ...categories].map((v) => `<option ${state.category === v ? 'selected' : ''}>${esc(v)}</option>`).join('')}</select><select id="range-filter" aria-label="Date range">${['All', 'Today', 'This Week', 'This Month', 'Custom Date'].map((v) => `<option ${state.range === v ? 'selected' : ''}>${v}</option>`).join('')}</select><select id="sort-filter" aria-label="Sort receipts">${['Newest', 'Oldest', 'Highest amount', 'Lowest amount'].map((v) => `<option ${state.sort === v ? 'selected' : ''}>${v}</option>`).join('')}</select>${state.range === 'Custom Date' ? `<input id="start-date" type="date" value="${state.start}" aria-label="Start date"><input id="end-date" type="date" value="${state.end}" aria-label="End date">` : ''}</div><div class="section-heading"><span class="panel-caption" id="receipt-count">${filteredReceipts().length} receipts ${state.demo ? '· Sample workspace' : ''}</span></div><section class="panel" id="receipt-results">${receiptTable(filteredReceipts())}</section>`;
}
function analytics() {
  const rs = periodReceipts('month'),
    total = sum(rs),
    prev = sum(
      state.receipts.filter(
        (r) => r.currency === state.currency && r.date.slice(0, 7) === previousMonth(),
      ),
    );
  const merchants = {};
  rs.forEach((r) => (merchants[r.merchant] = (merchants[r.merchant] || 0) + r.total));
  const top = Object.entries(merchants)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);
  const cats = breakdown(rs);
  return `${heading('See the bigger picture.', 'Small everyday expenses. Insights that add up.', exportButton())}<div class="section-heading"><h2>This month’s story</h2><select style="width:100px" id="analytics-currency" aria-label="Analytics currency">${['PHP', 'USD', 'EUR', 'GBP', 'JPY', 'SGD'].map((c) => `<option ${c === state.currency ? 'selected' : ''}>${c}</option>`).join('')}</select></div><div class="stats">${stat('This month', money(total, state.currency), 'wallet', 'Your recorded spending')}${stat('Last month', money(prev, state.currency), 'calendar', 'A little context for this month')}${stat('Monthly change', prev ? (((total - prev) / prev) * 100).toFixed(1) + '%' : '—', 'chart', prev ? 'Compared with last month' : 'Add previous receipts to compare')}${stat('Average expense', money(rs.length ? total / rs.length : 0, state.currency), 'receipt', `${rs.length} receipts this month`)}</div><div class="charts">${trendChart(rs)}${categoryChart(rs)}</div><div class="charts"><section class="panel"><div class="panel-head"><div><h2 class="panel-title">Your everyday favorites</h2><p class="panel-caption">Top merchants by spending.</p></div></div><div class="top-merchants">${top.length ? top.map(([m, v], i) => `<div class="merchant-rank"><div class="merchant-mark">${i + 1}</div><div><strong>${esc(m)}</strong><div class="bar"><i style="width:${top[0][1] ? (v / top[0][1]) * 100 : 0}%"></i></div></div><span>${money(v, state.currency)}</span></div>`).join('') : '<p class="empty">Your merchants will appear here.</p>'}</div></section><section class="panel" style="padding:25px"><div class="eyebrow">${icon('spark')} A LITTLE PERSPECTIVE</div><h2 style="font:700 21px Manrope;line-height:1.5">${cats.length ? `${esc(cats[0][0])} is your most-used category.` : 'Your spending has a story.'}</h2><p class="subheading" style="line-height:1.9">${cats.length ? `It makes up ${Math.round(total ? (cats[0][1] / total) * 100 : 0)}% of your recorded spending this month. Knowing where your money goes is a good place to start.` : 'As you save receipts, you’ll see patterns and useful insights here.'}</p><button class="soft" data-page="receipts" style="margin-top:25px">Explore your receipts ${icon('arrow')}</button></section></div>`;
}
function scanPage() {
  return `${heading('A receipt. A little clarity.', 'Snap, scan, and let the details fall into place.')}<div class="scan-page"><div class="steps"><span><b>1</b> Add your receipt</span><span><b>2</b> Review the details</span><span><b>3</b> Save & relax</span></div>${state.image ? `<div class="panel" style="padding:22px"><div class="image-stage" id="image-stage"><canvas id="receipt-canvas"></canvas></div><div class="image-tools"><button id="rotate-image">${icon('rotate')} Rotate</button><button id="crop-image">${icon('crop')} Crop</button><label>Brightness <input id="brightness" type="range" min="60" max="160" value="${state.brightness}"></label><label>Contrast <input id="contrast" type="range" min="70" max="180" value="${state.contrast}"></label></div><p class="panel-caption" id="crop-hint">Check that the entire receipt is readable before scanning.</p><div class="form-actions"><button id="retake">Choose another</button><button class="primary" id="process-image">${icon('spark')} Scan Receipt</button></div></div>` : `<div class="dropzone" id="dropzone"><div class="scan-icon">${icon('scan')}</div><h2>Let’s make it digital.</h2><p>Drop a receipt image here, or choose one from your device.<br>We’ll find the details. You have the final say.</p><div class="actions"><button class="primary" id="upload-receipt">${icon('upload')} Upload a receipt</button><button id="camera-receipt">${icon('camera')} Take a photo</button></div><p style="font-size:10px">JPG, PNG, or WebP · Up to 10 MB</p></div>`}<input type="file" id="file-input" accept="image/jpeg,image/png,image/webp" hidden><input type="file" id="camera-input" accept="image/*" capture="environment" hidden><div class="notice" style="margin-top:22px">${icon('shield')} OCR runs on your device. Review every detail before saving. Images are checked for payment card information before storage.</div><div style="text-align:center"><button class="text-btn" data-action="add">No receipt? Add an expense manually ${icon('arrow')}</button></div></div>`;
}
function profilePage() {
  return `${heading('Your space. Your preferences.', 'Make Tally feel a little more like you.')}<section class="panel profile-card"><h3>${state.user ? esc(state.user.name) : 'Welcome to your personal workspace'}</h3><p class="subheading">${state.user ? esc(state.user.email) : 'You’re exploring Tally with sample receipts. Create an account to privately save your own.'}</p>${!state.user ? `<div class="form-actions" style="justify-content:flex-start"><button class="primary" data-auth="signup">Create an account</button><button data-auth="login">Log in</button></div>` : ''}<div class="settings-row"><div><strong>Privacy</strong><p>How Tally uses your receipt data.</p></div><button id="privacy-info">Privacy details</button></div><div class="settings-row"><div><strong>Appearance</strong><p>A little easier on the eyes.</p></div><button id="profile-theme">${icon('moon')} Toggle theme</button></div><div class="settings-row"><div><strong>Dashboard currency</strong><p>View one currency at a time. No conversion is applied.</p></div><select id="profile-currency">${['PHP', 'USD', 'EUR', 'GBP', 'JPY', 'SGD'].map((c) => `<option ${c === state.currency ? 'selected' : ''}>${c}</option>`).join('')}</select></div>${state.user ? `<div class="settings-row"><div><strong>Password</strong><p>Keep your account secure.</p></div><button data-auth="change">Change password</button></div><div class="form-actions"><button class="danger" id="delete-account">Delete account</button><button id="logout">${icon('logout')} Log out</button></div>` : `<div class="settings-row"><div><strong>Sample workspace</strong><p>Demo changes last until you refresh the page.</p></div><span class="demo-pill">DEMO</span></div>`}</section>`;
}
function bind() {
  document
    .querySelectorAll('[data-page]')
    .forEach((b) => (b.onclick = () => navigate(b.dataset.page)));
  document.querySelectorAll('[data-period]').forEach(
    (b) =>
      (b.onclick = () => {
        state.period = b.dataset.period;
        render();
      }),
  );
  document.querySelectorAll('[data-action=add]').forEach((b) => (b.onclick = () => editReceipt()));
  document.querySelectorAll('[data-action=export]').forEach((b) => (b.onclick = exportDialog));
  document
    .querySelectorAll('[data-auth]')
    .forEach((b) => (b.onclick = () => authDialog(b.dataset.auth)));
  bindRows();
  const on = (id, event, fn) => {
    const el = document.getElementById(id);
    if (el) el[event] = fn;
  };
  on('theme', 'onclick', toggleTheme);
  on('profile-theme', 'onclick', toggleTheme);
  on('global-search', 'onclick', () => {
    navigate('receipts');
    document.querySelector('#receipt-search').focus();
  });
  on('notifications', 'onclick', () =>
    showModal(
      'All caught up.',
      `<p>${state.demo ? 'This is a sample workspace. Create an account to start your own receipt collection.' : `${state.receipts.length} receipts are safely saved in your workspace.`}</p><button class="primary" data-close>Got it</button>`,
      true,
    ),
  );
  on('how-it-works', 'onclick', (e) => {
    e.preventDefault();
    showModal(
      'Less typing. More living.',
      `<p>1. Upload a receipt or take a photo.</p><p>2. Rotate, crop, and improve readability. OCR reads the text, then structured parsing finds the merchant, totals, and items.</p><p>3. Review the details and category, correct anything that needs attention, and save.</p><button class="primary" id="start-scan">Scan your first receipt ${icon('arrow')}</button>`,
      true,
    );
    document.querySelector('#start-scan').onclick = () => {
      closeModal();
      navigate('scan');
    };
  });
  on('date-filter', 'onclick', () => {
    state.page = 'receipts';
    state.range = 'Custom Date';
    render();
  });
  on('chart-mode', 'onchange', (e) => {
    state.chartMode = e.target.value;
    render();
  });
  on('receipt-search', 'oninput', (e) => {
    state.query = e.target.value;
    updateResults();
  });
  [
    ['category-filter', 'category'],
    ['range-filter', 'range'],
    ['sort-filter', 'sort'],
    ['start-date', 'start'],
    ['end-date', 'end'],
  ].forEach(([id, k]) =>
    on(id, 'onchange', (e) => {
      state[k] = e.target.value;
      if (k === 'range') render();
      else updateResults();
    }),
  );
  ['analytics-currency', 'profile-currency'].forEach((id) =>
    on(id, 'onchange', (e) => {
      state.currency = e.target.value;
      render();
    }),
  );
  on('logout', 'onclick', async () => {
    try {
      await api('/logout', 'POST', {});
      state.user = null;
      state.csrf = '';
      state.image = null;
      state.original = null;
      state.demo = true;
      state.receipts = structuredClone(seed);
      render();
      toast('You’re logged out.');
    } catch (e) {
      toast(e.message);
    }
  });
  on('upload-receipt', 'onclick', () => {
    if (window.TallyNative?.isNative) return window.TallyNative.takePhoto(true);
    document.querySelector('#file-input').click();
  });
  on('camera-receipt', 'onclick', () => {
    if (window.TallyNative?.isNative) return window.TallyNative.takePhoto();
    document.querySelector('#camera-input').click();
  });
  on('delete-account', 'onclick', deleteAccountDialog);
  on('privacy-info', 'onclick', showPrivacyInfo);
  ['file-input', 'camera-input'].forEach((id) =>
    on(id, 'onchange', (e) => loadImage(e.target.files[0])),
  );
  const drop = document.querySelector('#dropzone');
  if (drop) {
    drop.ondragover = (e) => {
      e.preventDefault();
      drop.classList.add('drag');
    };
    drop.ondragleave = () => drop.classList.remove('drag');
    drop.ondrop = (e) => {
      e.preventDefault();
      loadImage(e.dataTransfer.files[0]);
    };
  }
  if (state.page === 'scan' && state.image) {
    drawImage();
    on('rotate-image', 'onclick', () => {
      state.rotation = (state.rotation + 90) % 360;
      state.crop = null;
      drawImage();
    });
    on('brightness', 'oninput', (e) => {
      state.brightness = Number(e.target.value);
      drawImage();
    });
    on('contrast', 'oninput', (e) => {
      state.contrast = Number(e.target.value);
      drawImage();
    });
    on('crop-image', 'onclick', enableCrop);
    on('retake', 'onclick', () => {
      state.image = null;
      state.original = null;
      render();
    });
    on('process-image', 'onclick', processImage);
  }
}
function bindRows() {
  document.querySelectorAll('[data-receipt]').forEach((row) => {
    row.onclick = () => viewReceipt(state.receipts.find((r) => r.id === row.dataset.receipt));
    row.onkeydown = (e) => {
      if (e.key === 'Enter') row.click();
    };
  });
}
function updateResults() {
  document.querySelector('#receipt-results').innerHTML = receiptTable(filteredReceipts());
  document.querySelector('#receipt-count').textContent = filteredReceipts().length + ' receipts';
  bindRows();
  document
    .querySelector('#receipt-results [data-page]')
    ?.addEventListener('click', () => navigate('scan'));
}
function toggleTheme() {
  document.body.classList.toggle('dark');
  try {
    localStorage.setItem(
      'tally-theme',
      document.body.classList.contains('dark') ? 'dark' : 'light',
    );
  } catch {}
}
function showModal(title, content, small = false) {
  modalReturnFocus = document.activeElement;
  document.querySelector('#modal-root').innerHTML =
    `<div class="modal-backdrop"><section class="modal ${small ? 'small' : ''}" role="dialog" aria-modal="true" aria-labelledby="modal-title"><div class="modal-head"><h2 id="modal-title">${title}</h2><button class="ghost icon-btn" data-close aria-label="Close dialog">${icon('close')}</button></div>${content}</section></div>`;
  document.querySelectorAll('[data-close]').forEach((b) => (b.onclick = closeModal));
  document.querySelector('.modal-backdrop').onclick = (e) => {
    if (e.target.classList.contains('modal-backdrop')) closeModal();
  };
  document.body.style.overflow = 'hidden';
  setTimeout(() => document.querySelector('.modal input,.modal button')?.focus(), 10);
}
function closeModal() {
  document.querySelector('#modal-root').innerHTML = '';
  document.body.style.overflow = '';
  modalReturnFocus?.focus();
}
document.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
    e.preventDefault();
    navigate('receipts');
    document.querySelector('#receipt-search').focus();
  }
  if (e.key === 'Escape') closeModal();
  if (e.key === 'Tab' && document.querySelector('.modal')) {
    const els = [
        ...document.querySelectorAll(
          '.modal button,.modal input,.modal select,.modal textarea,.modal a,.modal summary',
        ),
      ].filter((el) => el.offsetParent !== null && !el.disabled),
      first = els[0],
      last = els.at(-1);
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }
});
function field(name, label, value = '', type = 'text', extra = '') {
  return `<label class="field ${extra.includes('data-uncertain') ? 'uncertain' : ''}">${label}<input name="${name}" type="${type}" value="${esc(value)}" ${extra}>${extra.includes('data-uncertain') ? '<small>Please verify this information.</small>' : ''}</label>`;
}
function selectField(name, label, values, value) {
  return `<label class="field">${label}<select name="${name}">${values.map((v) => `<option ${v === value ? 'selected' : ''}>${esc(v)}</option>`).join('')}</select></label>`;
}
function editReceipt(receipt = null, scanned = false) {
  const r = receipt
    ? structuredClone(receipt)
    : {
        date: localDate(),
        category: 'Other',
        currency: state.currency,
        payment_method: 'Cash',
        items: [],
      };
  const uncertain = (n) =>
    scanned && (!r.confidence || r.confidence[n] < 85) ? ' data-uncertain' : '';
  showModal(
    receipt?.id ? 'Edit receipt' : scanned ? 'Review your receipt' : 'Add an expense',
    `${scanned ? '<div class="notice warning">OCR can miss a detail. Please review the highlighted fields and totals before saving.</div>' : ''}${scanned && r.image ? `<div class="image-stage" style="min-height:180px;max-height:240px;margin-bottom:20px"><img src="${r.image}" alt="Receipt image to review" style="max-height:220px"></div>` : ''}${state.demo ? '<div class="notice">Sample workspace — changes are temporary. Create an account in Profile to save privately.</div>' : ''}<form id="receipt-form"><div class="form-grid">${field('merchant', 'Merchant', r.merchant || '', 'text', 'required maxlength="150"' + uncertain('merchant'))}${field('date', 'Date', r.date, 'date', 'required' + uncertain('date'))}${selectField('category', 'Category', categories, r.category)}${field('receipt_number', 'Receipt number', r.receipt_number || '', 'text', uncertain('receipt_number'))}${field('total', 'Total amount', r.total ?? '', 'number', 'required min="0" max="100000000" step="0.01"' + uncertain('total'))}${selectField('currency', 'Currency', ['PHP', 'USD', 'EUR', 'GBP', 'JPY', 'SGD', 'AUD', 'CAD'], r.currency)}${selectField('payment_method', 'Payment method', payments, r.payment_method)}${field('time', 'Time', r.time || '', 'time')}</div><h3 class="details-heading">Purchased items <button type="button" class="text-btn" id="add-item">${icon('plus')} Add item</button></h3><div class="table-wrap"><table class="item-table"><thead><tr><th>Item / SKU</th><th>Qty</th><th>Unit price</th><th>Discount</th><th>Total</th><th></th></tr></thead><tbody id="items-body"></tbody></table></div><details ${scanned ? 'open' : ''}><summary>Payment breakdown & merchant details</summary><div class="form-grid">${field('subtotal', 'Subtotal', r.subtotal ?? '', 'number', 'min="0" step="0.01"')}${field('tax', 'VAT / Tax', r.tax ?? '', 'number', 'min="0" step="0.01"')}${field('discount', 'Discount', r.discount ?? '', 'number', 'min="0" step="0.01"')}${field('service_charge', 'Service charge', r.service_charge ?? '', 'number', 'min="0" step="0.01"')}${field('other_charges', 'Other charges', r.other_charges ?? '', 'number', 'min="0" step="0.01"')}${field('amount_paid', 'Amount paid', r.amount_paid ?? '', 'number', 'min="0" step="0.01"')}${field('change', 'Change', r.change ?? '', 'number', 'min="0" step="0.01"')}${field('branch', 'Branch', r.branch || '')}${field('address', 'Store address', r.address || '')}${field('phone', 'Phone', r.phone || '')}${field('email', 'Merchant email', r.email || '', 'email')}${field('website', 'Website', r.website || '')}${field('invoice_number', 'Invoice / SI / OR number', r.invoice_number || '')}${field('transaction_id', 'Transaction ID', r.transaction_id || '')}${field('reference_number', 'Reference number', r.reference_number || '')}${field('order_number', 'Order number', r.order_number || '')}${field('terminal', 'POS / Terminal', r.terminal || '')}${field('cashier', 'Cashier', r.cashier || '')}${field('tin', 'TIN', r.tin || '')}${field('vatable_sales', 'VATable sales', r.vatable_sales ?? '', 'number', 'min="0" step="0.01"')}${field('vat_exempt', 'VAT-exempt sales', r.vat_exempt ?? '', 'number', 'min="0" step="0.01"')}${field('zero_rated', 'Zero-rated sales', r.zero_rated ?? '', 'number', 'min="0" step="0.01"')}</div></details><label class="field full" style="display:block;margin-top:18px">Notes<textarea name="notes" rows="2" maxlength="4000">${esc(r.notes || '')}</textarea></label>${scanned && r.image ? '<label class="field" style="display:flex;gap:9px;align-items:center;margin-top:18px"><input type="checkbox" required style="width:auto;margin:0"> I checked the image: no full payment card number is visible.</label>' : ''}<p id="form-error" class="error-text" role="alert"></p><div id="math-warning"></div><div class="form-actions"><button type="button" data-close>Cancel</button>${scanned ? '<button type="button" id="rescan">Rescan</button>' : ''}<button type="submit" class="primary">${icon('check')} ${receipt?.id ? 'Save changes' : 'Save Receipt'}</button></div></form>`,
  );
  const receiptForm = document.querySelector('#receipt-form');
  const clearMathWarning = () => {
    receiptForm.querySelector('#math-warning').innerHTML = '';
  };
  receiptForm.addEventListener('input', (event) => {
    if (event.target.id !== 'ack-math') clearMathWarning();
  });
  let items = r.items || [];
  function drawItems() {
    document.querySelector('#items-body').innerHTML = items
      .map(
        (it, i) =>
          `<tr data-item="${i}"><td><input name="item_name" value="${esc(it.name)}" placeholder="Item name" required aria-label="Item name"><input name="product_code" value="${esc(it.product_code || '')}" placeholder="SKU (optional)" aria-label="Product code" style="margin-top:4px"></td><td><input name="quantity" value="${it.quantity ?? 1}" type="number" min="0.01" step="0.01" required aria-label="Quantity"></td><td><input name="unit_price" value="${it.unit_price ?? 0}" type="number" min="0" step="0.01" required aria-label="Unit price"></td><td><input name="item_discount" value="${it.discount ?? 0}" type="number" min="0" step="0.01" aria-label="Item discount"></td><td><input name="item_total" value="${it.total ?? 0}" type="number" min="0" step="0.01" required aria-label="Item total"></td><td><button type="button" data-remove="${i}" class="ghost icon-btn" aria-label="Remove item">${icon('close')}</button></td></tr>`,
      )
      .join('');
    document.querySelectorAll('[data-remove]').forEach(
      (b) =>
        (b.onclick = () => {
          readItems();
          items.splice(Number(b.dataset.remove), 1);
          clearMathWarning();
          drawItems();
        }),
    );
  }
  function readItems() {
    items = [...document.querySelectorAll('[data-item]')].map((tr) => ({
      name: tr.querySelector('[name=item_name]').value,
      product_code: tr.querySelector('[name=product_code]').value,
      discount: Number(tr.querySelector('[name=item_discount]').value),
      quantity: Number(tr.querySelector('[name=quantity]').value),
      unit_price: Number(tr.querySelector('[name=unit_price]').value),
      total: Number(tr.querySelector('[name=item_total]').value),
    }));
  }
  drawItems();
  document.querySelector('#add-item').onclick = () => {
    readItems();
    items.push({ name: '', quantity: 1, unit_price: 0, total: 0 });
    clearMathWarning();
    drawItems();
  };
  document.querySelector('#rescan')?.addEventListener('click', () => {
    closeModal();
    navigate('scan');
  });
  document.querySelector('#receipt-form').onsubmit = async (e) => {
    e.preventDefault();
    readItems();
    const form = e.target,
      data = Object.fromEntries(new FormData(form));
    delete data.item_name;
    delete data.quantity;
    delete data.unit_price;
    delete data.item_total;
    delete data.product_code;
    delete data.item_discount;
    for (const k of [
      'total',
      'subtotal',
      'tax',
      'discount',
      'service_charge',
      'other_charges',
      'amount_paid',
      'change',
      'vatable_sales',
      'vat_exempt',
      'zero_rated',
    ])
      data[k] = data[k] === '' ? null : Number(data[k]);
    data.merchant = data.merchant.trim();
    if (!data.merchant || items.some((item) => !item.name.trim())) {
      form.querySelector('#form-error').textContent = 'Enter a merchant and a name for every item.';
      return;
    }
    data.items = items;
    data.image = r.image || null;
    data.card_checked = r.card_checked || false;
    data.original_image = r.original_image || null;
    const issues = validateMath(data);
    const warning = document.querySelector('#math-warning');
    if (issues.length && !document.querySelector('#ack-math')?.checked) {
      warning.innerHTML = `<div class="notice warning">${issues.map(esc).join('<br>')}<label style="display:flex;gap:8px;margin-top:10px"><input id="ack-math" type="checkbox" style="width:auto"> I checked these values against the receipt.</label></div>`;
      return;
    }
    const save = form.querySelector('[type=submit]');
    save.disabled = true;
    try {
      data.verified_mismatch = !!issues.length;
      if (state.demo) {
        data.id = r.id || crypto.randomUUID();
        const idx = state.receipts.findIndex((v) => v.id === data.id);
        if (idx >= 0) state.receipts[idx] = data;
        else state.receipts.unshift(data);
      } else {
        const result = await api(
          r.id ? '/receipts/' + r.id : '/receipts',
          r.id ? 'PUT' : 'POST',
          data,
        );
        state.receipts = state.receipts.filter((v) => v.id !== result.receipt.id);
        state.receipts.unshift(result.receipt);
      }
      state.image = null;
      state.original = null;
      closeModal();
      render();
      toast(
        state.demo
          ? 'Saved to the temporary demo workspace.'
          : 'Receipt saved. A little more organized.',
      );
    } catch (err) {
      if (form.isConnected) form.querySelector('#form-error').textContent = err.message;
      else toast(err.message);
      save.disabled = false;
    }
  };
}
function validateMath(r) {
  const warnings = [];
  if (
    r.items.length &&
    r.items.some((i) => Math.abs(i.quantity * i.unit_price - (i.discount || 0) - i.total) > 0.02)
  )
    warnings.push('An item quantity × unit price does not match its total.');
  if (r.items.length && r.subtotal != null && Math.abs(sum(r.items) - r.subtotal) > 0.02)
    warnings.push('Item totals do not match the subtotal.');
  if (
    r.subtotal != null &&
    Math.abs(
      r.subtotal +
        (r.tax || 0) +
        (r.service_charge || 0) +
        (r.other_charges || 0) -
        (r.discount || 0) -
        r.total,
    ) > 0.02
  )
    warnings.push(
      'Subtotal + tax + charges − discounts does not match the total. VAT may already be included; check the receipt.',
    );
  return warnings;
}
function viewReceipt(r) {
  if (!r) return;
  showModal(
    esc(r.merchant),
    `<p>${dateLabel(r.date)} ${esc(r.time || '')} · ${esc(r.category)}</p>${r.image ? `<div class="image-stage" style="min-height:180px;margin-bottom:20px"><img src="${r.image.startsWith('data:image/') ? r.image : esc(r.image)}" alt="Receipt from ${esc(r.merchant)}"></div>` : '<div class="notice">No receipt image attached.</div>'}<div class="form-grid"><div><p class="panel-caption">Total</p><h2>${money(r.total, r.currency)}</h2></div><div><p class="panel-caption">Payment</p><h3 style="margin-top:8px">${esc(r.payment_method)}</h3></div><div><p class="panel-caption">Receipt number</p><p>${esc(r.receipt_number || '—')}</p></div><div><p class="panel-caption">Merchant address</p><p>${esc(r.address || '—')}</p></div></div>${r.items?.length ? `<div class="table-wrap"><table><thead><tr><th>Item</th><th>Qty</th><th>Unit price</th><th>Total</th></tr></thead><tbody>${r.items.map((i) => `<tr><td>${esc(i.name)}</td><td>${i.quantity}</td><td>${money(i.unit_price, r.currency)}</td><td>${money(i.total, r.currency)}</td></tr>`).join('')}</tbody></table></div>` : ''}<div style="padding:18px 0">${[
      ['Subtotal', r.subtotal],
      ['VAT / Tax', r.tax],
      ['Discount', r.discount],
      ['Service charge', r.service_charge],
      ['Other charges', r.other_charges],
    ]
      .filter(([, v]) => v != null)
      .map(
        ([k, v]) =>
          `<p style="display:flex;justify-content:space-between;margin:5px 0"><span>${k}</span><strong>${money(v, r.currency)}</strong></p>`,
      )
      .join(
        '',
      )}</div>${r.notes ? `<p>${esc(r.notes)}</p>` : ''}<div class="form-actions" style="flex-wrap:wrap"><button class="danger" id="delete-receipt">${icon('trash')} Delete</button>${r.original_image || r.image ? '<button id="view-original">View Original</button>' : ''}<button id="export-receipt">${icon('export')} Export</button><button class="primary" id="edit-receipt">${icon('edit')} Edit</button></div>`,
  );
  document.querySelector('#edit-receipt').onclick = () => editReceipt(r);
  document.querySelector('#export-receipt').onclick = () => exportDialog([r]);
  document
    .querySelector('#view-original')
    ?.addEventListener('click', () =>
      showModal(
        'Original receipt',
        `<div class="image-stage"><img src="${esc(r.original_image || r.image)}" alt="Original receipt"></div><p>Payment card details are redacted when detected.</p>`,
      ),
    );
  document.querySelector('#delete-receipt').onclick = () => {
    showModal(
      'Delete this receipt?',
      `<p>${esc(r.merchant)} · ${money(r.total, r.currency)}</p><p>The receipt and its associated images will be permanently deleted.</p><div class="form-actions"><button data-close>Keep receipt</button><button class="danger" id="confirm-delete">Delete permanently</button></div>`,
      true,
    );
    document.querySelector('#confirm-delete').onclick = async () => {
      try {
        if (!state.demo) await api('/receipts/' + r.id, 'DELETE');
        state.receipts = state.receipts.filter((v) => v.id !== r.id);
        closeModal();
        render();
        toast('Receipt deleted.');
      } catch (e) {
        toast(e.message);
      }
    };
  };
}
