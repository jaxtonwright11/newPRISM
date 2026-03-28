# CLAUDE.md — PRISM Master Build Document
# This file is the single source of truth for building PRISM.
# Read this entire file before writing a single line of code.
# When you finish every task in this document, start from the top and improve.
# There is always more to do. Never stop unless explicitly told to.
# Last updated: March 28, 2026

---

## CURRENT STATE (as of March 28, 2026)

### What's Built
- **Full platform**: Next.js 15 web app with Supabase backend, Mapbox maps, PostHog analytics
- **Core features**: Auth, communities, topics, perspectives, reactions, posts, stories, DMs, connections, notifications
- **Geographic Lens**: Sentiment-colored map pins per topic, heat overlay, rich tooltips with reaction data
- **Community matching onboarding**: 4-step flow — location, community suggestions (2 nearby + 3 diverse), first perspective, welcome
- **Insights page**: /insights with 4 insight cards (agreement map, diversity scores, geographic faults, rising topics), Claude AI summaries, OG image sharing
- **Retention mechanics**: Daily perspective push (3 PM UTC cron), geographic FOMO banner, streak milestones (7/30/100-day badges)
- **Content pipeline admin tools**: 4-week content calendar, 10 topic templates, platform health dashboard, bulk notify by community type
- **Email digest**: Resend integration, weekly Monday 9 AM UTC cron, admin preview
- **N8N webhooks**: 3 endpoints (new-topic, digest, community-alert) with shared secret auth
- **Verification levels**: Auto Level 2 promotion, admin Level 3 endpoint, profile badges
- **Map clustering**: Pins cluster at zoom < 6 with count badges, fly-to on click
- **Feed diversity**: Community-type diversity penalty prevents same-type triplication
- **Perspective comparison**: 4-way grid with shareable URLs and OG images
- **E2E tests**: 36 Playwright tests (15 auth, 6 webhook, 5 push, 10 general)

### What's Deployed
- **Production**: Vercel (auto-deploy from main branch)
- **Database**: Supabase project PRISM1 (bkmutmhahravmpfcpbvw)
- **Crons**: Weekly digest (Mon 9 AM UTC), daily prompt push (3 PM UTC)

### Credentials Needed
All in `/web/.env.local` (gitignored):
- `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase client
- `SUPABASE_SERVICE_ROLE_KEY` — admin operations
- `NEXT_PUBLIC_MAPBOX_TOKEN` — Mapbox GL JS
- `ANTHROPIC_API_KEY` — Claude AI for insight summaries
- `RESEND_API_KEY` — email digest
- `NEXT_PUBLIC_POSTHOG_KEY` + `NEXT_PUBLIC_POSTHOG_HOST` — analytics
- `VAPID_PUBLIC_KEY` + `VAPID_PRIVATE_KEY` — web push notifications
- `N8N_WEBHOOK_SECRET` — N8N webhook auth
- `CRON_SECRET` — Vercel cron auth

### Lighthouse Scores (Homepage)
Performance 61 | Accessibility 84 | Best Practices 96 | SEO 100

### Next Priorities
1. **Soft-delete for account deletion** — 30-day grace period before permanent deletion
2. **Rate limit AI suggestion endpoints** — `/api/admin/ai/*` routes need cost protection
3. **Reduce unused JS** — 548 KiB unused (mainly mapbox-gl), consider code splitting
4. **E2E authenticated tests** — tests that sign in and verify feed content, post creation
5. **Bundle size monitoring** — add `@next/bundle-analyzer`

---

## PRIME DIRECTIVE

You are the primary builder of PRISM. Jax is the founder and director.
Your job is to build, improve, test, and polish this platform continuously.

Rules that apply to every session:
- Read this entire file before starting any task
- Check the repo state (git log, open PRs, current build) before writing code
- Work through tasks in order but use subagents for parallel work when possible
- Commit after every completed task with a descriptive message
- Never stop silently — if you hit a blocker, document it and move to the next task
- After completing all listed tasks, start the CONTINUOUS IMPROVEMENT loop at the bottom
- ultrathink on any task that involves architecture, design, or user experience decisions

---

## WHAT PRISM IS

PRISM is a geographic community perspective platform.
It answers one question: why can't we understand each other?

The core experience: open the app, see a live map of the world lit up with
activity, tap a topic, and instantly see how five completely different communities
are experiencing the same event. A perspective from Chicago's South Side sits next
to one from Rural Appalachia, next to one from a Somali-Canadian neighborhood in
Toronto. Same event. Completely different worlds.

This does not exist anywhere. No app combines:
- Geographic visualization of community perspectives
- Multi-community viewpoint comparison on the same topic
- Personal social layer (posts, stories, connections) within community context
- Discover feed that explicitly surfaces viewpoints you've never encountered

PRISM is NOT:
- A news aggregator
- A debate platform
- A political tool
- A dashboard or analytics product
- A generic social media app

PRISM IS:
- A dark, alive, geographic social network
- A place where real people from real communities share real perspectives
- The most interesting feed you've ever opened
- Snap Maps meets editorial journalism meets community organizing

---

## THE AHA MOMENT — THE MOST IMPORTANT THING IN THE APP

The AHA moment is when a new user reads two perspectives from completely different
communities on the same event and thinks "I never knew people experienced this."

Every design and product decision should serve this moment.

The sequence:
1. Open app → map loads immediately, no signup gate, live pins glowing
2. One topic highlighted ACTIVE NOW
3. Single prompt: "Tap to see how communities are experiencing this"
4. Map filters, pins light up across geographies
5. Two perspective cards slide up — different communities, same topic
6. User reads both. AHA moment.
7. Soft, dismissable signup prompt: "Connect with these communities."

If this sequence ever breaks, fix it before anything else.

---

## DESIGN PHILOSOPHY — NON-NEGOTIABLE

PRISM must feel like the most interesting social app you've ever opened.
It must NOT look like a generic AI-built app.

Reference aesthetic: Snap Maps dark mode + Apple Maps smoothness + editorial weight
of a publication that takes ideas seriously.

### Colors (exact values — never deviate):
- Background primary: #0A0A0F
- Background secondary: #12121A
- Background elevated: #1A1A26
- Border: #2A2A3A
- Text primary: #F0F0F8
- Text secondary: #8888A8
- Text dim: #4A4A6A
- LIVE indicator: #FF3B3B
- Active/selected: #4A9EFF
- Verified badge: #4AE87A
- Heart/like: #FF6B8A
- Story ring gradient: #FF6B8A → #F59E0B

### Community type colors (pins and card borders):
- civic: #4A9EFF
- diaspora: #A855F7
- rural: #F59E0B
- policy: #10B981
- academic: #06B6D4
- cultural: #F97316

### Typography:
- Playfair Display Italic — ALL quote text, PRISM wordmark, perspective card quotes
- Inter or DM Sans — all UI, navigation, labels, body text
- JetBrains Mono — numbers, percentages, stats, radius labels

### Map rules (absolute — zero exceptions):
- NO text labels anywhere on the map
- NO teardrop markers — glowing dots ONLY
- Dark ocean: #0D1117, land: #161B22, borders barely visible
- Community pins: glowing dot 10px, two pulse rings, colored by community_type
- Personal pins: 6px, same color, no rings, soft drop shadow
- LIVE indicator: red dot top-right, slow pulse animation
- Map container: hard-clipped, 12px border radius

### What NOT to build:
- No white backgrounds anywhere
- No purple gradient hero sections
- No generic AI interface patterns
- No follower counts
- No dislike or downvote
- No color coding by political leaning
- No algorithmic engagement optimization on the Discover feed

---

## TECH STACK — NON-NEGOTIABLE

Web: Next.js 15, TypeScript strict mode, Tailwind CSS
Mobile: React Native + Expo SDK 50
Backend: Supabase (PostgreSQL, Auth, Realtime, Storage)
Maps: Mapbox GL JS (web) + Mapbox React Native SDK (mobile)
UI components: ShadCN (base), MagicUI (animations), 21st.dev (via magic-mcp)
Analytics: PostHog
Hosting: Vercel (web), Expo EAS (mobile)

### Architecture patterns:
- Server components for all data fetching where possible
- Client components only when interactivity requires it
- Supabase SSR client for server components
- Supabase browser client for client components
- RLS on every table — enforce at database level, not just frontend
- Rate limiting on every API route
- Zod validation on all inputs
- Optimistic UI updates with server sync for all interactions

---

## DATABASE SCHEMA — 14 TABLES

communities, topics, perspectives, posts, users, user_profiles,
contributors, reactions, post_likes, bookmarks, community_alignments,
community_connections, direct_messages, notifications

RLS rules:
- Public read: communities, topics, perspectives, community_alignments
- Auth read: posts (non-ghost), user_profiles (non-ghost), reactions, bookmarks
- Own write: posts, reactions, bookmarks, direct_messages, notifications
- Admin write: communities, topics, perspectives, contributors

Ghost mode enforcement: WHERE ghost_mode = FALSE on ALL queries that
return user locations, pins, or post data. No exceptions.

---

## REMAINING BUILD TASKS

Work through these in order. Check off as completed by updating this file.

### PHASE 4 — CORE FEATURES

[ ] 4.4 — Verification tiers
    - Level 1: automatic on account creation, can read and react
    - Level 2: location verification flow (enter location, basic check),
      can post, appear on map, connect with others
    - Level 3: contributor application form + admin review queue,
      can submit official community perspective cards
    - Gate post creation behind Level 2+
    - Gate perspective submission behind Level 3
    - Show verification badge on profiles and perspective cards
    - Build verification upgrade UI (prompt when trying to do gated action)

[ ] 4.5 — Feed tabs with real data
    - Nearby: haversine distance query for posts within user's radius
      ORDER BY created_at DESC, most recent first
    - Communities: query by user's followed communities, filter by selected topic
    - Discover: query perspectives from communities user has NEVER engaged with
      Explicitly prioritize viewpoint diversity — NOT engagement metrics
      Do not optimize for clicks, likes, or time-on-app
      Surface the most different perspective from the user's history
    - All three tabs update in real-time via Supabase Realtime

[ ] 4.6 — Community Pulse daily hook
    - Daily digest query: top topic of the day, most-reacted perspective,
      new communities that posted on topics user cares about
    - In-app notification delivery (notification bell + list)
    - Push notification opt-in (browser push via web push API)
    - Community Pulse panel accessible from notification bell
    - Design: "Today in your communities" — specific, never clickbait

[ ] 4.10 — Cross-community connections
    - Wire connection modal to create real community_connections record
    - Topic-anchored first message required: structured intro format
    - Accept/decline flow with notification to recipient
    - Connection request appears in notifications page
    - After accepted: direct message channel opens automatically
    - Show "X communities connected" on profiles — never "X followers"

[ ] 4.11 — Reactions persistence
    - Heart likes on personal posts → post_likes table with optimistic UI
    - 3-reaction system on perspectives → reactions table
      👁 i_see_this, 💡 i_didnt_know_this, 🤝 i_agree
    - Reaction counts update in real-time via Supabase Realtime
    - User can only react once per reaction type per perspective
    - Toggle off removes the reaction

### PHASE 5 — POLISH AND PERFORMANCE

[ ] 5.1 — Story expiry enforcement
    - Supabase Edge Function: delete stories WHERE expires_at < NOW()
    - Schedule: runs every hour via pg_cron
    - Verify: stories older than 24h don't appear in any query

[ ] 5.2 — Real-time updates throughout
    - Supabase Realtime subscription on perspectives table
    - Live new perspectives appear on map and feed without refresh
    - Live post pins appear on map as people post
    - Live message delivery in direct messaging
    - Live reaction count updates on perspective cards
    - Live notification badge count

[ ] 5.3 — Mobile responsiveness full audit
    - Test every page at 375px, 390px, 414px widths
    - Map must occupy 40% viewport height on mobile
    - Stories bar must scroll horizontally with snap
    - Perspective cards must stack full-width
    - Bottom nav must be accessible without thumb stretching
    - No horizontal scroll on any page
    - All tap targets minimum 44px

[ ] 5.4 — PostHog analytics (if not already done)
    - Install posthog-js
    - Initialize in providers.tsx
    - Track these specific events:
      map_topic_selected (topic_name, community_count)
      perspective_card_viewed (perspective_id, community_type, topic)
      perspective_card_reaction (reaction_type, perspective_id)
      connection_request_sent (from_community, to_community)
      post_created (post_type, radius, has_image)
      story_viewed (community_type, topic)
      discover_feed_opened
      onboarding_aha_moment (topic_shown, time_to_signup_prompt)
      auth_signup_completed (source: organic/aha/direct)

[ ] 5.5 — Security audit
    - Check all API routes for missing auth guards
    - Verify RLS policies cover all data access patterns
    - Check for any exposed service role keys in client code
    - Validate all user inputs with Zod
    - Rate limiting on all write endpoints
    - Verify ghost mode enforcement on every query that returns location data
    - No sensitive data in console.log statements
    - Check bundle for accidentally included secrets

### PHASE 6 — QUALITY, RETENTION, AND BEAUTY

This phase has no fixed task list. Use research, judgment, and the guidelines
below to continuously improve the platform.

[ ] 6.1 — Map beauty and uniqueness
    Research and implement:
    - Custom Mapbox dark style that matches PRISM's exact palette
    - Smooth vector tiles with no jagged edges
    - Animated pin clusters when many communities post on one topic
    - Heat visualization with smooth gradient overlays
    - Custom animated transitions when filtering by topic
    - The map should look like no other map-based app
    - Reference: Snap Maps, Apple Maps, Zenly (defunct but study it)
    - Search for "beautiful dark map design" and "Mapbox custom styles 2026"
      and implement the best patterns found

[ ] 6.2 — Retention mechanics research and implementation
    Research what makes social apps sticky. Specifically:
    - What made Snap Maps users open the app daily? Implement the equivalent.
    - What made BeReal's notification mechanic so effective? Adapt for PRISM.
    - What does Duolingo do for daily retention? Adapt the streak/pulse concept.
    - Study TikTok's first-session experience — what makes users stay?
    - Research "social app retention mechanics 2025 2026" and find current findings
    - Implement at least 3 retention mechanics based on research:
      Examples: daily ACTIVE NOW topic push, "Your community posted" notification,
      "X communities are discussing this right now" prompt, story expiry urgency,
      connection request notification with community context

[ ] 6.3 — UI polish to professional standard
    Using magic-mcp and 21st.dev, audit and improve every component:
    - Perspective cards: quote must feel important, Playfair italic, right weight
    - Map pins: glow animations must feel alive, not mechanical
    - Stories bar: ring gradient must be smooth, matches spec exactly
    - Feed tabs: transition between tabs must be instant and smooth
    - Alignment panel: agreement percentages must feel meaningful not decorative
    - Every loading state should have a skeleton, not a spinner
    - Every empty state should have a message that reflects PRISM's mission
      (e.g., empty Discover feed: "No new perspectives yet. Check back soon.")
    - Micro-interactions on every button and interactive element
    - MagicUI animations throughout: card fade-ins, map pin pulses,
      story ring rotation, tab switch transitions
    - Run the app and compare every screen against PRISM_DESIGN_SPEC.md
      If anything looks generic, redo it.

[ ] 6.4 — Performance optimization
    - Lighthouse audit: target 90+ on all metrics
    - Lazy load perspective cards below the fold
    - Optimize map tile loading
    - Image optimization with next/image
    - Bundle size analysis — remove unused dependencies
    - Database query optimization — check for N+1 queries
    - Add indexes on frequently queried columns
    - Cache community and topic data (changes infrequently)

[ ] 6.5 — Design like a senior designer
    Research and apply:
    - Search "best social media app UI design 2026" and study top results
    - Search "dark theme mobile app design inspiration" and extract patterns
    - Search "Figma community social app design" for reference implementations
    - Look at how Dribbble and Behance showcase social apps — what makes
      them look premium vs generic?
    - Apply the specific patterns found to PRISM's existing components
    - The test: show a screenshot of PRISM to someone and ask "does this look
      like a startup or does this look like a professional product?" It must
      look professional.

[ ] 6.6 — Accessibility
    - WCAG 2.1 AA compliance on all components
    - Color contrast ratios passing on all text
    - Keyboard navigation throughout
    - Screen reader labels on all interactive elements
    - Focus states visible on all interactive elements
    - Alt text on all images

---

## AGENT INSTRUCTIONS — HOW TO USE SUBAGENTS

When a task can be parallelized, spawn subagents instead of working sequentially.

Pattern for parallel work:
- Use "say 'use subagents' to throw more compute at a problem"
- Example: "Use subagents — one researches retention mechanics,
  one audits the current UI against the design spec,
  one runs the Lighthouse audit and fixes performance issues"

Use subagents for:
- Research tasks (one agent researches, one implements findings)
- Testing while building (one agent builds, one agent tests)
- Multi-component work (one per major component)
- Audit tasks (security, performance, accessibility all in parallel)

Always bring findings back to the main context before committing.

---

## CONTINUOUS IMPROVEMENT LOOP

When all tasks above are completed:

1. Run the full app in a browser and use it as a real user would
   Note everything that feels wrong, slow, or confusing

2. Research these specific things:
   - "What makes social apps go viral in 2026"
   - "Geographic social app user retention"
   - "Best map UI design examples 2026"
   - "Social app onboarding best practices"
   - "PRISM competitors" — find any apps that have launched since this was written
   Apply findings to the codebase.

3. Run a full test suite:
   - TypeScript strict mode zero errors
   - All API routes return correct data
   - Auth flow works end to end (signup, login, logout, session persistence)
   - Ghost mode actually hides users from all queries
   - Stories expire correctly after 24 hours
   - Reactions persist and update correctly
   - Map renders with correct pin colors and animations
   - Mobile layout works at all breakpoints
   - Performance: Lighthouse 90+ on all metrics

4. Find the three ugliest or most generic-looking components and redesign them
   using magic-mcp (21st.dev) and the design spec.

5. Find the three slowest database queries and optimize them.

6. Open a PR summarizing everything completed this session.

7. Return to the top of the task list and repeat.

---

## SECURITY REQUIREMENTS

Apply to every file, every commit, every API route:
- No hardcoded secrets anywhere — environment variables only
- Zod validation on every user input before it touches the database
- Rate limiting on all write endpoints
- RLS on every table — verify with SELECT rowsecurity FROM pg_tables
- Ghost mode: WHERE ghost_mode = FALSE on every query returning user data
- Auth check on every write route before any database operation
- Input sanitization on all text fields
- No console.log with user data or tokens in production code

---

## REFERENCE APPS — STUDY THESE

When making design or product decisions, study:
- Snap Maps — geographic social, pin visualization, story integration
- Apple Maps — smooth vector tiles, clean dark mode, no clutter
- BeReal — notification-driven retention, authenticity over polish
- Duolingo — daily habit mechanics, streak system, gentle push notifications
- Instagram Stories — story ring design, progress bar, tap to advance
- Zenly (defunct) — the gold standard for geographic social, study every screenshot
- Figma Community — how to surface diverse creator perspectives
- Ground News — how to show multiple media perspectives on same story

For the map specifically:
- Study Mapbox GL JS examples at docs.mapbox.com/mapbox-gl-js/example
- Look for "custom marker animations" and "heatmap layer" examples
- The PRISM map should be the most visually striking element in the app

---

## WHAT JAX CARES ABOUT MOST

In order of priority:
1. The map looks stunning and unique — not generic
2. The AHA moment works perfectly for new users
3. The app feels alive — real data, real-time updates, real community activity
4. Performance — fast load, smooth animations, no jank
5. Mobile experience is excellent — this is where most users will be
6. The design system is consistent throughout — no component feels out of place
7. Security is airtight — users trust the platform with their location

---

## NOTES FOR FUTURE SESSIONS

- Supabase project: PRISM1 (bkmutmhahravmpfcpbvw)
- GitHub repo: jaxtonwright11/newPRISM, branch: main
- Design spec: /docs/PRISM_DESIGN_SPEC.md
- Features V3: /docs/PRISM_FEATURES_V3.md
- Full spec: /docs/prism-full-spec.md
- All credentials are in /web/.env.local (gitignored)
- PR #11 has been superseded — close it if still open
- Phase 1-4 foundation is complete as of March 20, 2026
- Zero TypeScript errors, clean production build confirmed

---
