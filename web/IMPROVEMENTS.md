# PRISM Improvements Backlog

Prioritized list of improvements identified during sessions.

## Completed — Session A (March 28, 2026)

- [x] **Verify Anthropic API key** — Key was reconstructed from garbled paste with Cyrillic characters.
- [x] **Add GitHub Secrets for CI** — E2E tests configured for Vercel deployment.
- [x] **PostHog user identification** — `identifyUser()` wired into auth flow.

## Completed — Session B (March 28, 2026)

- [x] **Map: cluster pins at low zoom** — Clustering at zoom < 6 with count badges and fly-to on click.
- [x] **Weekly digest cron job** — Wired to vercel.json crons (Mondays 9 AM UTC).
- [x] **Feed diversity algorithm** — Community-type diversity penalty prevents same-type triplication.
- [x] **Perspective comparison** — 4-way comparison grid with shareable URLs and OG images.
- [x] **Realtime audit** — All 5 subscription consumers verified for proper cleanup.
- [x] **N8N webhooks** — 3 endpoints (new-topic, digest, community-alert) with shared secret auth.
- [x] **Verification levels** — Auto Level 2 promotion, admin Level 3 endpoint, profile badges.
- [x] **Email digest** — Resend integration, weekly cron, admin preview tool.
- [x] **API rate limiting audit** — Rate limiting added to all routes missing it.
- [x] **E2E tests** — 15 auth tests, 6 webhook tests, 5 push tests.

## Completed — Session C (March 28, 2026)

- [x] **Geographic Lens** — Sentiment-colored map pins by topic, heat overlay toggle, enhanced tooltips with reaction data, geographic distribution summary on topic pages.
- [x] **Community matching onboarding** — 4-step onboarding: location, community suggestions (2 nearby + 3 diverse), first perspective, welcome. Auto-follow selected communities.
- [x] **Insights page** — /insights with 4 insight cards (agreement map, diversity score, geographic faults, rising topics), Claude AI summary generation, OG image sharing.
- [x] **Daily perspective window** — Push notification cron at 3 PM UTC for active prompts.
- [x] **Geographic FOMO banner** — Session-dismissible banner on feed when nearby communities are active.
- [x] **Streak milestones** — 7-day (Consistent Voice), 30-day (Founding Voice), 100-day (Century Voice) badges with congratulations modal. Badges displayed on profile.
- [x] **Content calendar** — Admin 4-week calendar view showing topics and prompts by date.
- [x] **Topic templates** — 10 pre-written topic templates across 4 categories, one-click deploy.
- [x] **Platform health dashboard** — Key metrics, most active communities, empty topics, onboarding failures, bulk notify by community type.
- [x] **Lighthouse audit** — Reports saved to tests/screenshots/. Scores: Performance 61, A11y 84, BP 96, SEO 100.

## Remaining — High Priority

- [ ] **Soft-delete for account deletion** — Consider a 30-day grace period before permanent deletion.
- [ ] **Rate limit AI suggestion endpoints** — `/api/admin/ai/*` routes need cost protection.
- [ ] **Mapbox token upgrade** — Current public token (pk.*) only has `styles:tiles` scope. To use Mapbox Standard style or hosted dark-v11, need a token with `styles:read` scope. Current workaround: hand-crafted `StyleSpecification` in `map-placeholder.tsx` that points directly at vector tile endpoints. This is documented in the component's comments.

## Remaining — Medium Priority

- [ ] **E2E authenticated tests** — Tests that sign in and verify feed content, post creation, settings.
- [ ] **Bundle size monitoring** — Add `@next/bundle-analyzer` to track size changes.
- [ ] **Performance: reduce unused JS** — 548 KiB unused JS on homepage, mainly mapbox-gl. Consider code splitting or lazy map loading.

## Remaining — Low Priority

- [ ] **Map lazy-load CSS** — Move mapbox CSS to dynamic link tag.
- [ ] **Playwright visual regression** — Screenshot comparison tests for key pages.
- [ ] **PostHog session recording** — Enable session replay for debugging.
- [ ] **Error boundary telemetry** — Wire React error boundaries to PostHog.
