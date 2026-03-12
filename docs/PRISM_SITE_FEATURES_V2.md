# PRISM — Site Features Specification
## For Developers & AI Collaborators Building the Actual Site

This document describes every feature of the PRISM platform — what each one is, what purpose it serves, where it lives on the site, how it functions technically and experientially, and what it does for the user. This is a build spec, not a design mockup description. No demo data is included here.

---

## 1. THE MAP

### What It Is
The Map is the emotional and functional centerpiece of the PRISM platform. It is a live, interactive geographic visualization showing where in the world people from verified communities are actively engaging with a selected topic in real time. It is modeled after the Apple Maps aesthetic — clean, dark, geographically accurate, and immediately readable.

### Purpose It Serves
The map communicates PRISM's entire value proposition in under two seconds without a single word of explanation. When a user sees that Chicago, Monterrey, and Toronto are all lit up on the same event with different colored pins, they instantly understand: the same world is being experienced differently depending on where you are. That insight — which takes paragraphs to explain in text — lands visually and immediately.

### Where It Lives
The map occupies the upper portion of the center column — roughly the top 35–40% of the main content area. It sits below the browser chrome and top navigation, and above the topic filter pills and perspective cards. It is always visible without scrolling on a standard desktop viewport. On mobile, it is the first thing a user sees after the navigation bar.

### How It Functions
- The map renders a geographic view of North America by default (Canada, United States, Mexico, Central America, northern tip of South America). A future global view toggle expands the viewport worldwide.
- When a user selects a topic (via sidebar or filter pills), the map updates to display community pins at real geographic coordinates of communities that have submitted perspectives on that topic.
- Pins are rendered with a glow effect — multiple rings emanating from a central dot — to signal activity and recency. A brighter, larger pin means more recent or more active discussion.
- Pins are color-coded by community type (see Design System in supplementary doc) — not by political leaning, ideology, or sentiment. Color = community category (civic/local, policy, diaspora, rural, etc.).
- Clicking or tapping a pin opens a focused view or panel showing that community's perspective card(s) for the selected topic.
- The map has no text labels on it. No country names, no city names, no abbreviations. All geographic context is implied visually, and all community context comes from clicking through.
- Country borders, state/province outlines, and terrain variation are visible but subtle. The visual hierarchy is: ocean → land → borders → dots. Dots always win visually.
- The LIVE indicator (a red dot + "LIVE" text) sits in the top-right corner of the map area, clearly separated from the pin cluster.
- Nothing overflows the map boundary. All pins and elements are hard-clipped inside the map container.

### Map Library Recommendation
Use Mapbox GL JS or Google Maps API — both support custom dark styling that matches the PRISM aesthetic. For Apple Maps visual fidelity, Mapbox with a custom dark terrain style is the closest match. The map should be vector-based, not raster, so it remains crisp at all resolutions.

### What It Does for the User
The map makes the abstract concept of "cross-community perspective" spatial and real. A user who searches "immigration" and sees pins light up from Montana to Mexico to Toronto understands immediately that this issue isn't monolithic — and they want to click the pins to find out why. The map creates curiosity that the perspective cards then satisfy.

---

## 2. TOPIC SIDEBAR (Left Column)

### What It Is
The left sidebar is the primary navigation layer of the platform. It is the entry point for discovering what the platform is covering right now and for filtering the entire experience to a specific topic. It is topic-first — not community-first, not user-profile-first.

### Purpose It Serves
The sidebar anchors the user's experience in current events. It communicates immediately: PRISM is not a static platform, it is live. There are things happening right now that communities are reacting to, and you can explore any of them.

### Where It Lives
The left column — fixed, always visible on desktop. On mobile, it collapses into a hamburger menu or bottom navigation bar, accessible at all times.

### How It Functions
**Logo/Wordmark:**
- PRISM logo at the top — serif font, with a geometric triangle accent on or near the letter. Always visible. Clicking it returns the user to the default home state (no topic selected, map in default view).

**Search Bar:**
- Full-text search for topics. As the user types, a dropdown shows matching current and past topics.
- Searching "immigration" surfaces every topic thread related to immigration across all communities — not just a single event.
- The search bar is the most efficient way for a new user to find something relevant to them personally.

**Live Now Section:**
- A curated list of currently active topic threads — real current events that communities are actively discussing right now.
- Each topic has a recency/heat indicator: HOT (breaking, high velocity), TRENDING (growing), NEW (just opened).
- The list updates as events develop. When a topic cools, it moves down or off the list.
- Clicking any topic: filters the map pins to that topic, updates the perspective cards, updates the cross-community alignment panel.

**Communities Section:**
- Shows which communities are active on the currently selected topic, listed by city/region.
- A colored dot indicates activity level — gold = currently active, dim = in the database but not contributing to this topic.
- This is NOT a directory of all communities. It dynamically updates based on the selected topic.
- Clicking a community name filters the perspective cards to only show that community's views.

**Bottom of Sidebar:**
- Intentionally has breathing room. Not every pixel needs to be filled. The sidebar should feel navigable, not dense.

### What It Does for the User
Orients the user instantly: "Here's what the world is reacting to right now. Pick one." It also gives returning users a reason to keep coming back — the list changes as the world changes.

---

## 3. PERSPECTIVE CARDS

### What It Is
Perspective Cards are the core content unit of PRISM — the way communities' voices actually surface on the platform. Each card represents one community's documented viewpoint on the selected topic. They are structured to be readable at a glance but substantive enough to be worth reading fully.

### Purpose It Serves
The cards do the core intellectual work of the platform. They translate raw community perspective into something digestible, attributable, and humanizing — without stripping out the specificity and texture that makes it meaningful. A card from Rural Appalachia about Iran bombing feels fundamentally different from a card from a Somali-Canadian community about the same event, and that difference is the entire point.

### Where It Lives
Below the topic filter pills, in the main center column. Default layout is a 2×2 grid on desktop, full-width stacked on mobile. The grid expands as more perspectives are added.

### How It Functions
**Card Structure (each card contains):**
- Community identifier: emoji or icon + community name (e.g., "Chicago South Side") + city/region (e.g., "Chicago, IL")
- Verified badge: indicates this community's contributors have gone through the verification process (real geographic/demographic sourcing, not anonymous internet users)
- Quote: a first-person statement in italic serif — the actual voice of someone from that community. This is the most important element on the card. It should be specific, not polished. Real over refined.
- Context paragraph: 1–2 sentences giving brief context for why the community sees it this way — what's at stake for them, what frame they're using
- Topic tag: a single category label (e.g., "Domestic Policy," "Diaspora," "Border") — not the event name itself
- Engagement indicator: shows how many people have engaged with this perspective (see Engagement section)

**Filtering:**
- Cards filter when the user selects a topic from the sidebar or clicks a map pin
- Cards also filter when the user clicks a topic filter pill (e.g., "Economy")
- Cards can be sorted by: most recent, most engaged, most agreed-upon cross-community

**Content sourcing:**
- Cards are populated by verified community contributors — real people inside specific geographic/demographic communities who have been vetted through the PRISM contributor process
- In the early phase, cards may be curated and written by the PRISM team based on direct community research (Jax's 6+ months of community visits)
- Long-term: the contributor network scales so communities self-report

### What It Does for the User
Gives the user the actual substance they came for. After the map creates curiosity ("why is Monterrey lighting up about this?"), the perspective card delivers the answer in a human, specific, attributable way. The user finishes reading a card knowing something they didn't know before — not just a different opinion, but a different frame for the same event.

---

## 4. TOPIC FILTER PILLS

### What It Is
A horizontal row of clickable category tags that allow users to filter the map and perspective cards by topic category rather than specific event.

### Purpose It Serves
Not every user arrives knowing which specific event they care about. Topic pills let users explore by theme — "I care about immigration" or "I'm following the economy" — and see how that theme is being discussed across communities right now.

### Where It Lives
Between the map and the perspective card grid — a horizontal strip that serves as the visual and functional bridge between the geographic view (map) and the textual view (cards).

### How It Functions
- Pills: All / Immigration / Foreign Policy / Economy / Culture / Race & Identity / Technology / Environment (categories expand as the platform grows)
- "All" is the default — shows everything currently active
- Selecting a pill filters the perspective cards AND dims/highlights map pins to show only communities discussing topics in that category
- Only one pill active at a time (or "All")
- Pills are dynamically generated based on what categories have active content — a pill doesn't show if there's nothing in that category right now

### What It Does for the User
Makes PRISM navigable for casual users who aren't tracking a specific breaking news event. Lets them explore by the themes that matter to them personally, which increases the platform's relevance beyond people who are already following the news closely.

---

## 5. CROSS-COMMUNITY ALIGNMENT PANEL (Right Column — Top Section)

### What It Is
A data visualization showing the statements and topics that have the highest agreement across otherwise very different communities. It does NOT show where communities disagree.

### Purpose It Serves
This is PRISM's sharpest insight and strongest differentiator. Every news channel, every social media platform, every algorithm already shows you where communities fight. PRISM shows you where they actually agree — even when they have completely different political identities, geographies, and values. That convergence is surprising, humanizing, and non-obvious. It is PRISM's most shareable, most cited data point.

### Where It Lives
Right column, top section — always visible on desktop, the first thing seen when scrolling the right panel on mobile.

### How It Functions
- Shows 3–5 statements with the percentage of communities that agree with each statement
- Each statement is a real finding derived from the perspectives collected — not a pre-written survey question
- Displayed as: statement label (title case, e.g., "Media Is Misleading Us") + percentage + filled bar
- Percentages update as new perspectives are added
- Clicking a statement filters the perspective cards to show only communities that expressed that view
- The panel updates when the user selects a different topic

**What qualifies for this panel:**
- A statement must be expressed (not just implied) by communities from at least 3 different geographic regions or demographic backgrounds
- Communities must be meaningfully different from each other — you can't say "everyone agrees" if the only communities submitting are similar
- Statements are surfaced bottom-up from the actual perspective content, not assigned top-down

### What It Does for the User
Surprises them. Specifically: it surprises users who came in expecting to see a platform that confirms division. Finding out that a Hasidic Jewish community in Las Vegas and a Black community in Central Valley and a rural Appalachian community all agree that "civilians bear the cost" — regardless of what they believe about who's right — is genuinely unexpected and worth sharing. This is the panel that gets screenshotted.

---

## 6. MOST AGREED PULL STAT

### What It Is
A single-number highlight of the highest cross-community alignment figure across all currently active data for the selected topic.

### Purpose It Serves
Distills the Cross-Community Alignment panel into one line. The most immediately communicable data point on the platform — designed to stop a scroll, be quoted in conversation, be referenced in articles.

### Where It Lives
Right column, below the alignment bars — its own contained box with a gold border treatment.

### How It Functions
- Displays: percentage (large, gold) + the statement it refers to (smaller, muted)
- Example: "91%" in large gold type / "Civilians Bear The Cost" in smaller muted text beneath
- Updates dynamically with topic selection
- Always shows the highest single alignment figure — not an average

### What It Does for the User
Creates a quotable moment. "91% of completely different communities agree that civilians bear the cost of this conflict." That sentence has legs — in a conversation, in a tweet, in a classroom.

---

## 7. RECENTLY ACTIVE FEED (Right Column — Bottom Section)

### What It Is
A live mini-feed showing the most recent perspective submissions to the platform — which community submitted, how long ago, and which topic.

### Purpose It Serves
Makes PRISM feel alive. Static data feels like a database. A mini-feed that shows "Monterrey, MX · 4 min ago · Iran/Israel" communicates: this is real, this is happening now, people are actively contributing to this.

### Where It Lives
Right column, below the Most Agreed pull stat.

### How It Functions
- Shows 3–5 entries at any time, ordered most recent first
- Each entry: green live dot + city/region + time elapsed + topic
- Time is relative ("4 min ago," "11 min ago," "2 hours ago") not absolute
- Clicking an entry jumps to that community's perspective card
- In early phase: this can be simulated with a curated feed of recent contributions. As the contributor network grows, this becomes truly real-time.

### What It Does for the User
Builds trust and urgency. A user who is deciding whether to engage with the platform sees that other people are engaging right now. It also surfaces communities the user might not have thought to look for.

---

## 8. ENGAGEMENT FEATURES

This section defines how PRISM functions as a social platform — not just an information platform. Engagement is built in synergy with the platform's core premise: critical thinking, cross-community understanding, and perspective exposure. Every engagement feature should make it easier to understand, not easier to fight.

### 8a. PERSPECTIVE REACTION SYSTEM
**What It Is:** Instead of a generic "like," users react to perspective cards with one of three options:
- 👁️ **"I see this"** — I understand where this is coming from, even if I don't agree
- 💡 **"I didn't know this"** — This perspective is genuinely new to me
- 🤝 **"I agree"** — I share this view

**Why These Three:** Standard likes optimize for content that makes you feel validated. These three reactions specifically reward content that teaches, challenges, or resonates — which is exactly the behavior PRISM wants to encourage. "I see this" is the most important one — it's the action of understanding without agreeing, which is PRISM's entire philosophical premise.

**Where it lives:** Bottom of each perspective card.

**What it does for the user:** Lets them engage meaningfully without reducing a community's lived experience to a thumbs up or down. Also surfaces which perspectives are landing as educational vs. resonant.

### 8b. PERSPECTIVE SHARING
**What It Is:** Each perspective card can be shared directly — as a card image (auto-generated), as a link, or as a quoted embed. Shared content always includes the community name, location, and a PRISM attribution.

**Why It Matters:** This is the primary growth mechanism. When a card from Chicago South Side about the Iran bombing gets shared on Twitter or Instagram, PRISM's value proposition spreads with it. Every share is a micro-advertisement.

**Where it lives:** Bottom-right of each perspective card.

### 8c. TOPIC BOOKMARKING
**What It Is:** Users can bookmark/save topics and communities they want to follow. When new perspectives are added to a bookmarked topic or from a bookmarked community, the user gets notified.

**Why It Matters:** Gives users a reason to return. Turns casual discovery into an ongoing relationship with specific topics and communities.

**Where it lives:** On the topic header (bookmark the whole topic) and on individual cards (bookmark a community).

### 8d. CROSS-COMMUNITY DIALOGUE (Moderated)
**What It Is:** A structured thread format where users from different communities can respond to each other's perspectives — but only in a structured, moderated environment. This is NOT a comment section. It is a facilitated exchange.

**How It Works:**
- A perspective card can have one "Community Response" thread attached to it
- Responses must come from verified community contributors — not anonymous users
- Responses are framed as "Community X responds to Community Y" — the community identity is always primary, not the individual
- Threads are moderated to remove anything that is attacking rather than engaging
- The thread format shows the original perspective and the response side by side — always in dialogue, never in a feed

**Why This Matters:** This is what makes PRISM feel like a social platform without becoming toxic. The moderation is structural — by requiring community verification and framing everything as community-to-community rather than person-to-person, you remove the conditions that make comment sections violent.

**Where it lives:** Below the perspective card, collapsed by default. Expanding it shows the dialogue thread.

### 8e. USER PROFILES (Minimal)
**What It Is:** Users have a profile — but it is deliberately minimal. No follower counts. No engagement metrics. No verification checkmarks for non-contributors.

**Profile Contains:**
- Display name
- Home region (city/country — optional but encouraged)
- Communities they've engaged with
- Perspectives they've reacted to (private by default, can be public)
- If they are a verified community contributor: their community affiliation

**Why Minimal:** The platform's social status comes from the quality of your community's perspective, not from your personal follower count. Keeping profiles minimal prevents PRISM from becoming about individual influence rather than collective understanding.

### 8f. COMMUNITY CONNECTION (Cross-Border)
**What It Is:** A lightweight system for connecting individuals who want to engage more directly with people from a specific community they've encountered on the platform.

**How It Works:**
- After reading a perspective card from a community (e.g., Monterrey, MX), a user can click "Connect with someone from this community"
- They are shown other verified community members from that community who have opted into connection requests
- Connection is initiated via a short structured message: "I'm from [city/region]. I read your community's perspective on [topic] and wanted to connect."
- The structured format prevents cold outreach from feeling invasive — it's always topic-anchored
- The receiving user can accept or decline
- Once connected, they can message directly within the platform

**Why It Matters:** This is the feature that makes PRISM more than an information platform. The goal was always to answer the question "why can't we understand each other?" — and the deepest answer is that we don't actually know anyone from communities different from our own. This feature gives users a real path to change that.

**Safeguards:** Connection requests must always include the topic that sparked the connection. Users from the same community cannot connect through this feature — it is specifically for cross-community bridging. All messages are subject to community guidelines.

**Where it lives:** On every perspective card — a small "Connect" button that opens the flow. Also accessible from the community profile page (future feature).

### 8g. DISCOVERY FEED (Optional — Future)
**What It Is:** For returning users, a personalized but not manipulative discovery feed showing perspectives from communities they haven't interacted with before — specifically prioritizing perspectives that are different from their own community's views on the same topic.

**Why "Not Manipulative":** Standard algorithmic feeds optimize for engagement by showing content that makes you angry or validates you. PRISM's discovery algorithm explicitly de-prioritizes both. It surfaces content that is: (1) from a community you haven't encountered, (2) on a topic you care about, and (3) expressing a view that differs from what you've reacted to before.

This is intentional friction — a design choice to expose rather than confirm.

---

## 9. TOP NAVIGATION

### What It Is
A slim global navigation bar at the top of the platform — always visible, always accessible regardless of what the user is doing.

### Purpose It Serves
Global wayfinding and account access. Keeps the experience oriented.

### Where It Lives
Directly below the browser chrome (desktop) or at the very top of the screen (mobile).

### How It Functions
- Left: PRISM wordmark (home button)
- Center: Global search bar (topic search — same as sidebar search, just globally accessible)
- Right: Notification bell (for bookmarked topic updates) + User avatar/profile
- On mobile: hamburger menu replaces sidebar; bottom navigation bar provides tab access to Feed, Map, Search, Notifications, Profile

---

## 10. CONTRIBUTOR VERIFICATION SYSTEM

### What It Is
The process by which real people from real communities become verified PRISM contributors — the supply side of the platform.

### Purpose It Serves
PRISM's entire credibility depends on the sourcing being real. A verified badge on a perspective card means that card came from someone who was vetted as actually being from that community — not an anonymous internet user claiming to represent a group.

### How It Functions (intended — full build)
- Contributors apply by submitting: their community affiliation, proof of residency or long-term community ties, and a sample perspective on a current topic
- PRISM team reviews applications and verifies community affiliation
- Verified contributors can submit perspectives on any topic — they are always attributed to their community, never to their individual name (unless they opt in)
- Contributors can flag other contributors whose submissions don't represent the community fairly
- The verification process is iterative — the bar gets higher as the platform matures

**In Early Phase:**
- Verification is manual and relationship-based — Jax's 6+ months of community visits established the first tier of trusted contributors
- Perspectives in the early phase are curated from direct community research and clearly labeled as such

---

## 11. NOTIFICATIONS

### What It Is
A notification system that alerts users when something relevant to them happens on the platform.

### Types of Notifications
- New perspective added to a bookmarked topic
- New community joins a bookmarked topic
- Cross-community alignment shifts significantly (e.g., a new alignment emerges or an existing one strengthens)
- A community you've connected with submits a new perspective
- Someone responds to your community dialogue

### Why Lightweight
Notifications should feel like valuable alerts, not badge anxiety. The goal is to bring users back when something worth returning for has happened — not to create compulsive checking behavior. Push notifications should be opt-in and rare.

---

## 12. MOBILE EXPERIENCE

### What It Is
A fully adapted mobile experience — not just a responsive shrink of the desktop layout.

### How It Differs from Desktop
- The map is the hero element — full-width, takes up roughly 40% of the initial viewport
- Sidebar becomes bottom navigation tabs: Live Now / Communities / Search / Profile
- Topic filter pills scroll horizontally without wrapping
- Perspective cards are full-width, vertically stacked
- Right panel (alignment, most agreed, recently active) is accessible by scrolling below the cards — or pulled into a collapsible panel
- Connection and sharing flows are designed for thumb-first interaction

---

## 13. WHAT THE SITE DOES NOT INCLUDE

These are explicitly excluded from the site build and should not be added without a specific decision to include them:

- A comment section (replaced by moderated community dialogue)
- Follower counts on user profiles
- An algorithmic feed that optimizes for engagement/outrage
- Community profile pages as browsable accounts (communities surface under topics)
- An "Open Source Data" download section (separate initiative, not a platform page)
- A news aggregator or media bias tool
- Polling or survey features
- Any form of advertising
