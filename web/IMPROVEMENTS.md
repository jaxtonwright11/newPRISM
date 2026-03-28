# PRISM Improvements Backlog

Prioritized list of improvements identified during the March 28, 2026 session.

## High Priority

- [ ] **Verify Anthropic API key** — Key was reconstructed from garbled paste with Cyrillic characters. Test by clicking "Suggest with AI" in admin panel. If it fails, re-paste the key from the Anthropic dashboard.
- [ ] **Add GitHub Secrets for CI** — The E2E tests in CI need `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, and `NEXT_PUBLIC_MAPBOX_TOKEN` added as repository secrets.
- [ ] **Soft-delete for account deletion** — Current implementation is hard delete. Consider a 30-day grace period where accounts are deactivated before permanent deletion.
- [ ] **Rate limit AI suggestion endpoints** — The `/api/admin/ai/*` routes have auth protection but no rate limiting to prevent runaway API costs.

## Medium Priority

- [ ] **Map: cluster pins at low zoom** — When many communities are close together, pins overlap. Implement Mapbox cluster layers.
- [ ] **Weekly digest cron job** — The `POST /api/admin/digest` endpoint exists but isn't wired to a cron schedule yet. Add to `vercel.json` crons.
- [ ] **PostHog user identification** — `identifyUser()` is exported but not called after login. Wire it into the auth flow to link anonymous events to authenticated users.
- [ ] **E2E authenticated tests** — Current smoke tests only check unauthenticated flows. Add tests that sign in and verify feed content, post creation, and settings.
- [ ] **Bundle size monitoring** — Add `@next/bundle-analyzer` to track bundle size changes over time.

## Low Priority

- [ ] **Map lazy-load CSS** — `mapbox-gl/dist/mapbox-gl.css` is still imported at component level. Could be moved to a `<link>` tag that loads with the dynamic chunk.
- [ ] **Playwright visual regression** — Add screenshot comparison tests for key pages to catch unintended visual changes.
- [ ] **PostHog session recording** — Enable session replay for debugging user issues (requires PostHog plan check).
- [ ] **Error boundary telemetry** — Wire React error boundaries to PostHog so client-side crashes are tracked.
