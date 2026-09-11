# pistebuddyapp.com

This is the public static site behind PisteBuddy's Android App Links (`.well-known/assetlinks.json`) and the friend-invite share-link fallback page (`/add/`). It is a separate public repo from the app source (`Ser-tua/PisteBuddy`, private) because GitHub Pages on a private repo needs a paid plan, and `assetlinks.json` must be world-readable regardless.

**Before the store build:** `assetlinks.json` currently carries only the Android **debug** keystore's SHA-256 certificate fingerprint (`~/.android/debug.keystore`, alias `androiddebugkey`). The **release** signing certificate's fingerprint (from `eas credentials` once EAS Build is set up) must be added to the `sha256_cert_fingerprints` array before the store build, or App Links verification will fail on release-signed installs.
