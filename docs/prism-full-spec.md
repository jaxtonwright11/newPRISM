# PRISM — Full Technical Specification
# Primary build brief for Claude Code, Cursor, and any autonomous coding agent.
# Read this entire file before writing a single line of code.
# Last updated: March 2026

---

## WHAT PRISM IS — READ THIS FIRST

PRISM is a community perspective social media platform. It is social media redesigned
around understanding rather than outrage. Users explore how verified geographic and
demographic communities are experiencing the same current events, react, share,
bookmark, and connect directly with people from communities they've encountered.

The founding question: **why can't we understand each other?**

The map is the centerpiece. Perspective cards are the core content unit. Cross-community
alignment is the most surprising and shareable feature.

PRISM IS NOT:
- A prediction market (not Kalshi, not Polymarket)
- A forecasting platform (old abandoned concept — never reference this)
- A polling platform
- A news aggregator
- A debate forum
- Anything with follower counts as status

If you see any reference to "foresight," "prediction social platform," or "forecasting"
in this codebase — that is WRONG. Correct it immediately.

Live at: prismreason.vercel.app (current outdated version — this build replaces it)
Domain: prismreason.com

---

## TECH STACK (non-negotiable)

| Layer | Technology |
|---|---|
| Web frontend | Next.js 14 (App Router), TypeScript, Tailwind CSS |
| Mobile | React Native with Expo SDK 50+ (iOS + Android) |
| Backend / DB | Supabase (PostgreSQL, Auth, Realtime, Storage) |
| Maps | Mapbox GL JS (web), Mapbox React Native SDK (mobile) |
| Map style | Custom dark vector tile style (Apple Maps aesthetic) |
| Shared types | TypeScript interfaces in /shared/types/index.ts |
| Web hosting | Vercel |
| Mobile builds | Expo EAS Build |
| AI (optional) | Claude API — for content moderation and summarization only |

---

## FILE STRUCTURE

```
/prism
  /web                          Next.js app
    /app                        App Router pages
      /page.tsx                 Home — map + live topics
      /topic/[slug]/page.tsx    Topic view — filtered map + cards
      /community/[id]/page.tsx  Community perspective view
      /profile/page.tsx         User profile (auth required)
      /connect/page.tsx         Cross-community connection flow
      /auth/page.tsx            Auth page
    /components
      /map/                     Map components
      /cards/                   Perspective card components
      /sidebar/                 Left sidebar / topic navigation
      /alignment/               Cross-community alignment panel
      /engagement/              Reactions, share, bookmark
      /connection/              Cross-community connection flow
      /ui/                      Shared UI primitives
    /lib
      /supabase.ts              Supabase server client
      /supabase-browser.ts      Supabase browser client
      /mapbox.ts                Mapbox client + config
    /hooks                      Custom React hooks
    /types                      Web-specific types (extends /shared/types)
  /mobile                       Expo React Native app
    /app                        Expo Router (mirrors web structure)
    /components                 Mobile-specific components
    /lib                        Mobile service clients
  /supabase
    /migrations                 Numbered SQL migration files
    /functions                  Edge functions
    /seed.sql                   Dev seed data (demo communities + perspectives)
  /shared
    /types
      /index.ts                 ALL shared TypeScript interfaces
  /docs
    /architecture.md
    /api.md
  CLAUDE.md                     Master context (do not modify)
  .cursor/rules/prism.md        Cursor agent rules (do not modify)
```

---

## DATABASE SCHEMA

### communities
The geographic and demographic groups that contribute perspectives.
Communities are NOT user accounts. They surface under topics.

```sql
CREATE TABLE communities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,           -- "Chicago South Side"
  region TEXT NOT NULL,                -- "Chicago, IL"
  country TEXT NOT NULL DEFAULT 'US',
  latitude DECIMAL(9,6),              -- for map pin placement
  longitude DECIMAL(9,6),
  community_type TEXT NOT NULL,
  -- 'civic' | 'diaspora' | 'rural' | 'policy' | 'academic' | 'cultural'
  color_hex TEXT NOT NULL,            -- pin and card color coding by community type
  description TEXT,
  verified BOOLEAN DEFAULT FALSE,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### topics
Current events and issues that communities are discussing.

```sql
CREATE TABLE topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,                -- "US/Iran Bombing"
  slug TEXT UNIQUE NOT NULL,          -- "us-iran-bombing"
  summary TEXT,
  status TEXT DEFAULT 'active'
    CHECK (status IN ('active', 'trending', 'hot', 'cooling', 'archived')),
  perspective_count INT DEFAULT 0,
  community_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### perspectives
The core content unit — one community's documented viewpoint on one topic.

```sql
CREATE TABLE perspectives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID REFERENCES communities(id) ON DELETE CASCADE,
  topic_id UUID REFERENCES topics(id) ON DELETE CASCADE,
  quote TEXT NOT NULL,                -- first-person voice from inside the community
  context TEXT,                       -- 1-2 sentences of framing
  category_tag TEXT,                  -- "Domestic Policy" | "Diaspora" | "Border" etc.
  contributor_id UUID REFERENCES contributors(id),
  verified BOOLEAN DEFAULT FALSE,
  reaction_count INT DEFAULT 0,
  bookmark_count INT DEFAULT 0,
  share_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### contributors
Verified real people inside specific communities who submit perspectives.

```sql
CREATE TABLE contributors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  community_id UUID REFERENCES communities(id),
  verified BOOLEAN DEFAULT FALSE,
  verification_status TEXT DEFAULT 'pending'
    CHECK (verification_status IN ('pending', 'approved', 'rejected')),
  named_attribution BOOLEAN DEFAULT FALSE,  -- opt-in to show name vs community only
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### users
Minimal user profiles. Follower counts are NOT a feature.

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### user_profiles
Extended user data — engagement history, not social graph.

```sql
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  home_community_id UUID REFERENCES communities(id),
  perspectives_read INT DEFAULT 0,
  communities_engaged INT DEFAULT 0,
  connections_made INT DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### reactions
Three types only: "I see this" / "I didn't know this" / "I agree"

```sql
CREATE TABLE reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  perspective_id UUID REFERENCES perspectives(id) ON DELETE CASCADE,
  reaction_type TEXT NOT NULL
    CHECK (reaction_type IN ('i_see_this', 'i_didnt_know_this', 'i_agree')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, perspective_id)   -- one reaction per user per perspective
);
```

### bookmarks
Users bookmark topics and perspectives.

```sql
CREATE TABLE bookmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  topic_id UUID REFERENCES topics(id) ON DELETE SET NULL,
  perspective_id UUID REFERENCES perspectives(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CHECK (
    (topic_id IS NOT NULL AND perspective_id IS NULL) OR
    (topic_id IS NULL AND perspective_id IS NOT NULL)
  )
);
```

### community_alignments
Where different communities agree on the same underlying statement.
Shows ONLY convergence, never division.

```sql
CREATE TABLE community_alignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id UUID REFERENCES topics(id) ON DELETE CASCADE,
  alignment_statement TEXT NOT NULL,  -- what they agree on
  community_ids UUID[],              -- array of community IDs that share this view
  agreement_pct INT,                 -- e.g. 87 (for "87% agreement across communities")
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### community_connections
Cross-community connection requests between users.
ONLY cross-community — same community connections not allowed here.

```sql
CREATE TABLE community_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id UUID REFERENCES users(id) ON DELETE CASCADE,
  recipient_id UUID REFERENCES users(id) ON DELETE CASCADE,
  topic_id UUID REFERENCES topics(id),        -- must be topic-anchored
  perspective_id UUID REFERENCES perspectives(id),
  status TEXT DEFAULT 'pending'
    CHECK (status IN ('pending', 'accepted', 'declined')),
  intro_message TEXT NOT NULL,   -- structured: "I'm from X. I read your community's perspective on Y..."
  created_at TIMESTAMPTZ DEFAULT NOW(),
  responded_at TIMESTAMPTZ,
  CHECK (requester_id != recipient_id)
);
```

### notifications

```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  -- 'new_perspective_on_bookmarked_topic'
  -- 'new_community_on_bookmarked_topic'
  -- 'alignment_shift'
  -- 'connection_request'
  -- 'connection_accepted'
  -- 'community_dialogue_response'
  payload JSONB,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Row Level Security (ALL tables from day one)
```sql
ALTER TABLE communities ENABLE ROW LEVEL SECURITY;
ALTER TABLE topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE perspectives ENABLE ROW LEVEL SECURITY;
ALTER TABLE contributors ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_alignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Example policies:
CREATE POLICY "Anyone can read communities"
  ON communities FOR SELECT USING (true);

CREATE POLICY "Anyone can read verified perspectives"
  ON perspectives FOR SELECT USING (verified = true);

CREATE POLICY "Users can only read their own notifications"
  ON notifications FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users manage their own reactions"
  ON reactions FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users manage their own bookmarks"
  ON bookmarks FOR ALL USING (auth.uid() = user_id);
```

---

## API ROUTES (Next.js App Router)

```
/api/topics
  GET                           All active topics (for sidebar)
  GET    ?status=hot|trending   Filtered by status

/api/topics/[slug]
  GET                           Single topic + perspective count

/api/topics/[slug]/bookmark
  POST                          Bookmark topic (auth required)
  DELETE                        Remove bookmark (auth required)

/api/perspectives
  GET    ?topic=&community=     Perspectives (filtered)
  GET    ?sort=recent|engaged|aligned    Sorted feed

/api/perspectives/[id]
  GET                           Single perspective + reactions

/api/perspectives/[id]/react
  POST   { reaction_type }      Add reaction (auth required)
  DELETE                        Remove reaction (auth required)

/api/perspectives/[id]/bookmark
  POST                          Bookmark perspective (auth required)
  DELETE                        Remove bookmark (auth required)

/api/communities
  GET    ?topic=                Communities active on topic (for map pins)
  GET    ?topic=&bbox=          Communities within map bounds

/api/communities/[id]
  GET                           Community + active perspectives

/api/alignment
  GET    ?topic=                Cross-community alignment data for topic

/api/connections
  POST   { recipient_id, topic_id, perspective_id, intro_message }
         Create connection request (auth required)

/api/connections/[id]
  PATCH  { status: 'accepted'|'declined' }   Respond to request

/api/map
  GET    ?topic=&bbox=          Map pin data (lat, lng, community_id, activity_level)

/api/feed/bookmarks
  GET                           User's bookmarked topics and perspectives (auth required)
```

---

## SHARED TYPESCRIPT TYPES

```typescript
// /shared/types/index.ts

export type CommunityType = 'civic' | 'diaspora' | 'rural' | 'policy' | 'academic' | 'cultural';
export type TopicStatus = 'active' | 'trending' | 'hot' | 'cooling' | 'archived';
export type ReactionType = 'i_see_this' | 'i_didnt_know_this' | 'i_agree';
export type ConnectionStatus = 'pending' | 'accepted' | 'declined';

export interface Community {
  id: string;
  name: string;
  region: string;
  country: string;
  latitude: number | null;
  longitude: number | null;
  community_type: CommunityType;
  color_hex: string;
  description: string | null;
  verified: boolean;
  active: boolean;
}

export interface Topic {
  id: string;
  title: string;
  slug: string;
  summary: string | null;
  status: TopicStatus;
  perspective_count: number;
  community_count: number;
  created_at: string;
  updated_at: string;
}

export interface Perspective {
  id: string;
  community_id: string;
  topic_id: string;
  quote: string;
  context: string | null;
  category_tag: string | null;
  verified: boolean;
  reaction_count: number;
  bookmark_count: number;
  share_count: number;
  created_at: string;
  // Joined
  community?: Community;
  topic?: Topic;
  user_reaction?: ReactionType | null;
  user_bookmarked?: boolean;
}

export interface User {
  id: string;
  email: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  created_at: string;
}

export interface UserProfile extends User {
  home_community_id: string | null;
  perspectives_read: number;
  communities_engaged: number;
  connections_made: number;
}

export interface CommunityAlignment {
  id: string;
  topic_id: string;
  alignment_statement: string;
  community_ids: string[];
  agreement_pct: number;
  communities?: Community[]; // joined
}

export interface MapPin {
  community_id: string;
  name: string;
  region: string;
  latitude: number;
  longitude: number;
  color_hex: string;
  community_type: CommunityType;
  perspective_count: number;
  activity_level: 'high' | 'medium' | 'low';
}

export interface ConnectionRequest {
  id: string;
  requester_id: string;
  recipient_id: string;
  topic_id: string;
  perspective_id: string | null;
  status: ConnectionStatus;
  intro_message: string;
  created_at: string;
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
ANTHROPIC_API_KEY=          # for content moderation only, not core feature
NEXTAUTH_SECRET=
NEXTAUTH_URL=

# Expo (mobile) — app.config.ts extra
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
EXPO_PUBLIC_MAPBOX_TOKEN=
```

---

## MVP FEATURES (build in this order)

### Phase 1 — Scaffold + Auth
- [ ] Full project scaffold (all dirs, configs, shared types)
- [ ] Supabase schema deployed (all 11 tables, RLS on all)
- [ ] Seed data: 5-7 demo communities, 3 active topics, 10-15 perspectives
- [ ] Auth: email/password + Google OAuth (web + mobile)
- [ ] Basic layout shell (sidebar, main content, right panel)

### Phase 2 — Map
- [ ] Mapbox dark vector map (Apple Maps aesthetic)
- [ ] Community pins with glow effect, color-coded by community_type
- [ ] Pin click opens community perspective preview
- [ ] Topic filter updates pin visibility
- [ ] LIVE indicator (top-right of map)
- [ ] No text on map — no labels, no abbreviations

### Phase 3 — Topic Sidebar
- [ ] PRISM logo/wordmark at top
- [ ] Search bar (topic full-text search)
- [ ] Live Now section with status indicators (HOT / TRENDING / NEW)
- [ ] Communities section (dynamic, filters by selected topic)
- [ ] Topic selection updates map + cards + alignment panel

### Phase 4 — Perspective Cards
- [ ] 2×2 grid desktop, stacked mobile
- [ ] Community identifier (icon + name + region)
- [ ] Verified badge
- [ ] Quote in italic serif (the most important element)
- [ ] Context paragraph
- [ ] Category tag
- [ ] Reaction buttons (👁️ "I see this" / 💡 "I didn't know this" / 🤝 "I agree")
- [ ] Share and bookmark controls
- [ ] Sort: most recent / most engaged / most aligned

### Phase 5 — Alignment Panel
- [ ] Right column: cross-community alignment data
- [ ] "Most Agreed" pull stat (headline number)
- [ ] Alignment statement list with community attribution
- [ ] Updates per selected topic
- [ ] Shows convergence ONLY — no division data

### Phase 6 — Engagement + Profiles
- [ ] Reaction system (all three types, one per user per card)
- [ ] Bookmarking (topics + perspectives)
- [ ] User profile page (engagement history)
- [ ] Notification system

### Phase 7 — Cross-Community Connection
- [ ] "Connect with someone from this community" button on perspective cards
- [ ] Structured intro message format
- [ ] Accept/decline flow
- [ ] Direct messaging after connection

### Phase 8 — Mobile
- [ ] React Native app mirrors web MVP
- [ ] Map full-width hero (40% viewport)
- [ ] Bottom navigation tabs
- [ ] Horizontal-scroll topic filter pills
- [ ] Thumb-first connection and sharing flows
- [ ] Expo push notifications

---

## WHAT NOT TO BUILD

These are explicitly excluded. Do not add without a specific decision:
- Comment sections (replaced by moderated community dialogue)
- Follower counts on user profiles
- Algorithmic feed optimizing for engagement or outrage
- Community profile pages as browsable accounts
- Open source data download section
- News aggregator or media bias ranking
- Polling or survey features
- Advertising of any kind
- Anything referencing prediction markets, forecasting, or probability scores

---

## UX DESIGN PRINCIPLES

1. Map first. It is the hero on every viewport size.
2. No text on the map. Zero. No labels, no city names, no abbreviations.
3. Topic-first navigation — communities surface under topics, not the reverse.
4. The quote is the most important element in every perspective card.
   It must be specific, human, and clearly from inside the community.
5. Mobile-first CSS — design at 375px first, scale up.
6. WCAG 2.1 AA contrast on all text.
7. Community colors identify community TYPE (not political leaning).
   Civic = one color. Diaspora = another. Rural = another. Never left/right color coding.
8. Reactions reward understanding, not validation.
   "I see this" is the most important interaction on the platform.
9. The platform asks questions. It does not deliver verdicts.

---

## SEED DATA FOR DEVELOPMENT

Use these communities and topics for dev/demo. Keep them realistic.

Communities (minimum for MVP demo):
- Chicago South Side (civic, Chicago IL)
- Rural Appalachia (rural, Eastern Kentucky)
- Somali-Canadian (diaspora, Toronto ON)
- Monterrey Mexico (civic, Monterrey MX)
- D.C. Policy Circles (policy, Washington DC)
- Houston Latino Community (civic, Houston TX)

Active topics for demo:
- US/Iran/Israel Bombing (status: hot)
- ICE Raids Nationwide (status: trending)
- El Mencho / Mexico Cartel (status: active)

---

## SECURITY REQUIREMENTS

- RLS on all 11 tables from day one. No exceptions.
- No API keys, secrets, or tokens hardcoded. Environment variables only.
- Input validation and zod schemas on all user-facing fields.
- Rate limiting on all Next.js API routes.
- Auth token validation on all protected routes.
- Dependency audit before any npm package is added.
- Claude security review on all code before it ships.

---

## DEPLOYMENT

### Web (Vercel)
- `git push origin main` triggers Vercel deploy
- Env vars set in Vercel dashboard
- Domain: prismreason.vercel.app (existing), prismreason.com (target)

### Supabase
- `supabase db push` for migrations
- RLS policies applied per migration
- Realtime enabled on perspectives and topics tables

### Mobile (Expo EAS)
- `eas build --platform all` for first build
- TestFlight (iOS) and internal track (Android)
- `eas submit` post-MVP for app store

---
