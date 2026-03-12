# PRISM — Cursor Agent Rules
# File location: /newPRISM/.cursor/rules/prism.md
# Cursor Background Agents read this on every task. Do not delete or move.

---

## WHAT PRISM IS

PRISM is a community perspective social media platform. Social media redesigned
around understanding rather than outrage.

The core experience: a live map showing where verified geographic and demographic
communities are actively discussing current events, perspective cards surfacing their
voices in their own words, cross-community alignment data showing where different
communities agree, and a connection feature so users can meet people from communities
they've read about.

Founding question: why can't we understand each other?

PRISM IS NOT a prediction market, forecasting platform, polling tool, news aggregator,
or debate forum. If you see those terms in this codebase, that is wrong — correct it.

---

## TECH STACK

| Layer | Technology |
|---|---|
| Web | Next.js 14 App Router, TypeScript, Tailwind CSS |
| Mobile | React Native, Expo SDK 50+ |
| Database | Supabase PostgreSQL |
| Auth | Supabase Auth |
| Realtime | Supabase Realtime |
| Maps | Mapbox GL JS (web), Mapbox React Native SDK (mobile) |
| Map style | Custom dark vector tile — Apple Maps aesthetic |
| Shared types | /shared/types/index.ts |
| Hosting | Vercel (web), Expo EAS (mobile) |

Never introduce a technology not on this list without flagging it first.

---

## REPO STRUCTURE
```
/newPRISM
  /web                    Next.js app
    /app                  App Router pages + layouts
    /components           UI components (map, cards, sidebar, alignment, engagement)
    /lib                  Service clients (supabase, supabase-browser, mapbox)
    /hooks                Custom React hooks
    /types                Web-specific types
  /mobile                 Expo React Native
    /app                  Expo Router pages
    /components           Mobile components
    /lib                  Mobile service clients
  /supabase
    /migrations           Numbered SQL migration files
    /functions            Edge functions
  /shared
    /types/index.ts       ALL shared TypeScript interfaces (single source of truth)
  /docs
  .cursor/rules/prism.md  This file (do not modify)
```

---

## SECURITY — EVERY PR MUST PASS ALL OF THESE

1. RLS ENABLED: every Supabase table touched has Row Level Security enabled
   and at least one policy. Check:
   SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';

2. NO HARDCODED SECRETS: grep diff for keys, tokens, passwords. Zero tolerance.
   Environment variables only.

3. INPUT VALIDATION: every user-facing field uses zod schema validation.

4. RATE LIMITING: every new Next.js API route has rate limiting.

5. AUTH CHECK: every protected route verifies session before executing:
   const { data: { session } } = await supabase.auth.getSession()
   if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

6. TYPESCRIPT: tsc --noEmit zero errors before PR opens.

7. NO ANY TYPES: use unknown and narrow it.

If any check fails — fix before opening PR. No exceptions.

---

## CODE STANDARDS

- Server components by default. 'use client' only when necessary.
- Data fetching: server components or SWR/React Query. Never useEffect for data.
- API calls from components go through /lib files. Never raw fetch in components.
- No business logic in UI components.
- JSDoc on every exported function and component.
- Mobile-first: design at 375px, scale up with sm: md: lg:
- WCAG 2.1 AA: 4.5:1 contrast minimum on all text.
- Commit format: "feat: [what]" / "fix: [what]" / "chore: [what]" / "security: [what]"
- Commit at feature completion, not at every file save.

---

## MIGRATION RULES

Every database change requires a new migration file. Never modify existing ones.
Naming: /supabase/migrations/YYYYMMDDHHMMSS_description.sql

Every migration must include:
1. Schema change
2. ALTER TABLE [name] ENABLE ROW LEVEL SECURITY;
3. At least one RLS policy

---

## DESIGN RULES

- No text on the map. Zero labels, zero city names, zero abbreviations.
- Community colors = community TYPE, never political leaning.
- The quote is the most important element in every perspective card.
- Reaction types: 'i_see_this' | 'i_didnt_know_this' | 'i_agree' only.
- Alignment panel: shows convergence ONLY. Never division data.
- No follower counts anywhere on the platform.
- Topic-first navigation. Communities surface under topics, not the reverse.

---

## DO NOT BUILD

- Comment sections
- Follower counts or follower-based social graph
- Algorithmic feed optimizing for engagement or outrage
- Community profile pages as browsable accounts
- Open source data download section
- Polling or survey features
- Advertising
- Prediction markets, forecasting, or probability score features
- Division data in the alignment panel

---

## MVP BUILD ORDER

1. Scaffold + shared types + Supabase schema + seed data
2. Auth (email/password + Google OAuth)
3. Map (Mapbox dark style, community pins with glow, topic filtering)
4. Topic sidebar (search, Live Now, Communities list)
5. Perspective cards (quote, verified badge, reactions, share, bookmark)
6. Cross-community alignment panel
7. Engagement + user profiles + notifications
8. Cross-community connection feature
9. Mobile (React Native mirrors web MVP)

Complete each phase. Do not skip ahead.

---

## DECISION FORMAT

Genuine architectural fork:
DECISION NEEDED: [describe the choice]
Options:
  A) [option] — [trade-off]
  B) [option] — [trade-off]
Recommendation: [which and why]

Better approach than specified:
BETTER APPROACH FOUND: [what]
Reason: [why it's better]
Trade-off: [what we lose]
Proceeding unless blocked.

Security check failure:
SECURITY BLOCK: [which check failed]
Fix required: [what needs to change]
PR will not open until resolved.