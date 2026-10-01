# Tally mobile release

The repository contains native Android and iOS projects built with Capacitor, native camera/photo selection, native export sharing, bundled OCR code, platform icons, and account deletion. These are real native project sources, not store listings. No developer account, signing identity, public API, or store submission has been created.

## Current build modes

- **Preview:** temporary sample workspace, no hosted service. Changes disappear when the process restarts. Do not use for personal financial records. Android debug uses `com.rjems995.tally.preview`, separate from the release app. It can be installed directly for testing but is not a Play Store release.
- **Release:** requires an HTTPS backend origin at build time. Account data stays on that private backend. Release building rejects a missing/invalid backend, and both native projects refuse to package preview assets as a release.

## Develop and build

Install Node 22+ (24 LTS recommended), Java 21, and Android SDK API 36 / build tools 36.0.0. iOS requires macOS and a compatible Xcode 26+ installation. Windows cannot produce or sign an iOS archive locally.

```powershell
npm ci
npm run mobile:preview
npm run mobile:sync
./scripts/build-android.ps1
```

On this Windows workspace, local build tools are in `.tools/`, excluded from Git. `scripts/install-node.ps1` and `scripts/install-android-tools.py` install/checksum-verify build tools without changing system settings. Add the printed Node folder to the current PowerShell `Path` before using `npm`.

The Android preview output is `releases/Tally-preview.apk`. Transfer that file to an Android device, open it, and permit installation from that specific source when Android asks. Restore the installation permission afterward if you do not need it. Preview builds are debug-signed and use temporary demo data.

To rebuild with an actual backend:

```powershell
$env:TALLY_API_ORIGIN = 'https://YOUR-DEPLOYED-TALLY-SERVER'
npm run mobile:build
npm run mobile:sync
```

The value is a public origin, not a secret, and is compiled into the app. The native API uses Capacitor's HTTP stack and its native cookie handling with the same server sessions/CSRF tokens. Browser CORS and cookie protections have not been weakened. Native cookie persistence, permission denial, camera restoration, and sharing must be verified on physical Android and iPhone devices before submission.

`com.rjems995.tally` is the proposed store application/bundle ID. Confirm that you want to own and keep it **before the first upload**, then register it in your developer accounts. Changing it after release creates a different app.

## Google Play

1. Create and verify a Google Play Console developer account.
2. Host the backend over HTTPS, configure email reset delivery, operator/support contact, backup retention, and publish privacy/deletion pages.
3. Create an upload key in Android Studio; store it and passwords outside Git. Enable Play App Signing.
4. Set `TALLY_KEYSTORE_PATH`, `TALLY_KEYSTORE_PASSWORD`, `TALLY_KEY_ALIAS`, and `TALLY_KEY_PASSWORD` in the build environment. Run `scripts/build-android.ps1 -Release` after a production mobile build/sync.
5. Upload the signed AAB to an internal test track, fill out Data safety, app access instructions/reviewer credentials, content rating, financial-features declarations where applicable, screenshots, and listing text. Follow the testing requirements shown in your own Console account before requesting production access.
6. Supply an externally accessible deletion URL in addition to in-app deletion. Tally's Profile → Delete account already deletes the active account database records after password confirmation. The web deletion page directs users to that flow.

The manual **Build signed Google Play bundle** workflow prepares a signed artifact; it does not publish. Configure the `mobile-production` GitHub environment, the `TALLY_API_ORIGIN` variable, and these secrets: `TALLY_KEYSTORE_BASE64`, `TALLY_KEYSTORE_PASSWORD`, `TALLY_KEY_ALIAS`, `TALLY_KEY_PASSWORD`. Never paste signing credentials into a chat or commit them.

## Apple App Store

1. Enroll in the Apple Developer Program and register the bundle ID.
2. On a Mac, run `npm ci`, build production assets, and run `npm run mobile:sync`.
3. Open `mobile/ios/App/App.xcodeproj` in Xcode. Select your developer team under Signing & Capabilities and let Xcode manage signing. Confirm the bundle ID and increment marketing/build versions for each upload.
4. Verify the camera/photo purpose strings, `PrivacyInfo.xcprivacy` resource, actual collected-data declarations, and export-compliance answers against the final backend and dependencies.
5. Test on an iPhone, archive for a generic iOS device, then Distribute App → App Store Connect. Use TestFlight before submitting for review.
6. Complete privacy labels, policy/support URLs, screenshots, app access/reviewer credentials, and listing metadata. Review approval is not guaranteed.

The manual **Build mobile previews** workflow includes an unsigned iOS **simulator** build on a macOS runner. A simulator `.app` cannot be installed on an iPhone. Device installation needs Apple signing through Xcode/TestFlight; it is not an APK-style file download.

## Proposed store copy

**Name:** Tally — Receipt & Expense Tracker

**Short description:** Scan receipts, review the details, and understand your everyday spending.

**Description:** Turn paper receipts into searchable expenses. Take a photo or choose an image, let on-device OCR read the text, review the merchant and amounts, and save it to your private account. Explore spending by category and merchant, add expenses manually, and share CSV, Excel, or PDF reports. Supports Philippine receipt fields and multiple currencies. OCR can make mistakes, so you always review before saving. An internet connection is required for account storage and the first OCR language download.

Do not claim offline account saving, bank integration, generative-AI classification, or automatic financial advice. They are not implemented.

## Before public release

The backend is currently the local Python server from the prototype. Provide a production HTTPS deployment, monitoring, operational backups/retention, and independently verified server-side image/card screening before opening it to untrusted clients. Client OCR card checks do not enforce a server-side privacy boundary. Fill in the actual operator/support contact and retention policy in the privacy disclosure. The mobile shell does not remove those backend limitations.

Validate on real devices: camera and gallery, crop/rotate, bundled OCR and first-use language download, account creation/login, session persistence after force-close, password reset, account deletion, sharing all three export formats, large receipts, airplane-mode errors, Android back navigation, iPhone notches/home indicator, and accessibility text sizing. Current browser tests cannot certify native hardware behavior.

## References

- [Capacitor environment requirements](https://capacitorjs.com/docs/getting-started/environment-setup)
- [Capacitor camera permissions](https://capacitorjs.com/docs/apis/camera)
- [Apple App Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- [Google Play account deletion requirements](https://support.google.com/googleplay/android-developer/answer/13327111)
