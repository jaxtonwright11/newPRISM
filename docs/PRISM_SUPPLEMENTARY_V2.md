# PRISM — Supplementary Context & Operational Notes (v2)

This document covers everything that didn't fit cleanly into the platform context or site features docs — founder background, key decisions made during ideation, damage control context, engagement philosophy, and operational notes for any AI or collaborator picking this up.

---

## About the Founder

**Jax** — 19 years old, UC Berkeley sophomore, Ventura County native.

**Academic:** Honors Economics and Political Science double major.

**Ventures:**
- PRISM (this platform) — community perspective social media platform, $46,000 seed funding secured
- AI automation consulting business — proven ROI for clients (Sush Town Restaurant: 260% customer growth, Ten Dash One Salon, Seaside Realty, healthcare sector work), targets Southern California service businesses
- Young & Gifted Youth Leadership Conference — organizes in Ventura County, 200 attendees at December 2025 event, featured speakers from Netflix, OpenAI, Chase Bank

**Congressional experience:** Interned with Senator Adam Schiff (D) and Representative Nancy Mace (R) on AI policy — bipartisan, D.C.-based. Delivered keynote at Harvard Kennedy School.

**Personal:** Climber, works out at Gold's Gym, competes at Mosaic Boulders. Values authenticity over polish. Direct, results-oriented. From Ventura County, maintains strong community ties.

**CRITICAL — Never mention or reference any Student Regent role in any documents, resumes, or communications.**

---

## How This Project Started (The Damage Control Origin)

Jax posted an Instagram story photo with the Hasidic Jewish community in Las Vegas. It got 30 shares — straight into group chats where people assumed he was a Zionist or a bigot. His girlfriend's friend sent the story to her with "oh...😭". He needed to address this without looking defensive.

The strategic decision: don't do damage control. Do a launch instead. Use the moment to introduce PRISM publicly, with the Hasidic community photo as the first slide of a carousel — contextualized within a list of 19 diverse communities so no single group looks like the focus. The post reframes the entire situation: he's not aligned with any ideology, he's studying all of them.

This is why the Instagram post names multiple communities explicitly: "From Black neighborhoods in the Central Valley, to policy circles in D.C., to the Hasidic Jewish community in Las Vegas." The list does the PR work without ever being defensive.

**IMPORTANT:** The Hasidic photo is the FIRST slide of the carousel — not because it's the focus, but because it's the most striking and creates the curiosity that the caption resolves. It's a deliberate hook.

---

## Key Strategic Decisions Made During Ideation

**1. PRISM is a social media platform.**
This is the current and final definition. Anyone calling PRISM a "forecasting startup," "LLM," or "AI foresight platform" is referencing an abandoned earlier concept. Correct that framing immediately.

**2. PRISM evolved from three distinct phases:**
- Phase 1: Critical thinking campaign (personal research methodology)
- Phase 2: Forecasting/LLM concept (abandoned)
- Phase 3 (current): Community perspective social media platform with map, perspective cards, engagement features, and cross-community connection

The Instagram caption language "It began as a critical thinking campaign, and it's now a platform..." acknowledges this evolution honestly. This framing is intentional — it normalizes iteration rather than obscuring it.

**3. Communities are not accounts.**
Communities don't have profile pages you browse. They surface under topics. You don't go to a "Hasidic Jewish Community" page — you search "Iran" and they appear. This prevents tribalism from being baked into the architecture.

**4. Show alignment, not division.**
The cross-community alignment panel shows only where communities agree. Division is already over-documented. Convergence is PRISM's unique insight and the most surprising, shareable data on the platform.

**5. The map is the centerpiece.**
Not the cards, not the stats — the map. The geographic visualization communicates the entire product in two seconds without a word.

**6. Open source data is a separate initiative.**
The Instagram caption mentions it. It is NOT a page, section, or feature of the platform itself. Do not add an "Open Source Data" section to the site.

**7. The community visit list is NOT a constraint on the platform.**
Jax visited 19 communities. The platform's perspective cards, map dots, and community lists can and should feature any real geographic/demographic communities globally. Don't anchor every card to his specific visits.

**8. Engagement is fully present — but redesigned.**
PRISM has engagement features. The original supplementary doc incorrectly said "no engagement optimization or comments." That has been corrected. The engagement system exists but is designed differently:
- Reactions reward understanding ("I see this," "I didn't know this," "I agree") not validation (generic like)
- Dialogue is moderated and structured community-to-community, not anonymous individual comment threads
- The discovery algorithm explicitly surfaces perspectives from communities you haven't engaged with before — designed to expose, not confirm
- Sharing, bookmarking, notifications, user profiles all exist

---

## The Instagram Carousel (5 Slides)

1. Photo with Hasidic Jewish community — Las Vegas (anchor slide, most striking, creates the curiosity the caption resolves)
2. Young & Gifted conference — shows Jax's own community work
3. Harvard — represents academic/Boston context
4. Professional meeting — D.C./real estate credibility
5. PRISM platform mockup (v5 PNG, 1080×1080) — makes the platform tangible, gives visual destination for the "re-launch" tease

---

## Mockup History (for reference — do not rebuild unless requested)

- **v1** — HTML browser desktop, 3-column layout
- **v2** — 1080×1080 PNG, same layout. Text spilled, formatting issues.
- **v3** — Map added (poor quality), wrong communities (too anchored to Jax's visits), open source section still present
- **v4** — Improved Mercator map, removed open source section, updated communities to Chicago/Toronto/Monterrey/Appalachia/Houston. Still had formatting issues.
- **v5 (FINAL)** — All issues fixed. White OS browser bar. Proper LIVE indicator spacing. Topic filter pills added. "Most Agreed" pull stat. Recently active mini-feed. Stats internally consistent. Alignment labels title-cased. Map hard-clipped. 6-month research box removed.

The v5 PNG is the final image used as slide 5 of the Instagram carousel. Do not regenerate unless explicitly requested.

---

## What "Re-launch" Means in the Caption

The post says PRISM is "getting closer to re-launch." This is intentional — it implies the platform has existed in a previous form (it has — the critical thinking campaign, the forecasting concept) and is being rebuilt as something more serious. It sets appropriate expectations: this is a tease of a platform in development, not a product available today.

---

## Engagement Philosophy — Extended Notes

PRISM's engagement mechanics are designed around one principle: reward behavior that creates understanding, not behavior that creates engagement for its own sake. This means:

- **Standard algorithmic feeds** optimize for content that makes you feel validated, outraged, or anxious. PRISM explicitly does not do this.
- **The discovery algorithm** (future feature) surfaces perspectives from communities you haven't engaged with — specifically prioritizing different viewpoints, not confirming ones.
- **The reaction system** (👁️ "I see this" / 💡 "I didn't know this" / 🤝 "I agree") rewards intellectual honesty over emotional reaction. "I see this" — understanding without agreeing — is the most important interaction on the platform.
- **Community dialogue** is moderated and structural. The conditions that make comment sections violent (anonymity, individual vs. individual combat, no community attribution) are removed by design.
- **The connection feature** (cross-community messaging) is the deepest engagement mechanic — and the most aligned with the platform's mission. Actually meeting someone from a different community is the goal.

---

## Cross-Community Connection Feature — Notes for Developers

This is a sensitive and important feature to get right. Key design principles:

- Connection requests must be topic-anchored. The message format is structured: "I'm from [city/region]. I read your community's perspective on [topic] and wanted to connect." This isn't a cold DM — it's context-anchored.
- Only verified community contributors can receive connection requests through this feature. This protects both sides.
- Same-community connections are not available through this feature — it is specifically for cross-community bridging.
- All messages subject to community guidelines. The platform is not responsible for what happens after connection, but the initiation must follow the guidelines.
- Declining a connection request is always easy and judgment-free.

---

## Contributor Verification — Notes for Developers

- Early phase: manual, relationship-based. Jax's community research establishes the first tier.
- Scaling phase: application-based — community affiliation, proof of ties, sample perspective.
- Perspectives are attributed to the community, not the individual contributor (unless the contributor opts in to named attribution).
- Contributors can flag submissions from others in their community that don't represent the community fairly.

---

## Technical Notes for Site Build

**Stack — not decided yet.** The mockup was Python/Pillow (image only). The actual site needs:
- Mapbox GL JS or Google Maps API for the map (Apple Maps aesthetic is the visual reference — custom dark vector tile styling)
- React or similar framework for component architecture
- A card component system
- Real-time or simulated recently active feed (WebSocket or polling)
- Auth/profile system (minimal — don't over-engineer)
- No complex backend required for MVP — static with hardcoded demo content is acceptable for early phase

**The v5 mockup PNG is the design spec.** Match it as closely as possible in the actual build.

---

## Tone Traps to Avoid

- Don't make PRISM sound like a DEI tool — it is a perspective intelligence social platform
- Don't make it sound like journalism — it's not reporting, it's sourcing
- Don't oversell the early-phase data — the platform is just starting, say so honestly
- Don't frame it politically left or right — the whole point is neither
- Don't reference forecasting — abandoned concept
- Don't make Jax sound like an activist — he's a researcher, builder, and organizer
- Don't describe engagement features as absent — PRISM is a social media platform with engagement mechanics

---

## Things That Are Real and Can Be Cited

- $46,000 seed funding for PRISM
- 19 communities engaged over 6+ months
- Congressional internships: Senator Adam Schiff (D), Representative Nancy Mace (R) — bipartisan AI policy
- Harvard Kennedy School keynote
- Young & Gifted conference: 200 attendees, December 6, 2025, Ventura County. Speakers from Netflix, OpenAI, Chase Bank.
- Sush Town Restaurant: 260% customer growth from AI automation
- UC Berkeley, Honors Economics + Political Science, sophomore

---

## Notes for Any AI Collaborator Picking This Up

- Jax's voice is direct, not corporate. Match it.
- He moves fast. Don't pad responses. Don't ask unnecessary clarifying questions.
- Communities are referenced by city/region, not ideology. "Rural Appalachia" not "conservatives." "Somali-Canadian" not "immigrants."
- "Damage control" is how this started internally — never use that framing externally.
- The Hasidic photo is the first carousel slide not to highlight that community but to create curiosity and then defuse assumptions by contextualizing it within 18 others.
- PRISM is a social media platform. It has engagement features. Do not describe it as having no comments or engagement — describe it as having engagement mechanics redesigned for understanding.
- The three founding questions are: (1) Why can't we understand each other? (2) Are people fine with being understood if it meant being exposed? (3) How do communities that never interact actually experience the same world?
- Do not add open source data sections, community profile pages, or generic comment sections.
- Cross-community connection is a core feature, not an afterthought.
- The map has no text on it. No labels. No abbreviations.
