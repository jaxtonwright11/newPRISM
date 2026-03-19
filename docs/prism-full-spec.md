# PRISM — Full Technical Specification v3
# Updated: March 2026
# Reflects full social media platform vision including location features,
# individual connections, stories, community pulse, and retention mechanics.
# Feed this to Claude Code and Cursor Background Agents before any build task.

---

## WHAT PRISM IS — READ FIRST

PRISM is a community perspective social media platform and geographic social network.
Founding question: why can't we understand each other?

The core experience: a live map showing where verified geographic and demographic
communities are discussing current events. Users post from their community location,
read perspectives from communities globally, react and connect across community lines,
and meet people from communities they've encountered through the platform.

PRISM IS NOT a prediction market, forecasting platform, polling tool, or debate forum.
If you see those terms anywhere in the codebase — correct immediately.

Live: prismreason.vercel.app (outdated — this build replaces it)
Domain: prismreason.com

---

## TECH STACK (non-negotiable)

| Layer | Technology |
|---|---|
| Web | Next.js 14 App Router, TypeScript, Tailwind CSS |
| Mobile | React Native + Expo SDK 50+ (iOS + Android) |
| Backend | Supabase (PostgreSQL, Auth, Realtime, Storage) |
| Maps | Mapbox GL JS (web), Mapbox React Native SDK (mobile) |
| Map style | Custom dark vector tile — Apple Maps / Snap Maps aesthetic |
| UI Components | ShadCN + MagicUI (via MCP) |
| Analytics | PostHog (self-hosted or cloud) |
| Shared types | /shared/types/index.ts |
| Hosting | Vercel (web), Expo EAS (mobile) |
| AI | Claude API — content moderation + community alignment scoring only |

---

## FEATURE SET — COMPLETE

### TIER 1: CORE FEATURES (MVP)

**1. The Map**
- Dark vector tile, Apple Maps / Snap Maps aesthetic
- Smooth Mapbox GL JS — never jagged or geometric
- Community pins = glowing dots with pulse rings, not teardrops
- Pin color = community TYPE (civic/diaspora/rural/policy/academic/cultural)
- Pin size/glow intensity = activity level (more active = brighter + larger)
- Map heat: when many users post on the same topic, the area glows hotter
- No text on the map. Zero labels. Zero abbreviations. Zero exceptions.
- LIVE indicator: red dot + "LIVE" text, top-right corner, subtle pulse animation
- Hard-clipped edges — nothing overflows the map boundary

**2. Perspective Cards**
- Core content unit — one community's documented view on a topic
- Community identifier: icon + name + region + verified badge
- Quote: first-person, italic serif, most prominent element on the card
- Context: 1-2 sentence framing below the quote
- Category tag: single label (Domestic Policy / Diaspora / Border / etc.)
- Left border color = community type color
- Reactions: 👁 "I see this" / 💡 "I didn't know this" / 🤝 "I agree"
- Share + bookmark controls

**3. Personal Posts (NEW)**
- Individual users post from within their community radius
- Appear on the map as smaller, distinct pins (not community perspective pins)
- Visually different from official community perspectives
- React: simple heart like (no count obsession — show count but don't make it status)
- No dislike. No downvote. No negative reaction of any kind.
- Share + bookmark
- 24-hour stories: low-friction ephemeral posts (see Stories below)
- Permanent posts: longer-lived, higher friction

**4. Topic Sidebar**
- PRISM wordmark at top (Playfair Display serif)
- Full-text topic search
- Live Now: HOT / TRENDING / NEW status badges per topic
- Communities active on selected topic (dynamic, updates per topic)
- Topic selection filters map + cards + alignment panel simultaneously

**5. Cross-Community Alignment Panel**
- Shows ONLY where communities agree — never division
- "Most Agreed" pull stat headline
- Alignment statement list with community attribution
- Agreement % displayed prominently
- Updates per selected topic

**6. Auth**
- Email/password + Google OAuth
- Session persistence
- Three verification tiers (see Verification below)

---

### TIER 2: SOCIAL + RETENTION FEATURES

**7. Stories (24-hour ephemeral posts)**
- Low-friction daily posting format
- Appear on the map for 24 hours then disappear
- Keeps the map current — no stale content
- "What's happening in your 40-mile world right now?"
- Separate story ring indicator on user's pin
- Primary daily retention mechanic — gives users a reason to open daily

**8. Radius-Based Posting**
- Every post is anchored to a radius, not an exact location (privacy-preserving)
- Default radius: 40 miles
- User can narrow: 10 / 20 / 30 / 40 miles
- Posts appear on the map at the community's general location, not exact coordinates
- Radius setting persists per user, adjustable per post

**9. Ghost Mode (non-negotiable for trust)**
- Users can browse the map without their own pin showing
- Default: radius-only visibility (not exact location)
- Options: Visible (pin shows with radius) / Ghost (pin hidden, can still browse + read)
- Without this feature, the app gets uninstalled immediately
- Must be accessible from one tap in the main UI — not buried in settings

**10. Individual User Profiles (light)**
- What shows when someone clicks your pin:
  - Your community (region/city)
  - Your recent posts and perspectives
  - Topics you engage with
  - "X communities connected" — not follower count
- No follower counts anywhere on the platform
- Community identity > individual identity

**11. Feed Tabs**
- Three tabs alongside (or below) the map:
  - **Nearby**: posts from within your radius, most recent first
  - **Communities**: perspectives from communities you follow, filtered by topic
  - **Discover**: perspectives from communities you've NEVER engaged with,
    specifically surfacing views different from yours. This is PRISM's mission
    in feed form — the algorithm explicitly surfaces unfamiliar perspectives.
- Discover tab does NOT optimize for engagement or virality
- Discover algorithm: prioritize perspectives from communities with 0 prior engagement,
  on topics the user cares about, expressing views that differ from what they've reacted to

**12. Community Pulse (daily hook)**
- Daily digest notification + home screen widget
- Answers: what are the top topics in your community today?
  What's the most-engaged perspective from communities you follow?
- Push notification (opt-in, rare — not badge anxiety)
- Makes opening PRISM a daily habit, not just a breaking-news reaction
- Without this, engagement is reactive. With it, engagement is habitual.

**13. Map Heat**
- When multiple communities are posting on the same topic simultaneously:
  the map shows concentrated heat (brighter glow, overlapping pin auras)
- Tap the heat → see all community perspectives side by side
- This IS the PRISM magic moment: same event, five different worlds, on one screen
- Also the reason to open the app when news breaks

**14. Onboarding AHA Moment (critical — first 90 seconds)**
Sequence:
1. Open app → map shows immediately with live activity (no loading screen of death)
2. One topic highlighted as active NOW
3. Tap it → map filters, pins light up from multiple communities globally
4. Two perspective cards load from communities with opposite contexts on same event
5. User reads both. "I never thought about it that way."
That's the hook. Everything else (profile, posting, connecting) comes AFTER this moment.
Do NOT put profile creation before the map experience. Show the value first.

**15. Cross-Community Connection**
- After reading a community's perspective card, user can click "Connect with someone from this community"
- Shows verified contributors from that community who have opted in to connections
- Structured intro message format: "I'm from [city/region]. I read your community's perspective on [topic] and wanted to connect."
- Topic-anchored always — not a cold DM
- Same-community connections NOT available through this feature (cross-community only)
- Accept/decline — declining is always easy and judgment-free
- Once connected: direct messaging within the platform

**16. Direct Messaging**
- Available once cross-community connection is accepted
- Topic-anchored first message (the structured intro)
- Free conversation after that
- Future: small group chats between multiple connected users from different communities
- Build the architecture at MVP even if UI ships post-MVP

---

### TIER 3: POST-MVP

- Contributor verification scaling (application-based)
- Community-to-community moderated dialogue
- Discovery feed algorithm (personalized but anti-confirmation)
- PRISM public data API for researchers
- App store submission (iOS + Android)
- WCAG 2.1 AA full audit + remediation
- Leaderboards (most-connected communities per topic, not individual users)

---

## VERIFICATION TIERS

**Level 1 — Account created**
Can: read, browse, like, react, discover
Cannot: post, connect, contribute perspectives

**Level 2 — Community confirmed**
How: user enters location, system does basic geographic verification
Can: post personal posts with radius, connect with individuals,
     appear on the map as a personal pin
Cannot: submit official community perspectives

**Level 3 — Verified contributor**
How: application-based — community affiliation, proof of ties, sample perspective
     Jax's direct community research = first tier of Level 3 contributors
Can: submit official community perspective cards
     Perspectives attributed to community unless contributor opts into named attribution
     Can flag other contributors who misrepresent the community

---

## DATABASE SCHEMA

### communities
```sql
CREATE TABLE communities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  region TEXT NOT NULL,
  country TEXT NOT NULL DEFAULT 'US',
  latitude DECIMAL(9,6),
  longitude DECIMAL(9,6),
  community_type TEXT NOT NULL
    CHECK (community_type IN ('civic','diaspora','rural','policy','academic','cultural')),
  color_hex TEXT NOT NULL,
  description TEXT,
  verified BOOLEAN DEFAULT FALSE,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### topics
```sql
CREATE TABLE topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  summary TEXT,
  status TEXT DEFAULT 'active'
    CHECK (status IN ('active','trending','hot','cooling','archived')),
  perspective_count INT DEFAULT 0,
  community_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### perspectives (official community perspectives)
```sql
CREATE TABLE perspectives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID REFERENCES communities(id) ON DELETE CASCADE,
  topic_id UUID REFERENCES topics(id) ON DELETE CASCADE,
  quote TEXT NOT NULL,
  context TEXT,
  category_tag TEXT,
  contributor_id UUID REFERENCES contributors(id),
  verified BOOLEAN DEFAULT FALSE,
  reaction_count INT DEFAULT 0,
  bookmark_count INT DEFAULT 0,
  share_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### posts (individual user posts — personal pins on map)
```sql
CREATE TABLE posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  community_id UUID REFERENCES communities(id),
  topic_id UUID REFERENCES topics(id),
  content TEXT NOT NULL,
  image_url TEXT,
  post_type TEXT NOT NULL DEFAULT 'permanent'
    CHECK (post_type IN ('permanent','story')),
  radius_miles INT NOT NULL DEFAULT 40
    CHECK (radius_miles IN (10,20,30,40)),
  expires_at TIMESTAMPTZ,           -- NULL for permanent, 24h for stories
  latitude DECIMAL(9,6),           -- approximate only, not exact
  longitude DECIMAL(9,6),
  like_count INT DEFAULT 0,
  comment_count INT DEFAULT 0,
  share_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### users
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  home_community_id UUID REFERENCES communities(id),
  verification_level INT DEFAULT 1 CHECK (verification_level IN (1,2,3)),
  ghost_mode BOOLEAN DEFAULT FALSE,
  default_radius_miles INT DEFAULT 40 CHECK (default_radius_miles IN (10,20,30,40)),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### user_profiles
```sql
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  perspectives_read INT DEFAULT 0,
  communities_engaged INT DEFAULT 0,
  connections_made INT DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### contributors
```sql
CREATE TABLE contributors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  community_id UUID REFERENCES communities(id),
  verified BOOLEAN DEFAULT FALSE,
  verification_status TEXT DEFAULT 'pending'
    CHECK (verification_status IN ('pending','approved','rejected')),
  named_attribution BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### reactions (perspective cards — 3 types)
```sql
CREATE TABLE reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  perspective_id UUID REFERENCES perspectives(id) ON DELETE CASCADE,
  reaction_type TEXT NOT NULL
    CHECK (reaction_type IN ('i_see_this','i_didnt_know_this','i_agree')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, perspective_id)
);
```

### post_likes (personal posts — simple heart)
```sql
CREATE TABLE post_likes (
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, post_id)
);
```

### bookmarks
```sql
CREATE TABLE bookmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  topic_id UUID REFERENCES topics(id) ON DELETE SET NULL,
  perspective_id UUID REFERENCES perspectives(id) ON DELETE SET NULL,
  post_id UUID REFERENCES posts(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CHECK (
    (topic_id IS NOT NULL AND perspective_id IS NULL AND post_id IS NULL) OR
    (topic_id IS NULL AND perspective_id IS NOT NULL AND post_id IS NULL) OR
    (topic_id IS NULL AND perspective_id IS NULL AND post_id IS NOT NULL)
  )
);
```

### community_alignments
```sql
CREATE TABLE community_alignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id UUID REFERENCES topics(id) ON DELETE CASCADE,
  alignment_statement TEXT NOT NULL,
  community_ids UUID[],
  agreement_pct INT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### community_connections
```sql
CREATE TABLE community_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id UUID REFERENCES users(id) ON DELETE CASCADE,
  recipient_id UUID REFERENCES users(id) ON DELETE CASCADE,
  topic_id UUID REFERENCES topics(id),
  perspective_id UUID REFERENCES perspectives(id),
  status TEXT DEFAULT 'pending'
    CHECK (status IN ('pending','accepted','declined')),
  intro_message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  responded_at TIMESTAMPTZ,
  CHECK (requester_id != recipient_id)
);
```

### direct_messages
```sql
CREATE TABLE direct_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  connection_id UUID REFERENCES community_connections(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### notifications
```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  payload JSONB,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### RLS on ALL tables
```sql
ALTER TABLE communities ENABLE ROW LEVEL SECURITY;
ALTER TABLE topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE perspectives ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE contributors ENABLE ROW LEVEL SECURITY;
ALTER TABLE reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_alignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE direct_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
```

---

## API ROUTES

```
/api/topics          GET                     All active topics
/api/topics/[slug]   GET                     Single topic
/api/topics/[slug]/bookmark   POST/DELETE    Bookmark topic

/api/perspectives    GET ?topic=&community=  Perspectives feed
/api/perspectives/[id]         GET           Single perspective
/api/perspectives/[id]/react   POST/DELETE   React (auth required)
/api/perspectives/[id]/bookmark POST/DELETE  Bookmark

/api/posts           GET ?radius=&lat=&lng=  Posts within radius
                     POST                    Create post (auth, level 2+)
/api/posts/[id]      GET/PATCH/DELETE
/api/posts/[id]/like POST/DELETE

/api/communities     GET ?topic=             Communities active on topic
/api/communities     GET ?topic=&bbox=       Map pin data

/api/alignment       GET ?topic=             Alignment data for topic

/api/map             GET ?topic=&bbox=       All pins (perspectives + posts)

/api/connections     POST                    Create connection request
/api/connections/[id] PATCH                 Accept/decline

/api/messages        GET ?connection_id=     Messages in connection
                     POST                    Send message

/api/feed/nearby     GET ?radius=            Posts within radius
/api/feed/communities GET                   Followed communities feed
/api/feed/discover   GET                    Unfamiliar communities feed

/api/notifications   GET                    User notifications
```

---

## SHARED TYPESCRIPT TYPES

```typescript
// /shared/types/index.ts

export type CommunityType = 'civic'|'diaspora'|'rural'|'policy'|'academic'|'cultural';
export type TopicStatus = 'active'|'trending'|'hot'|'cooling'|'archived';
export type ReactionType = 'i_see_this'|'i_didnt_know_this'|'i_agree';
export type ConnectionStatus = 'pending'|'accepted'|'declined';
export type PostType = 'permanent'|'story';
export type VerificationLevel = 1|2|3;
export type RadiusMiles = 10|20|30|40;

export interface Community {
  id: string; name: string; region: string; country: string;
  latitude: number|null; longitude: number|null;
  community_type: CommunityType; color_hex: string;
  description: string|null; verified: boolean; active: boolean;
}

export interface Topic {
  id: string; title: string; slug: string; summary: string|null;
  status: TopicStatus; perspective_count: number; community_count: number;
  created_at: string; updated_at: string;
}

export interface Perspective {
  id: string; community_id: string; topic_id: string;
  quote: string; context: string|null; category_tag: string|null;
  verified: boolean; reaction_count: number; bookmark_count: number;
  share_count: number; created_at: string;
  community?: Community; topic?: Topic;
  user_reaction?: ReactionType|null; user_bookmarked?: boolean;
}

export interface Post {
  id: string; user_id: string; community_id: string|null;
  topic_id: string|null; content: string; image_url: string|null;
  post_type: PostType; radius_miles: RadiusMiles;
  expires_at: string|null; latitude: number|null; longitude: number|null;
  like_count: number; comment_count: number; share_count: number;
  created_at: string;
  user?: UserProfile; community?: Community; topic?: Topic;
  user_liked?: boolean;
}

export interface User {
  id: string; email: string; username: string;
  display_name: string|null; avatar_url: string|null;
  home_community_id: string|null;
  verification_level: VerificationLevel;
  ghost_mode: boolean; default_radius_miles: RadiusMiles;
  created_at: string;
}

export interface UserProfile extends User {
  perspectives_read: number; communities_engaged: number; connections_made: number;
}

export interface MapPin {
  id: string; type: 'community'|'post'|'story';
  latitude: number; longitude: number;
  color_hex: string; community_type: CommunityType;
  activity_level: 'high'|'medium'|'low';
  community?: Community; post?: Post;
}

export interface CommunityAlignment {
  id: string; topic_id: string; alignment_statement: string;
  community_ids: string[]; agreement_pct: number;
  communities?: Community[];
}

export interface ConnectionRequest {
  id: string; requester_id: string; recipient_id: string;
  topic_id: string; perspective_id: string|null;
  status: ConnectionStatus; intro_message: string; created_at: string;
}
```

---

## ENVIRONMENT VARIABLES

```bash
# .env.local (web)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_MAPBOX_TOKEN=
ANTHROPIC_API_KEY=
NEXT_PUBLIC_POSTHOG_KEY=
NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com
NEXTAUTH_SECRET=
NEXTAUTH_URL=

# Expo (mobile)
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
EXPO_PUBLIC_MAPBOX_TOKEN=
EXPO_PUBLIC_POSTHOG_KEY=
```

---

## MVP BUILD ORDER

1. Scaffold — dirs, configs, shared types, Supabase wired
2. Supabase schema — all 14 tables, RLS on all, seed data
3. Auth — email/password + Google OAuth, verification levels
4. Map — Mapbox dark style, community pins + personal post pins, topic filtering, ghost mode
5. Onboarding AHA flow — map first, value before profile creation
6. Topic sidebar — search, Live Now, Communities
7. Perspective cards — quote, reactions, share, bookmark
8. Personal posts — create post with radius, stories (24h), like
9. Alignment panel — convergence only
10. Feed tabs — Nearby / Communities / Discover
11. Community Pulse — daily notification + digest
12. Cross-community connection — request, accept, direct messaging
13. Mobile — React Native mirrors web MVP
14. PostHog analytics — event tracking for retention analysis

---

## WHAT NOT TO BUILD

- Comment sections (replaced by moderated community dialogue — post-MVP)
- Follower counts (use "communities connected" instead)
- Algorithmic feed optimizing for engagement/outrage
- Community profile pages as browsable accounts
- Open source data download section
- Polling or surveys
- Advertising
- Prediction markets, forecasting, probability scores
- Division data in alignment panel
- Dislike, downvote, or any negative reaction
- Video creation tools (PRISM is text + image, not a content creation platform)
- Exact user location (always radius-based, never precise coordinates)

---

## SECURITY

- RLS on all 14 tables from day one. No exceptions.
- No secrets hardcoded. Environment variables only.
- Zod validation on all user-facing fields.
- Rate limiting on all API routes.
- Auth verification on all protected routes.
- Location data: store radius-approximate only, never exact GPS coordinates.
- Ghost mode: when enabled, user's pin must not appear anywhere — not in queries, not in API responses.
- Direct messages: encrypted at rest.
- Dependency audit before any new npm package.

---
