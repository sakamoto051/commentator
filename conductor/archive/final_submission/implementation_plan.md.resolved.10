# Implementation Plan - Privacy Policy & Hosting Options

Establish a clear Privacy Policy and ensure it is accessible via either GitHub Pages or AWS S3 to comply with Chrome Web Store requirements.

## Proposed Changes

### Documentation

#### [MODIFY] [lp/privacy.html](file:///home/sakamoto/apps/commentator/lp/privacy.html)
Ensure the policy content is finalized.

### Hosting Options

#### Option A: GitHub Pages (Current)
- URL: `https://sakamoto051.github.io/commentator/privacy.html`
- Config: Deploy via `gh-pages` branch or root `master`.

#### Option B: AWS S3 (Alternative)
- URL Pattern: `http://<bucket-name>.s3-website-<region>.amazonaws.com/privacy.html`
- Setup:
  1. Create S3 Bucket (e.g., `commentator-policy`).
  2. Disable "Block all public access".
  3. Enable "Static website hosting".
  4. Upload `lp/` content to the bucket.
  5. (Optional) Use CloudFront for HTTPS.

### Extension UI

#### [MODIFY] [client/src/main.tsx](file:///home/sakamoto/apps/commentator/client/src/main.tsx)
The Privacy Policy URL in the extension popup must match the chosen hosting option.

## Verification Plan

### Manual Verification
- Verify the chosen URL is accessible.
- Ensure the extension popup correctly links to the final URL.
