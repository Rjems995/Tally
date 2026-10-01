import { Capacitor, CapacitorHttp } from '@capacitor/core';
import { App } from '@capacitor/app';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Directory, Filesystem } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { jsPDF } from 'jspdf';
import { zipSync, strToU8 } from 'fflate';

const isNative = Capacitor.isNativePlatform();
const origin = __TALLY_API_ORIGIN__;
const preview = __TALLY_PREVIEW__;
const base64ToBytes = (data) => Uint8Array.from(atob(data), (char) => char.charCodeAt(0));

async function request(path, options = {}, binary = false) {
  if (!origin)
    throw Error(
      'This preview uses temporary sample data. Account storage will be enabled when the hosted Tally service is configured.',
    );
  if (!path.startsWith('/api/')) throw Error('Invalid API path.');
  const response = await CapacitorHttp.request({
    url: origin + path,
    method: options.method || 'GET',
    headers: options.headers || {},
    data: options.body ? JSON.parse(options.body) : undefined,
    responseType: binary ? 'arraybuffer' : 'json',
    connectTimeout: 15000,
    readTimeout: 45000,
    disableRedirects: true,
  });
  if (response.status >= 300 && response.status < 400)
    throw Error('The Tally server address has changed. Please update the app.');
  const type =
    Object.entries(response.headers).find(([key]) => key.toLowerCase() === 'content-type')?.[1] ||
    'application/json';
  const data =
    binary && !type.includes('json') ? base64ToBytes(response.data) : JSON.stringify(response.data);
  return new Response(data, { status: response.status, headers: { 'Content-Type': type } });
}

async function receivePhoto(photo) {
  if (!photo?.webPath) throw Error('The photo could not be opened. Please try again.');
  const response = await fetch(photo.webPath);
  const blob = await response.blob();
  window.dispatchEvent(
    new CustomEvent('tally:photo', {
      detail: new File([blob], 'receipt.jpg', { type: blob.type || 'image/jpeg' }),
    }),
  );
}

async function takePhoto(fromGallery = false) {
  try {
    const photo = await Camera.getPhoto({
      quality: 90,
      width: 2400,
      height: 2400,
      resultType: CameraResultType.Uri,
      source: fromGallery ? CameraSource.Photos : CameraSource.Camera,
      correctOrientation: true,
      saveToGallery: false,
    });
    await receivePhoto(photo);
  } catch (error) {
    if (/cancel/i.test(error.message || '')) return;
    window.dispatchEvent(
      new CustomEvent('tally:error', {
        detail:
          error.message || 'Camera access failed. Check your device permissions and try again.',
      }),
    );
  }
}

async function shareFile(blob, filename) {
  const data = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(',')[1]);
    reader.onerror = () => reject(Error('Could not prepare the export.'));
    reader.readAsDataURL(blob);
  });
  const path = `tally-exports/${Date.now()}-${filename.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
  const file = await Filesystem.writeFile({
    path,
    data,
    directory: Directory.Cache,
    recursive: true,
  });
  // Keep the file until the next launch so the receiving app can finish copying it.
  await Share.share({
    title: 'Tally expense export',
    files: [file.uri],
    dialogTitle: 'Save or share your expenses',
  });
}

async function sharePdf(receipts) {
  const pdf = new jsPDF();
  pdf.setFontSize(20);
  pdf.text('Tally expense report', 15, 22);
  pdf.setFontSize(10);
  pdf.text(
    `${receipts.length} receipts · Exported ${new Date().toISOString().slice(0, 10)}`,
    15,
    32,
  );
  let y = 46;
  for (const r of receipts) {
    const lines = pdf.splitTextToSize(
      `${r.date}  |  ${r.merchant}\n${r.category}  |  ${r.payment_method}  |  Receipt ${r.receipt_number || '-'}\n${r.currency} ${Number(r.total).toFixed(2)}`,
      175,
    );
    if (y + lines.length * 5 > 280) {
      pdf.addPage();
      y = 20;
    }
    pdf.text(lines, 15, y);
    y += lines.length * 5 + 9;
  }
  await shareFile(pdf.output('blob'), 'tally-expenses.pdf');
}

async function shareXlsx(receipts) {
  const escape = (value) =>
    String(value ?? '')
      .replace(/[\x00-\x08\x0b\x0c\x0e-\x1f]/g, '')
      .replace(
        /[&<>"']/g,
        (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' })[char],
      );
  const rows = [
    ['Date', 'Merchant', 'Category', 'Receipt No.', 'Payment Method', 'Currency', 'Amount'],
    ...receipts.map((r) => [
      r.date,
      r.merchant,
      r.category,
      r.receipt_number,
      r.payment_method,
      r.currency,
      r.total,
    ]),
  ];
  const sheet =
    '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>' +
    rows
      .map(
        (row, i) =>
          `<row r="${i + 1}">` +
          row
            .map((value, j) => {
              const ref = `${String.fromCharCode(65 + j)}${i + 1}`;
              return typeof value === 'number'
                ? `<c r="${ref}"><v>${value}</v></c>`
                : `<c r="${ref}" t="inlineStr"><is><t xml:space="preserve">${escape(value)}</t></is></c>`;
            })
            .join('') +
          '</row>',
      )
      .join('') +
    '</sheetData></worksheet>';
  const files = {
    '[Content_Types].xml':
      '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/></Types>',
    '_rels/.rels':
      '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>',
    'xl/workbook.xml':
      '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Expenses" sheetId="1" r:id="rId1"/></sheets></workbook>',
    'xl/_rels/workbook.xml.rels':
      '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/></Relationships>',
    'xl/worksheets/sheet1.xml': sheet,
  };
  const bytes = zipSync(
    Object.fromEntries(Object.entries(files).map(([name, xml]) => [name, strToU8(xml)])),
  );
  await shareFile(
    new Blob([bytes], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    }),
    'tally-expenses.xlsx',
  );
}
window.TallyNative = {
  isNative,
  preview,
  configured: Boolean(origin),
  request,
  takePhoto,
  shareFile,
  sharePdf,
  shareXlsx,
};
if (isNative) {
  document.documentElement.classList.add('native-app');
  App.addListener('backButton', ({ canGoBack }) => {
    if (document.querySelector('.modal')) window.dispatchEvent(new CustomEvent('tally:back'));
    else if (canGoBack) window.history.back();
    else window.dispatchEvent(new CustomEvent('tally:back'));
  });
  App.addListener('appRestoredResult', async (result) => {
    if (result.pluginId === 'Camera' && result.success) {
      try {
        await receivePhoto(result.data);
      } catch (error) {
        window.dispatchEvent(new CustomEvent('tally:error', { detail: error.message }));
      }
    }
  });
  Filesystem.rmdir({ path: 'tally-exports', directory: Directory.Cache, recursive: true }).catch(
    () => {},
  );
}
