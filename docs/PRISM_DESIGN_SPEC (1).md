# PRISM — Visual Design Specification v2
# Updated: March 2026
# PRISM is a social media platform. Design must feel social, alive, and human —
# not corporate, not a dashboard, not a SaaS tool.
# Reference: Snap Maps meets a thoughtful editorial publication.

---

## DESIGN PHILOSOPHY

PRISM should feel like the most interesting social feed you've ever opened —
except instead of your friends' lunch photos, you're seeing how people in
Monterrey, Rural Appalachia, and Toronto are experiencing the same news event.

The aesthetic is dark, warm, and geographic. Think Snap Maps' visual energy
combined with the editorial weight of a publication that takes ideas seriously.
It should feel alive — like something is always happening, someone is always
posting, and the world is always moving.

Do NOT make it look like:
- A corporate dashboard or analytics tool
- A news aggregator
- A SaaS product with purple gradients on white
- Twitter or Reddit (text-heavy, dense, argument-optimized)

DO make it feel like:
- Opening a map and seeing the world lit up with activity
- Discovering a perspective you've never encountered before
- A place where real people are talking, not broadcasting

---

## COLOR PALETTE

Background (primary): #0A0A0F — near-black with slight blue undertone
Background (secondary): #12121A — slightly lighter, used for cards and panels
Background (elevated): #1A1A26 — for modals, dropdowns, hover states
Border: #2A2A3A — subtle, never harsh
Text (primary): #F0F0F8 — off-white, easy on the eyes
Text (secondary): #8888A8 — muted purple-gray for metadata
Text (dim): #4A4A6A — timestamps, labels, tertiary info

Accent (LIVE indicator): #FF3B3B — red, only for LIVE dot
Accent (active/selected): #4A9EFF — blue for selected states and links
Accent (verified badge): #4AE87A — green
Accent (like/heart): #FF6B8A — warm pink-red for likes on personal posts
Accent (story ring): gradient from #FF6B8A to #F59E0B — signals active story

Community type colors (pins and card borders):
- civic: #4A9EFF (blue)
- diaspora: #A855F7 (purple)
- rural: #F59E0B (amber)
- policy: #10B981 (emerald)
- academic: #06B6D4 (cyan)
- cultural: #F97316 (orange)

These colors identify community TYPE only. Never political leaning.

---

## TYPOGRAPHY

Display / logo: Playfair Display or similar high-contrast serif
  Used for: PRISM wordmark, large quote text on perspective cards
  Feel: authoritative, editorial, not tech startup

Body / UI: Inter or DM Sans
  Used for: navigation, labels, metadata, buttons, post content
  Feel: clean, readable at small sizes, social media native

Quote text on perspective cards: Playfair Display Italic
  The quote is the most important element — it must LOOK important
  Larger than body text, italic, increased line height
  This is where the humanity lives

Numbers / stats: JetBrains Mono or similar
  Used for: agreement percentages, activity counts, radius labels
  Adds a data-grounded feel without going full dashboard

---

## THE MAP — MOST IMPORTANT ELEMENT

Visual reference: Snap Maps dark mode + Apple Maps smoothness
NOT a corporate data visualization. NOT geometric. NOT jagged.
Smooth, vector-based, alive with activity.

Map style:
- Dark ocean: #0D1117
- Land: #161B22
- Borders: #2A3441 (barely visible, just enough to distinguish regions)
- Vector tiles only — smooth at all zoom levels, never raster/pixelated
- NO text labels anywhere on the map. Zero. No city names, no country names.

Community perspective pins:
- Glowing dot, 10px diameter, filled with community type color
- Two glow rings radiating outward (30% and 15% opacity)
- Active/recent: larger glow (14px), brighter center
- Inactive: smaller (6px), minimal glow

Personal post pins (individual users):
- Smaller than community pins (6px base)
- Same community color but slightly desaturated
- No glow rings — simple dot with soft drop shadow
- Story indicator: animated color ring around the dot (story active)

Map heat (multiple communities posting same topic):
- Overlapping glow areas create a warm concentration of color
- Brighter = more activity on that topic in that region
- Tap the heat to see all perspectives side by side

LIVE indicator:
- Red dot (#FF3B3B) + "LIVE" in small caps
- Top-right corner of map container
- Subtle pulse animation on the red dot
- Never inside the map itself — sits in UI layer above

Map container:
- Hard-clipped edges — nothing overflows
- Slight inner shadow on edges
- Rounded corners: 12px radius

---

## LAYOUT

Desktop (three column):
```
[LEFT SIDEBAR — 260px]  [CENTER MAIN — flex]  [RIGHT PANEL — 320px]
```

Center main:
- Map: top 40% of viewport, always visible without scrolling
- Feed tabs below map: Nearby / Communities / Discover
- Content cards below tabs

Mobile:
- Map: full width, 40% of initial viewport
- Bottom navigation: Live / Map / Search / Bookmarks / Profile
- Cards: full width, vertically stacked
- Stories bar: horizontal scroll just below map (like Instagram stories)

---

## PERSPECTIVE CARDS

Size: ~380px × 240px on desktop (2-column grid)
Background: #12121A
Border: 1px solid #2A2A3A
Border-left: 3px solid [community type color]
Border-radius: 10px

Structure (top to bottom):
1. Community row: icon + name + region + verified badge
2. Quote: Playfair Italic, 16px, 1.6 line-height — THE MOST IMPORTANT ELEMENT
3. Context: body font, 13px, secondary color, 1-2 lines
4. Footer: category tag + reaction buttons (👁 💡 🤝) + share + bookmark

Reaction buttons:
- 👁 "I see this" — understanding without agreeing (most important)
- 💡 "I didn't know this" — discovery
- 🤝 "I agree" — alignment
- Count shown next to each, but never as status/competition
- No dislike. No downvote. No negative reaction. Ever.

---

## PERSONAL POST CARDS

Slightly different from perspective cards — more social, less editorial

Structure:
- User's community identifier (smaller than perspective card community header)
- Post content (body font, not italic serif)
- Image if attached
- Radius indicator: small pill "40 mi" in dim text
- Footer: ❤ like (with count) + comment count + share
- Story posts: small clock icon showing time remaining

Ghost mode indicator: when a user is in ghost mode, their posts still show their
community region but display as "Anonymous from [region]" — never exact location.

---

## STORIES BAR

Horizontal scroll just below the map, above feed tabs (mobile)
Or in the right panel on desktop as a vertical strip

Each story: circular avatar/community icon with colored ring
- Active story: gradient ring (#FF6B8A → #F59E0B) — same as Instagram
- Viewed story: dim ring (#2A2A3A)
- Community perspective stories: community icon + verified badge
- Personal stories: user avatar

Tap a story → full-screen story view with:
- Community/user identity at top
- Content fills screen
- Topic tag overlay
- Progress bar at top showing time remaining
- Swipe to dismiss

---

## FEED TABS

Three tabs in a horizontal pill selector:
- Nearby: posts + perspectives within your radius
- Communities: from communities you follow
- Discover: from communities you've never engaged with

Active tab: filled background, white text
Inactive tab: transparent, secondary text
Tab transition: smooth 150ms color change, content fades in

Discover tab visual distinction:
- Subtle "✦" sparkle icon next to the label
- First card in Discover always shows community you've never seen before
- Cards have a thin "NEW TO YOU" label in the top-right corner on first encounter

---

## COMMUNITY PULSE (daily hook)

Notification design:
- App icon badge: number of new perspectives from communities you follow
- Push notification: "[Community] added a perspective on [Topic]"
  — short, specific, never clickbait
- Home screen widget (if user opts in): shows today's most-agreed alignment stat

In-app Pulse panel (accessible from notification bell):
- "Today in your communities"
- Top topic across your followed communities
- Most-reacted perspective of the day
- New communities that posted on topics you've engaged with

---

## ONBOARDING AHA MOMENT DESIGN

This is the most important screen in the app. Get it right.

Screen 1 (no account required):
- Map loads immediately, full screen, live pins glowing
- One topic pulsing as "ACTIVE NOW" in the top left
- Single prompt below map: "Tap to see how 5 communities are experiencing this"

Screen 2 (after tap):
- Map filters to that topic, pins light up across geographies
- Two perspective cards slide up from the bottom
- Both on the same topic, from completely different communities
- No signup wall yet — just read

Screen 3 (after reading):
- Soft prompt: "Connect with these communities. Create your account."
- Not forced. Dismissable. But the value has already landed.

The AHA moment is the design. Everything else is scaffolding around it.

---

## ANIMATIONS

Map pins: gentle pulse on glow rings (2s loop, ease-in-out)
LIVE dot: slow pulse (3s loop)
Cards loading: staggered fade-in (50ms delay between cards)
Topic selection: map pins transition smoothly (300ms)
Story ring: slow gradient rotation (6s loop)
Feed tab switch: content fades in (200ms)
Discover "NEW TO YOU" badge: subtle shimmer on first appearance

No bouncing. No spring physics. No confetti.
Motion should feel intelligent and calm, not playful or gamified.

---

## WHAT NOT TO DO

- No dashboard aesthetic — this is social media, not analytics
- No white cards on white background
- No purple gradient hero sections
- No teardrop map markers — glowing dots only
- No text on the map (zero exceptions)
- No generic AI-looking interfaces
- No follower count displays
- No like count as primary status signal (show the number, don't make it the point)
- No color coding by political ideology
- No algorithmic feed surfacing outrage

---
