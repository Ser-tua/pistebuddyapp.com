# pistebuddyapp.com — served on the `link` subdomain

This is the public static site behind PisteBuddy's Android App Links (`.well-known/assetlinks.json`) and the friend-invite share-link fallback page (`/add/`). It is a separate public repo from the app source (`Ser-tua/PisteBuddy`, private) because GitHub Pages on a private repo needs a paid plan, and `assetlinks.json` must be world-readable regardless.

**This site is served from `link.pistebuddyapp.com`, not the bare apex.** `pistebuddyapp.com` itself is Brad's existing, live Squarespace site (confirmed by DNS lookup and by fetching it — `Server: Squarespace`). Repointing the apex would have taken that site down, so this repo's `CNAME` file names the subdomain instead, and the apex's DNS is never touched by anything here.

**DNS Brad needs to add at the registrar — one record:**
- `CNAME` record: `link` → `ser-tua.github.io`

No `A` records, and nothing at `@` — the apex keeps whatever it already has for Squarespace.

**Before the store build:** `assetlinks.json` currently carries only the Android **debug** keystore's SHA-256 certificate fingerprint (`~/.android/debug.keystore`, alias `androiddebugkey`). The **release** signing certificate's fingerprint (from `eas credentials` once EAS Build is set up) must be added to the `sha256_cert_fingerprints` array before the store build, or App Links verification will fail on release-signed installs.
