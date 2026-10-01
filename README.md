# Tally

Tally turns receipt photos into organized, searchable expenses. Scan a receipt, review the extracted details, categorize the expense, and track your spending through dashboards and exports.

The project includes a browser app with a Python/SQLite backend and native Android and iOS projects built with Capacitor.

## Current status

| Platform | Available now                                             | Data storage                                                    |
| -------- | --------------------------------------------------------- | --------------------------------------------------------------- |
| Web      | Local app with accounts, scanning, analytics, and exports | Account receipts persist in SQLite; demo changes stay in memory |
| Android  | Installable **Tally Preview** APK                         | Temporary demo data; no hosted account service is connected     |
| iOS      | Xcode project and simulator build workflow                | Requires a configured backend and Apple signing for device use  |

**Tally is not published on Google Play or the Apple App Store.** Preview changes disappear when the app process restarts; the Android preview is for testing, not persistent expense storage.

## Try the Android preview

After building, find the APK at:

```text
releases/Tally-preview.apk
```

1. Transfer the APK from your computer to your Android phone using USB or Google Drive.
2. If using Drive, download the APK onto the phone.
3. Open it from **Files → Downloads**, allow installation from that source if prompted, and tap **Install**.
4. Open **Tally Preview**, then tap **Scan Receipt** to take a photo or choose an existing image.
5. Review the extracted fields before saving to the temporary workspace.

An internet connection is needed for the first OCR language download. The APK is Android-only and cannot be installed on an iPhone.

Build artifacts in `releases/` are excluded from Git. Cloning this repository does not download an APK; build it using the instructions below or obtain a separately shared preview file.

## Run the web app

Requires **Python 3.10+**. The web app uses Python's standard library and needs no package installation or frontend build.

```powershell
python server.py
```

Open **http://localhost:8080**. On Windows, you can also run `./start.ps1` in PowerShell.

You can also open `index.html` directly to explore the demo; account functions require the server. Demo changes are held in memory and disappear on refresh. Create an account from Profile for persistent private storage. There are no default credentials.

`localhost` refers to the device running the server. It is not a public address that the installed mobile app can use to reach your computer.

## Features

- Responsive dashboard, category breakdown, time-series charts, merchant analytics, light/dark mode, and mobile navigation.
- Camera capture on supported devices, drag/drop uploads, image rotation, drag-to-crop, brightness and contrast controls.
- Browser-local Tesseract OCR, structured Philippine receipt parsing, merchant/item categorization, and per-account remembered category corrections.
- Editable receipt review, line items, merchant/transaction fields, multiple currencies, uncertainty highlights, and acknowledged arithmetic discrepancies.
- Manual expenses, searchable/sortable/filterable history, detail view, editing, deletion, CSV, and real XLSX exports. The web app uses print-to-PDF; the native app generates PDF files and opens the device's share sheet.
- Native camera and photo selection, app icons, Android back navigation, and mobile safe-area layouts.
- Signup, login, logout, password changes, SMTP password resets, and password-confirmed account deletion. Account features require a connected backend.
- User isolation, server validation, CSRF protection, password hashing, HTTP-only sessions, and request throttling.
- SQLite tables for users, receipts, receipt items, categories, corrections, sessions, and reset tokens. Images live inside private receipt records, never public URLs.

## Processing architecture

`Image → canvas preprocessing → Tesseract OCR → structured parser → category rules / saved correction → validation → user review → authenticated database`

Tesseract uses a trained OCR model. Categorization uses rules and saved user corrections; no generative AI provider is configured. Extracted fields are not guaranteed correct. Confidence hints combine receipt-pattern certainty with the OCR engine’s overall confidence; they are not calibrated per-field probabilities. Missing values stay empty. VAT-inclusive receipts can produce a math warning and require review rather than inventing an adjustment.

The web app loads OCR dependencies and language data from CDNs on first scan. The native app bundles the OCR executable code and downloads language data on first use. Receipt pixels are processed on the device, not submitted to an external OCR API. Saving a receipt to an account sends its details and eligible images to the Tally backend.

Google Fonts load remotely with local font fallbacks. Web demo XLSX export loads SheetJS; web account XLSX export is generated by the server. Native PDF and XLSX exports are generated locally and shared through the device's share sheet.

## Build the mobile apps

The mobile build uses **Node.js 22+**, **Java 21**, and **Android SDK API 36**. The local Android tool setup installs build tools 36.0.0; Gradle may install additional required SDK components. The iOS project must be built and signed with a compatible Xcode installation on macOS.

### Android preview

With the build tools installed and Node/npm on your `PATH`:

```powershell
npm ci
npm run mobile:preview
npm run mobile:sync
./scripts/build-android.ps1
```

The Windows build script writes `releases/Tally-preview.apk`. It uses the workspace-local SDK configuration when `.tools/android-env.json` exists; otherwise, configure `JAVA_HOME` and `ANDROID_HOME` for your installed tools.

Optional Windows setup scripts are provided in `scripts/install-node.ps1` and `scripts/install-android-tools.py`. They download checksum-verified tools into `.tools/`, which is excluded from Git. Add the Node folder printed by the setup script to your current `PATH` before running npm commands.

To open a native project:

```powershell
npm run mobile:android
# On macOS:
npm run mobile:ios
```

### Connect a hosted backend

Deploy the backend over HTTPS, then compile its public origin into the mobile app:

```powershell
$env:TALLY_API_ORIGIN = 'https://your-tally-server.example.com'
npm run mobile:build
npm run mobile:sync
```

Replace the example with your actual deployed server. Changing the backend address requires rebuilding the app. Release builds reject preview assets; signing credentials are configured separately.

### Store distribution

Google Play publication requires a developer account, a signed Android App Bundle, a hosted backend, and completed store information. iPhone distribution requires an Apple developer account and signing through Xcode/TestFlight. Neither store submission has been performed.

Two manually triggered GitHub Actions workflows are included:

- **Build mobile previews:** Android debug APK and an unsigned iOS simulator build. The simulator artifact cannot be installed on an iPhone.
- **Build signed Google Play bundle:** builds a signed AAB after the production backend and signing secrets are configured. It does not publish to Google Play.

See [mobile/STORE-RELEASE.md](mobile/STORE-RELEASE.md) for signing configuration, store preparation, and device-testing steps.

## Project layout

```text
app.js                  Dashboard, receipt views, forms, and navigation
services.js             OCR, parsing, accounts, and exports
styles.css              Responsive styles and themes
server.py               Authenticated API and SQLite storage
mobile/src/native.js    Native camera, API transport, and file sharing
mobile/android/         Android Studio project
mobile/ios/             Xcode project
scripts/                Mobile builds, tool setup, and icon generation
tests/                  Backend and browser integration checks
data/                   Local database and logs (not committed)
releases/               Generated installable artifacts (not committed)
```

## Privacy and limitations

- Card-like digit sequences in text are masked on the client and server. Scans containing card indicators and all card-payment records omit images to avoid retaining complete card numbers. Other scans retain a processed image and a normalized original, with metadata removed. Both images pass through OCR card-indicator screening. OCR can miss card information: review the image before saving. The image check is not a server-side OCR security boundary; deployment accepting untrusted API clients needs independent image/card screening.
- Receipt deletion removes the database record, image data, and child items. SQLite WAL pages and external backups may retain deleted bytes; this is logical deletion, not a forensic erasure guarantee.
- **Profile → Delete account** removes the account, receipts, images, items, category corrections, sessions, and reset tokens from the active database after password confirmation. The `/delete-account` web page explains the flow. Previously exported files remain wherever you saved or shared them.
- Native export files are staged in the app's cache and removed at the next launch.
- Currency totals are kept separate; no exchange-rate conversion is performed. Amount-based sorting of mixed-currency history compares nominal amounts.
- No paid AI service, cloud storage, external authentication service, or production deployment is provisioned.
- The development server binds to loopback. Public hosting needs a production TLS reverse proxy, restricted database filesystem access, encrypted disks/backups as appropriate, and an operational security review. Do not expose Python’s development HTTP server directly.

## Configuration

Environment variables (never commit credentials):

| Variable              | Default / purpose                                                   |
| --------------------- | ------------------------------------------------------------------- |
| `TALLY_HOST`          | `127.0.0.1`                                                         |
| `TALLY_PORT`          | `8080`                                                              |
| `TALLY_ORIGIN`        | `http://localhost:8080`; set HTTPS public origin behind a TLS proxy |
| `TALLY_DB`            | `data/tally.sqlite3`                                                |
| `TALLY_API_ORIGIN`    | Public HTTPS backend origin compiled into mobile release builds     |
| `TALLY_SMTP_HOST`     | Required for password reset email                                   |
| `TALLY_SMTP_PORT`     | `587`, with STARTTLS                                                |
| `TALLY_SMTP_FROM`     | Verified sender address                                             |
| `TALLY_SMTP_USER`     | SMTP username                                                       |
| `TALLY_SMTP_PASSWORD` | SMTP password                                                       |

Reset links expire in 30 minutes, are single-use, and revoke existing sessions. Until SMTP is configured, the app explicitly reports that reset email is unavailable.

## Tests

```powershell
python -m unittest discover -s tests -v
```

The tests use temporary databases and cover authentication, cross-account isolation, CSRF, validation, deletion, card masking, corrections, and XLSX output. Browser verification uses Playwright when installed and the local Chrome executable.

Browser test scripts are `tests/browser_check.py`, `tests/scan_account_check.py`, and `tests/mobile_bundle_check.py`. They require Playwright and Chrome; the scan tests also use Pillow to generate receipt fixtures. Their current Chrome setup is tailored to the development Windows machine. The dashboard test expects the web server on port 8080; the scan/account and mobile-bundle tests start their own test servers. Build the mobile preview assets before running the mobile-bundle test.

## Code formatting

The project configures the Prettier VS Code extension for JavaScript, HTML, CSS, JSON, and Markdown, with format on save enabled. After `npm ci`:

```powershell
npm run format
npm run format:check
```

OCR reference: [Tesseract.js documentation](https://github.com/naptha/tesseract.js).

Verified locally: nine backend tests passed, including account deletion; Chrome desktop/mobile checks passed without JavaScript errors; a generated receipt passed through real Tesseract OCR, editable review, authenticated storage, page reload, and XLSX download. The bundled mobile UI also passed camera-bridge dispatch, local OCR, review, PDF/XLSX generation, and preview-mode checks using a simulated native bridge. These integration tests do not replace physical Android/iPhone testing. The test scripts use temporary databases for account checks. Screenshots are saved under `test-results/` (excluded from version control).
