# Implementation Plan - Real Screenshots with Playwright

Set up Playwright to capture actual screenshots of the "Commentator" landing page and service screens to replace generic AI-generated images with real application visuals.

## Proposed Changes

### Infrastructure

#### [NEW] [e2e/](file:///home/sakamoto/apps/commentator/e2e)
Create a new directory for Playwright end-to-end tests and screenshot scripts.

#### [NEW] [e2e/screenshots.spec.ts](file:///home/sakamoto/apps/commentator/e2e/screenshots.spec.ts)
Implement a Playwright script to:
- Capture the LP hero section.
- Capture the LP features section.
- Mock the Danmaku effect for a "real" screenshot of the flowing comments.

### Assets

#### [MODIFY] [lp/hero.png](file:///home/sakamoto/apps/commentator/lp/hero.png)
Replace the AI-generated hero image with a real screenshot captured via Playwright.

## Verification Plan

### Automated Tests
- Run `npx playwright test e2e/screenshots.spec.ts` to generate the images.

### Manual Verification
- Review the generated screenshots in the `lp/` and `client/public/` directories to ensure they look professional and realistic.
