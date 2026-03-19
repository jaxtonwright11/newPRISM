# PRISM — Features V3 (Social Platform Evolution)
# This document is an ADDENDUM to PRISM_SITE_FEATURES_V2.md.
# It documents new features added in March 2026 when PRISM evolved from
# a community perspective platform into a full geographic social network.
# Read V2 first, then read this.
# Last updated: March 2026

---

## WHAT CHANGED FROM V2

V2 established PRISM as a community perspective platform — map, perspective cards,
topic sidebar, alignment panel, contributor verification, cross-community connection.
All of that is still correct and still being built.

V3 adds a personal social layer on top: individual users can post from within their
community radius, create 24-hour stories, like posts, and appear as personal pins on
the map. This creates the daily retention mechanic that V2 was missing.

The mission has not changed. The platform still exists to answer: why can't we
understand each other? The social features serve that mission — they give users a
personal stake in the platform and a reason to return daily.

---

## NEW FEATURES IN V3

### 1. Personal Posts (individual user-generated content)

Users post from within their community radius. Posts appear on the map as personal pins
(smaller and visually distinct from official community perspective pins).

Post types:
- Permanent posts: stay on the map until deleted by the user
- Stories: 24-hour ephemeral posts, disappear automatically

Post content: text + optional image. No video creation (PRISM is not a content platform).

Reactions on personal posts: simple heart like. Count shown but not as status signal.
No dislike. No downvote. No negative reaction. Ever.

Privacy: posts never store exact GPS. All posts are radius-based — the map shows
the approximate community area, not the user's exact location.

### 2. Stories (24-hour ephemeral posts)

The primary daily retention mechanic.

Low-friction format: what's happening in your 40-mile world right now?
Stories disappear from the map after 24 hours, keeping the map current.
Stories have a visual indicator on the user's pin (animated ring, like Instagram).

Story content: text + optional image.
Stories appear in a horizontal scrollable bar just below the map.

Why this matters for retention: permanent posts have friction (people think before
posting something permanent). Stories have almost no friction. Daily story activity
keeps the map alive and gives users a reason to open the app every day.

### 3. Radius-Based Posting

Every post (permanent or story) is anchored to a radius, not an exact location.

Radius options: 10 / 20 / 30 / 40 miles
Default: 40 miles
Users can adjust per post or set a default in their profile.

The post appears on the map at the community's general location.
The database stores approximate coordinates (community center + randomized offset).
Exact GPS coordinates are NEVER stored for any post.

This is a privacy feature AND a community feature — you're posting as part of
your community, not as an individual at a specific address.

### 4. Ghost Mode

Users can browse the map without their own pin appearing.

Options:
- Visible: pin shows on map with radius indicator
- Ghost: pin hidden, user can still browse, read, and engage

Default: Visible (radius-only, not exact location)
Toggle accessible in one tap from the main UI — not buried in settings.

Ghost mode is enforced at the database query level. When ghost_mode = true,
the user does not appear in ANY map query or API response.

Why this is non-negotiable: any location-based app without a privacy mode
gets uninstalled immediately. Zenly had this. Snap Map has it.

### 5. Individual User Profiles (light)

When someone clicks a personal pin, they see a minimal profile:
- Community (region/city)
- Recent posts and stories
- Topics they engage with
- "X communities connected" (NOT follower count)

No follower counts anywhere on the platform.
Community identity is more important than individual identity.
Profile creation is NOT required to browse the map (see Onboarding AHA Moment).

### 6. Verification Tiers (replaces single verification level)

Three tiers instead of one:

Level 1 — Account created
Can: read, browse, like, react, discover
Cannot: post, connect, appear on map

Level 2 — Community confirmed
How: user enters location, basic geographic verification
Can: post personal posts with radius, connect with individuals, appear as personal pin
Cannot: submit official community perspectives

Level 3 — Verified contributor (original V2 verification)
How: application-based — community affiliation, proof of ties, sample perspective
Can: submit official community perspective cards
Perspectives attributed to community unless contributor opts into named attribution

This solves the cold start problem: users can participate (Level 2) without
going through the full contributor verification (Level 3). Both are valuable.

### 7. Feed Tabs

Three tabs that sit below the map, above the perspective cards:

Nearby:
Posts from within the user's radius, most recent first.
Shows both personal posts and community perspectives.

Communities:
Perspectives and posts from communities the user follows.
Filtered by topic if a topic is selected.

Discover:
The most important tab for PRISM's mission.
Explicitly surfaces perspectives from communities the user has NEVER engaged with,
specifically prioritizing views that differ from what they've reacted to before.
Algorithm: zero_prior_engagement communities, sorted by topical relevance,
filtered for diversity of viewpoint.
This is intentional friction — designed to expose, not confirm.
Do NOT optimize this feed for engagement or virality.

### 8. Community Pulse (daily retention hook)

A daily notification + home screen widget that makes opening PRISM habitual.

What it answers:
- What are the top topics in your communities today?
- What's the most-engaged perspective from communities you follow?
- Which new communities posted on topics you care about?

Push notification (opt-in, rare):
"[Community] added a perspective on [Topic]"
Short, specific, never clickbait. Not badge anxiety.

Without Community Pulse: engagement is reactive (users only open when news breaks).
With Community Pulse: engagement is habitual (users open daily to see what's active).

### 9. Map Heat

When many users from different communities post on the same topic simultaneously,
the map shows concentrated visual heat — brighter glow, overlapping pin auras.

Tap the heat → see all perspectives and posts side by side.

This is the PRISM magic moment: same event, multiple worlds, on one screen.
It's also what gives users a reason to open the app when news breaks.

Heat is NOT based on like counts or engagement volume.
Heat is based on: number of distinct communities actively posting on a topic.
This prevents outrage topics from gaming the heat system.

### 10. Direct Messaging

Available once a cross-community connection is accepted.

First message is always topic-anchored (the structured intro format from V2):
"I'm from [city/region]. I read your community's perspective on [topic] and wanted to connect."

After that: free conversation within the platform.

Future: small group chats between multiple connected individuals from different communities.

Architecture must support direct messaging from day one, even if the full UI ships post-MVP.

### 11. Onboarding AHA Moment

The most important design decision in the entire platform.

Research shows users decide whether an app is worth keeping in the first 90 seconds.
For PRISM that moment must be: reading two perspectives from completely different
communities on the same event and thinking "I never thought about it that way."

The sequence:
1. Open app → map loads immediately with live pins (NO loading screen)
2. One topic highlighted as ACTIVE NOW
3. Single prompt: "Tap to see how 5 communities are experiencing this"
4. Map filters, pins light up globally
5. Two perspective cards slide up — different communities, same topic
6. User reads both. AHA moment.
7. Soft, dismissable prompt: "Connect with these communities. Create your account."

Account creation NEVER gates the map. Show value first.
Profile creation, posting, connecting — all come AFTER the AHA moment.

---

## WHAT V3 DOES NOT ADD

Even though these might seem logical, they are explicitly excluded:

- Video creation or video posts (PRISM is text + image, not a content platform)
- Trending algorithm based on likes or engagement (use community participation instead)
- Dislike, downvote, or any negative reaction
- Follower counts (use "communities connected")
- Comment sections on individual posts (replaced by community dialogue, post-MVP)
- Exact GPS coordinate storage
- Same-community connections through the cross-community connection feature

---

## HOW V2 AND V3 WORK TOGETHER

V2 features (official community layer):
- Verified community perspective cards
- Topic sidebar with Live Now
- Cross-community alignment panel
- Contributor verification (Level 3)
- Cross-community connection requests

V3 features (individual social layer):
- Personal posts + stories (Level 2 users)
- Personal map pins
- Ghost mode
- Feed tabs (Nearby / Communities / Discover)
- Community Pulse
- Map heat
- Onboarding AHA moment
- Direct messaging

The two layers coexist on the map.
Official community perspectives = the authoritative, verified, editorial layer.
Personal posts = the live, social, human layer.
Together they make the map feel both credible AND alive.

---
