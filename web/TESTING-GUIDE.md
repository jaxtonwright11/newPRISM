# PRISM Testing Guide

## Quick Commands

```bash
# Unit tests (Vitest)
npm test

# E2E smoke tests (Playwright)
npm run test:e2e

# E2E with browser visible
npm run test:e2e:headed

# Type check
npx tsc --noEmit

# Lint
npm run lint
```

## Test Structure

```
web/
  tests/
    smoke.spec.ts     # Playwright E2E smoke tests (10 tests)
    screenshots/      # Screenshots captured during tests
  src/
    lib/
      api.test.ts     # Unit tests (Vitest)
```

## E2E Smoke Tests

Located in `tests/smoke.spec.ts`. These verify every major page loads without errors:

| Test | What it checks |
|------|---------------|
| Homepage loads | Status < 400, no critical console errors, screenshot |
| Health endpoint | `GET /api/health` returns `{ status: "healthy" }` |
| Login page | Loads with "Sign in to PRISM" text |
| Signup page | Loads with "Join PRISM" text |
| Feed page | Loads without error |
| Discover page | Loads with "Discover" heading |
| Landing page | Loads with "PRISM" heading |
| Admin page | Loads without 500 error |
| Create page | Loads with content |
| Profile page | Handles unauthenticated access |

## Running E2E Tests

The Playwright config (`playwright.config.ts`) automatically starts `npm run dev` if no server is running. To test against an already-running server:

```bash
# Start dev server in one terminal
npm run dev

# Run tests in another (reuses existing server)
npm run test:e2e
```

To test against a deployed URL:

```bash
PLAYWRIGHT_BASE_URL=https://your-app.vercel.app npm run test:e2e
```

## CI Pipeline

GitHub Actions runs on every push to `main` and on PRs. Four jobs:

1. **Lint & Type Check** — `tsc --noEmit` + `next lint`
2. **Unit Tests** — Vitest
3. **E2E Smoke Tests** — Playwright with Chromium
4. **Production Build** — Verifies `next build` succeeds

Required GitHub Secrets for E2E:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_MAPBOX_TOKEN`

## Adding New Tests

### E2E test for a new page

```typescript
test("my new page loads", async ({ page }) => {
  const response = await page.goto("/my-page");
  expect(response?.status()).toBeLessThan(400);
  await expect(page.getByRole("heading", { name: "My Page" })).toBeVisible();
});
```

### Unit test

Add to `src/lib/*.test.ts` and run with `npm test`.

## Console Error Filtering

The homepage smoke test filters these known non-critical errors:
- PostHog analytics loading failures
- Resource loading failures (CDN issues)
- Third-party script errors
- React hydration warnings
- MIME type warnings (dev server only)
