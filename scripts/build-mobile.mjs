import { build } from 'esbuild';
import { cp, mkdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const out = resolve(root, 'mobile/www');
const preview = process.argv.includes('--preview');
let origin = process.env.TALLY_API_ORIGIN || '';
if (!preview || origin) {
  let url;
  try {
    url = new URL(origin);
  } catch {
    throw Error(
      'Set TALLY_API_ORIGIN to your deployed HTTPS backend origin, or use mobile:preview for a temporary demo.',
    );
  }
  if (
    url.protocol !== 'https:' ||
    url.username ||
    url.password ||
    url.pathname !== '/' ||
    url.search ||
    url.hash ||
    /(^localhost$|\.localhost$|\.example$|^127\.|^0\.)/.test(url.hostname)
  ) {
    throw Error(
      'TALLY_API_ORIGIN must be a public HTTPS origin without credentials, paths, or query parameters.',
    );
  }
  origin = url.origin;
}
await mkdir(out, { recursive: true });
for (const name of ['app.js', 'services.js', 'styles.css'])
  await cp(resolve(root, name), resolve(out, name));
await mkdir(resolve(out, 'assets'), { recursive: true });
for (const name of ['tally-mark.png', 'tally-wordmark.png', 'favicon.png'])
  await cp(resolve(root, 'assets', name), resolve(out, 'assets', name));
let html = await readFile(resolve(root, 'index.html'), 'utf8');
html = html.replace(
  'width=device-width,initial-scale=1',
  'width=device-width,initial-scale=1,viewport-fit=cover',
);
html = html.replace(
  '<script defer src="app.js"></script>',
  '<script defer src="native.js"></script>\n    <script defer src="app.js"></script>',
);
const csp = `default-src 'self'; script-src 'self' 'wasm-unsafe-eval' https://cdn.sheetjs.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: blob: capacitor: https://localhost; connect-src 'self' ${origin} https://cdn.jsdelivr.net https://tessdata.projectnaptha.com https://cdn.sheetjs.com; worker-src 'self' blob:; object-src 'none'; base-uri 'self'`;
html = html.replace(
  '<meta charset="utf-8" />',
  `<meta charset="utf-8" />\n    <meta http-equiv="Content-Security-Policy" content="${csp}" />`,
);
await writeFile(resolve(out, 'index.html'), html);
await build({
  entryPoints: [resolve(root, 'mobile/src/native.js')],
  outfile: resolve(out, 'native.js'),
  bundle: true,
  format: 'iife',
  target: ['chrome100', 'safari15'],
  define: {
    __TALLY_API_ORIGIN__: JSON.stringify(origin),
    __TALLY_PREVIEW__: JSON.stringify(preview),
  },
});
// Bundle OCR executable code with the app; only trained language data is fetched on first use.
await mkdir(resolve(out, 'vendor'), { recursive: true });
await cp(
  resolve(root, 'node_modules/tesseract.js/dist/tesseract.min.js'),
  resolve(out, 'vendor/tesseract.min.js'),
);
await cp(
  resolve(root, 'node_modules/tesseract.js/dist/worker.min.js'),
  resolve(out, 'vendor/worker.min.js'),
);
await cp(resolve(root, 'node_modules/tesseract.js-core'), resolve(out, 'vendor/tesseract-core'), {
  recursive: true,
});
await writeFile(
  resolve(out, 'build-info.json'),
  JSON.stringify({ preview, apiOrigin: origin, version: '1.0.0' }, null, 2),
);
console.log(`Built Tally ${preview ? 'PREVIEW (temporary demo)' : 'mobile'} assets in ${out}`);
