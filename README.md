# pistebuddyapp.com — served on the `link` subdomain

This is the public static site behind PisteBuddy's Android App Links (`.well-known/assetlinks.json`) and the friend-invite share-link fallback page (`/add/`). It is a separate public repo from the app source (`Ser-tua/PisteBuddy`, private) because GitHub Pages on a private repo needs a paid plan, and `assetlinks.json` must be world-readable regardless.

**This site is served from `link.pistebuddyapp.com`, not the bare apex.** `pistebuddyapp.com` itself is Brad's existing, live Squarespace site (confirmed by DNS lookup and by fetching it — `Server: Squarespace`). Repointing the apex would have taken that site down, so this repo's `CNAME` file names the subdomain instead, and the apex's DNS is never touched by anything here.

**DNS Brad needs to add at the registrar — one record:**
- `CNAME` record: `link` → `ser-tua.github.io`

No `A` records, and nothing at `@` — the apex keeps whatever it already has for Squarespace.

**Two fingerprints are listed today, and NEITHER is the release one:**

1. `6E:DF:CC:2E…` — this machine's Android **debug** keystore (`~/.android/debug.keystore`, alias `androiddebugkey`), i.e. a local `expo run:android` build.
2. `FA:C6:17:45…` — the **EAS-built dev client** installed on the test device, added 2026-09-23. Added because the two are not the same key, and the phone was running the EAS build: Android reported `link.pistebuddyapp.com: 1024` (STATE_DENIED) with the domain **Disabled**, so a shared invite link opened Chrome instead of the app. Everything else about the link worked — the share sheet, the token, this page, and the app's own parsing of the URL when it was handed one.

**Before the store build:** the **release** signing certificate's fingerprint (from `eas credentials`) must be added to the `sha256_cert_fingerprints` array, or App Links verification will fail on release-signed installs. Neither of the two above covers it.

**To re-check verification on a device after changing this file:**

```
adb shell pm set-app-links --package com.pistebuddy.app 0 all
adb shell pm verify-app-links --re-verify com.pistebuddy.app
adb shell dumpsys package d | grep -A 6 com.pistebuddy.app
```

`1024` is denied, `2` is verified. Android caches the result, so the re-verify is required — editing this file alone changes nothing on a phone that has already asked.
