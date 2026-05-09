# Security

## Android Signing Keystore

### Background

In May 2026, a security review (T2 recon report) identified that an Android signing keystore had been committed to this repository's git history. The keystore (`android.keystore`) and several signed build artifacts (`*.apk`, `*.aab`, `*.idsig`) were tracked in git, which means any historical attacker who cloned the repository could sign Android packages that would impersonate The Secret Box app.

This was treated as a Critical issue.

### Remediation

On 2026-05-08 the following actions were taken:

1. **A new keystore was generated** with a fresh 2,048-bit RSA key pair, valid for 10,000 days, using a high-entropy password produced by `openssl rand -base64 32`.
2. **The new keystore lives outside the repository** at `~/.keystores/secret-box/android.keystore` (mode `600`, in a `700` directory). It is NOT tracked in git.
3. **The new keystore password is stored as a GitHub Actions secret** named `SECRETBOX_KEYSTORE_PASSWORD` on the `saggarsonny-boop/secret-box` repository.
4. **`twa-manifest.json` was updated** so the `signingKey.path` no longer points at an in-repo keystore. It now references `../.keystores/secret-box/android.keystore` relative to the project root.
5. **`.gitignore` was extended** to exclude `*.keystore`, `*.jks`, `*.aab`, `*.apk`, `*.idsig`, `.env*`, `.next`, `.DS_Store`, and `/app/build/`, so these artifacts can never be re-committed accidentally.
6. **Git history was rewritten** with `git filter-repo --invert-paths --path android.keystore --path app-release-bundle.aab --path app-release-signed.apk --path app-release-signed.apk.idsig --path app-release-unsigned-aligned.apk` to scrub the old keystore and all build artifacts from every commit. The rewritten branch was force-pushed to `origin/main`.
7. **Contributors must re-clone.** Because the history was rewritten, every existing clone of this repository is now invalid. Delete the local clone and `git clone https://github.com/saggarsonny-boop/secret-box.git` fresh. Do not `git pull` an old clone.

### New Keystore Identity

| Field | Value |
|---|---|
| Alias | `android` |
| Algorithm | RSA 2,048 |
| Validity | 10,000 days from 2026-05-08 |
| SHA-1 | `D6:FD:C0:88:88:93:03:B3:B3:71:BB:66:2B:8A:82:22:10:B1:69:E6` |
| SHA-256 | `5A:21:96:0E:99:87:34:FC:DA:00:46:CC:A0:C2:50:0F:67:E5:C2:E9:92:10:71:BA:17:ED:D8:4F:80:92:7B:BE` |

### Google Play App Signing

If The Secret Box (`com.thesecretbox.app`) is ever published to the Google Play Store under the OLD keystore, Play App Signing will not accept this rotated key without an explicit key-upgrade request. In that case:

1. Open the Play Console → App integrity → App signing.
2. Use **Request key upgrade for new installs** (or contact Google Play support if the app uses legacy app signing).
3. Provide both the old and new keystores and follow Google's verification flow.

As of 2026-05-08 the app does NOT appear to be live on Google Play (the published release surface is the PWA at https://secret-box-vert.vercel.app/). If a Play listing is later created, treat the rotation as a fresh signing-key submission rather than a rotation.

### Reporting a Vulnerability

Please report security issues privately to the repository owner via GitHub. Do not open public issues for security reports.
