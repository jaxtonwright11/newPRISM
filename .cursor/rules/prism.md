# PRISM — Cursor Agent Rules
# File location: /newPRISM/.cursor/rules/prism.md
# Read this + all files in /docs/ before every task.

---

## REQUIRED READING BEFORE ANY TASK
Read all files in /docs/ before starting any work:
- /docs/PRISM_PLATFORM_CONTEXT_V2.md — what PRISM is, philosophy
- /docs/PRISM_SITE_FEATURES_V2.md — every feature spec
- /docs/PRISM_SUPPLEMENTARY_V2.md — founder context, what NOT to build
- /docs/prism-full-spec.md — full technical spec, schema, API routes, types
- /docs/PRISM_DESIGN_SPEC.md — visual design spec, colors, typography, map style

---

## WHAT PRISM IS

PRISM is a community perspective social media platform AND a geographic social network.
Social media redesigned around understanding rather than outrage.

Core experience: a live map showing where verified geographic and demographic communities
are discussing current events. Users post from within their community radius, read
perspectives globally, react with understanding-focused reactions, and connect directly
with people from communities they've encountered.

PRISM IS NOT a prediction market, forecasting platform, polling tool, or debate forum.
Correct any such references immediately.

---

## TECH STACK (never deviate)

| Layer | Technology |
|---|---|
| Web | Next.js 14 App Router, TypeScript, Tailwind CSS |
| Mobile | React Native, Expo SDK 50+ |
| Backend | Supabase PostgreSQL + Auth + Realtime |
| Maps | Mapbox GL JS (web), Mapbox React Native SDK (mobile) |
| Map style | Custom dark vector tile — Apple Maps / Snap Maps aesthetic |
| UI Components | ShadCN + MagicUI (installed via MCP) |
| Analytics | PostHog |
| Shared types | /shared/types/index.ts only |

---

## DATABASE — 14 TABLES (not 11)

The schema has been updated. Tables:
communities, topics, perspectives, posts, users, user_profiles, contributors,
reactions, post_likes, bookmarks, community_alignments, community_connections,
direct_messages, notifications

Key additions from previous spec:
- posts table: individual user posts with radius_miles, post_type (permanent/story), expires_at
- post_likes table: simple heart like for personal posts (separate from perspective reactions)
- direct_messages table: for cross-community connections
- users table now includes: ghost_mode, verification_level (1/2/3), default_radius_miles

RLS on ALL 14 tables. No exceptions.

---

## KEY FEATURES TO BUILD CORRECTLY

**Ghost Mode (non-negotiable):**
When ghost_mode = true on a user record, that user's pin must NOT appear in any
map query, any API response, or any realtime subscription. It must be invisible
at the database query level, not filtered in the frontend.

**Radius-Based Posting:**
Posts store approximate latitude/longitude (community center + random offset within radius).
Never store exact GPS coordinates. Radius options: 10/20/30/40 miles. Default 40.

**Stories (24-hour posts):**
post_type = 'story', expires_at = created_at + 24 hours.
Map query must exclude expired stories. Run a cleanup job or filter by expires_at > NOW().

**Two-tier post types on the map:**
- Community perspective pins: larger, community color, use community icon
- Personal post pins: smaller, user's community color, different shape/indicator
Both types appear on the map but must be visually distinct.

**Onboarding AHA moment:**
Map must load BEFORE profile creation. Show value first. The sequence:
map loads → topic highlighted → perspectives shown → THEN prompt to create account.
Never gate the map behind account creation.

**Reactions are different for each type:**
- Perspective cards: 'i_see_this' | 'i_didnt_know_this' | 'i_agree'
- Personal posts: simple heart like
Never cross-apply these systems.

**Discover feed:**
Must NOT optimize for engagement or virality. Must explicitly surface perspectives
from communities the user has NEVER interacted with. Algorithm: zero_engagement_communities
sorted by topical relevance to user's interests, filtered for diversity of viewpoint.

---

## SECURITY — EVERY PR MUST PASS

1. RLS on all 14 tables — every migration includes policies
2. No hardcoded secrets — environment variables only
3. Zod validation on all user-facing fields
4. Rate limiting on all API routes
5. Auth check on all protected routes
6. Ghost mode enforced at DB query level (not frontend)
7. Location data: radius-approximate only, never exact GPS
8. Direct messages: encrypted at rest
9. TypeScript strict — zero `any` types, `tsc --noEmit` passes

---

## CODE STANDARDS

- Server components by default. 'use client' only when required.
- Data fetching: server components or SWR/React Query. Never useEffect for data.
- API calls through /lib files. Never raw fetch in components.
- Mobile-first CSS (375px base). WCAG 2.1 AA on all text.
- JSDoc on every exported function and component.
- Commit format: "feat: [what]" / "fix: [what]" / "chore: [what]" / "security: [what]"

---

## UI COMPONENTS

Use ShadCN + MagicUI components via MCP whenever available before writing custom CSS.
ShadCN = clean base components. MagicUI = transitions and animations on top of ShadCN.
21st.dev components can be copied for design elements that aren't in ShadCN/MagicUI.

Do NOT build generic-looking AI interfaces. PRISM should look like a dark intelligence
dashboard, not a SaaS template. Reference /docs/PRISM_DESIGN_SPEC.md for every design decision.

---

## ANALYTICS

PostHog is installed. Track these events minimum:
- map_topic_selected
- perspective_card_viewed
- perspective_card_reaction (with reaction_type)
- connection_request_sent
- connection_request_accepted
- post_created (with post_type: story/permanent)
- story_viewed
- discover_feed_opened
- onboarding_aha_moment (when user reads 2+ perspectives before creating account)

These events are how we know if PRISM is working as intended.

---

## MIGRATION RULES

Every database change = new migration file. Never modify existing.
Naming: /supabase/migrations/YYYYMMDDHHMMSS_description.sql
Every migration must include schema change + RLS enable + at least one policy.

---

## BUILD ORDER

1. Scaffold + shared types + Supabase schema (14 tables) + seed data
2. Auth (email/password + Google OAuth, verification levels)
3. Map (Mapbox dark style, community + post pins, ghost mode, topic filter)
4. Onboarding AHA flow (map first, value before account creation)
5. Topic sidebar (search, Live Now, Communities)
6. Perspective cards (quote, reactions, share, bookmark)
7. Personal posts + stories (create, radius, 24h expiry, likes)
8. Alignment panel (convergence only)
9. Feed tabs (Nearby / Communities / Discover)
10. Community Pulse (daily notification + digest)
11. Cross-community connection + direct messaging
12. PostHog analytics events
13. Mobile (React Native mirrors web MVP)

Complete each phase. Do not skip ahead.

---

## DO NOT BUILD

- Comment sections
- Follower counts (use "communities connected")
- Algorithmic feed optimizing for engagement/outrage
- Community profile pages as browsable accounts
- Advertising
- Prediction markets, forecasting, probability scores
- Division data in alignment panel
- Dislike, downvote, or any negative reaction
- Video creation tools
- Exact GPS coordinate storage

---

## DECISION FORMAT

Genuine fork:
DECISION NEEDED: [choice] — A) [option] B) [option] — Recommendation: [which and why]

Better approach:
BETTER APPROACH FOUND: [what] — Reason: [why] — Trade-off: [cost] — Proceeding unless blocked.

Security failure:
SECURITY BLOCK: [which check failed] — Fix: [what's needed] — PR will not open until resolved.

Claude Code tip: after every correction, update this file or CLAUDE.md with a rule
so the same mistake isn't made again.
