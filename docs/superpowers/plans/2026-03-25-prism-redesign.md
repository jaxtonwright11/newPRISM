# PRISM Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild PRISM's frontend to match the design-decisions-v2.md spec — new color system, typography, 5-tab bottom navigation, map fix, fake data removal, empty states, onboarding, and engagement features.

**Architecture:** Replace the current three-column layout (sidebar + center + right panel) with a mobile-first 5-tab bottom navigation (Map / Feed / + / Discover / Profile). Each tab is a full-screen view. Colors shift from warm brown/copper to the v2 spec's warm amber on cool-dark-grey backgrounds. Sora replaces Playfair Display as the display font. All fake data removed; empty states invite action.

**Tech Stack:** Next.js 15, TypeScript, Tailwind CSS, Mapbox GL JS, Supabase (Auth + DB + Realtime), Framer Motion, Playwright (visual verification)

**Primary Reference:** `/home/joaquin/newPRISM/design-decisions-v2.md`

---

## File Map

### Files to DELETE
- `web/src/lib/seed-data.ts` — dead code, no longer imported
- `web/src/components/alignment-panel.tsx` — remove per v2 spec (Section 13)
- `web/src/components/topic-sidebar.tsx` — replaced by Discover tab
- `web/src/components/stories-bar.tsx` — unused, already hidden
- `web/src/components/early-access-banner.tsx` — remove urgency/marketing chrome
- `web/src/components/heat-perspectives-panel.tsx` — dependent on sidebar layout
- `web/src/components/onboarding-aha.tsx` — replaced by new onboarding flow

### Files to CREATE
- `web/src/app/(tabs)/layout.tsx` — tab layout wrapper with bottom nav
- `web/src/app/(tabs)/map/page.tsx` — full-screen Map tab
- `web/src/app/(tabs)/feed/page.tsx` — Feed tab (nearby + communities)
- `web/src/app/(tabs)/create/page.tsx` — Create perspective tab
- `web/src/app/(tabs)/discover/page.tsx` — Discover tab (search + trending)
- `web/src/app/(tabs)/profile/page.tsx` — Profile tab
- `web/src/components/tab-bar.tsx` — 5-tab bottom navigation component
- `web/src/components/prism-wordmark.tsx` — Sora wordmark + spectrum line
- `web/src/components/empty-state.tsx` — reusable empty state component
- `web/src/components/map-bottom-sheet.tsx` — perspective bottom sheet on pin tap

### Files to MODIFY (major)
- `web/tailwind.config.ts` — full palette replacement
- `web/src/app/globals.css` — CSS custom properties, font system
- `web/src/app/layout.tsx` — swap Playfair Display for Sora, update theme color
- `web/src/app/page.tsx` — gut current three-column layout, redirect to /feed or serve as landing
- `web/src/components/mobile-nav.tsx` — replace with tab-bar.tsx (or refactor in-place)
- `web/src/app/auth/callback/route.ts` — fix to use createServerClient
- `web/src/app/onboarding/page.tsx` — rebuild to 3-step v2 spec flow
- `web/src/components/perspective-card.tsx` — redesign per v2 Section 6
- `web/src/components/map-placeholder.tsx` — this is the canonical map component; fix rendering, update style, use everywhere
- `web/public/manifest.json` — update theme_color to match new palette

**Note on map components:** `map-placeholder.tsx` is the canonical map component used throughout the app. `prism-map.tsx` is an unused alternative — delete it during cleanup. Do NOT create a new `map-view.tsx`. The Map tab and Feed tab's collapsible preview both render `map-placeholder.tsx`.

---

## PHASE 1: CRITICAL BUG FIXES

**Ordering note:** The v2 spec says "colors first" but we fix auth and delete dead code first because those are functional bugs that don't touch colors. The map fix (Task 3) uses the current colors and will be updated when Phase 2 (Task 4) applies the new palette — the map style layers use CSS variable values that will automatically update. This is acceptable double-touch because the map layers reference hex values that change in Task 4.

### Task 1: Fix Auth Callback

**Files:**
- Modify: `web/src/app/auth/callback/route.ts`

- [ ] **Step 1: Rewrite auth callback with createServerClient**

Replace the entire file with:

```typescript
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  if (code) {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          },
        },
      }
    )
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) return NextResponse.redirect(`${origin}${next}`)
  }
  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`)
}
```

- [ ] **Step 2: Verify build passes**

Run: `cd /home/joaquin/newPRISM/newPRISM/web && npm run build`
Expected: Build succeeds with zero errors

- [ ] **Step 3: Commit**

```bash
git add web/src/app/auth/callback/route.ts
git commit -m "fix: use createServerClient for OAuth callback cookie handling"
```

### Task 2: Delete Dead Seed Data File

**Files:**
- Delete: `web/src/lib/seed-data.ts`

- [ ] **Step 1: Verify no imports remain**

Run: `grep -r "seed-data\|seed_data\|SEED_" web/src/app/ web/src/components/ web/src/lib/ --include="*.ts" --include="*.tsx" | grep -v "seed-data.ts" | grep -v "// "`

Expected: No active imports found (only comments)

- [ ] **Step 2: Delete the file**

```bash
rm web/src/lib/seed-data.ts
```

- [ ] **Step 3: Verify build passes**

Run: `cd /home/joaquin/newPRISM/newPRISM/web && npm run build`

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "chore: delete dead seed-data.ts"
```

### Task 3: Fix Map Rendering

The map shows as a black rectangle. The `map-placeholder.tsx` component uses Mapbox vector tiles (`mapbox-streets-v8`) with a custom dark style. The likely cause is either:
- Token misconfiguration
- The custom style layers not rendering properly (the landcover layer from mapbox-terrain-v2 only covers natural areas, not urban land)

**Files:**
- Modify: `web/src/components/map-placeholder.tsx`

- [ ] **Step 1: Check the Mapbox token is present**

```bash
grep "NEXT_PUBLIC_MAPBOX_TOKEN" web/.env.local
```

If missing, this is the root cause. Token must be set.

- [ ] **Step 2: Fix the map style to show geography**

The current custom style uses `mapbox-terrain` landcover layer for land — this only covers natural areas (forest, farmland, ice), NOT urban areas or general land masses. Most of the map renders as the ocean background color (#0A0908), making it look like a black rectangle.

Fix: Replace the land layer to use `mapbox-streets-v8` admin boundaries and water layers to define geography. The approach:
- Background color = land (fills everything)
- Water layer on top (oceans, lakes)
- Subtle admin boundaries for country/state borders
- No text labels (per spec)

In `map-placeholder.tsx`, replace the `PRISM_MAP_STYLE` object's layers array with:

```typescript
layers: [
  // Background = land color (fills everything first)
  {
    id: "background",
    type: "background",
    paint: { "background-color": "#181B20" }, // --bg-surface = land
  },
  // Water on top (oceans, lakes, rivers)
  {
    id: "water",
    type: "fill",
    source: "mapbox-streets",
    "source-layer": "water",
    paint: { "fill-color": "#0F1114" }, // --bg-base = ocean/water
  },
  // Country borders — very subtle
  {
    id: "admin-0-boundary",
    type: "line",
    source: "mapbox-streets",
    "source-layer": "admin",
    filter: ["==", ["get", "admin_level"], 0],
    paint: {
      "line-color": "#262A31", // --bg-overlay
      "line-width": 0.8,
      "line-opacity": 0.5,
    },
  },
  // State/province borders — even subtler
  {
    id: "admin-1-boundary",
    type: "line",
    source: "mapbox-streets",
    "source-layer": "admin",
    filter: ["==", ["get", "admin_level"], 1],
    paint: {
      "line-color": "#262A31",
      "line-width": 0.4,
      "line-opacity": 0.3,
    },
  },
]
```

This approach: background fills as land, then water paints over it, then subtle borders. No text labels. Result: recognizable geography on a dark, warm-grey base.

- [ ] **Step 3: Add zoom controls**

Add `NavigationControl` to the Mapbox map instance:
```typescript
map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'bottom-right');
```

- [ ] **Step 4: Hide Mapbox watermark**

Use the `attributionControl: false` option and add compact attribution:
```typescript
const map = new mapboxgl.Map({
  // ...existing options
  attributionControl: false,
});
map.addControl(new mapboxgl.AttributionControl({ compact: true }), 'bottom-left');
```

- [ ] **Step 5: Verify with Playwright**

Open the app, screenshot the map area. Confirm:
- Map tiles are visible (not a black rectangle)
- Geography is recognizable (continents, water)
- Community pins are visible with correct colors
- Zoom controls present
- No prominent Mapbox watermark

- [ ] **Step 6: Commit**

```bash
git add web/src/components/map-placeholder.tsx
git commit -m "fix: map rendering — proper land/water layers, zoom controls, hide watermark"
```

---

## PHASE 2: DESIGN SYSTEM

### Task 4: Color System

**Files:**
- Modify: `web/tailwind.config.ts`
- Modify: `web/src/app/globals.css`
- Modify: `web/public/manifest.json`

- [ ] **Step 1: Replace tailwind.config.ts color tokens**

Replace the entire `prism` color object with the v2 spec palette:

```typescript
prism: {
  bg: {
    base: "#0F1114",
    surface: "#181B20",
    elevated: "#1F2228",
    overlay: "#262A31",
  },
  text: {
    primary: "#EDEDEF",
    secondary: "#9CA3AF",
    dim: "#5C6370",
  },
  accent: {
    primary: "#D4956B",
    glow: "#E8B898",
    live: "#4ADE80",
    destructive: "#EF4444",
  },
  community: {
    civic: "#3B82F6",
    diaspora: "#A855F7",
    rural: "#F59E0B",
    policy: "#22C55E",
    academic: "#06B6D4",
    cultural: "#F97316",
  },
},
```

Note: This changes the Tailwind class prefix from `prism-bg-primary` to `prism-bg-base`, `prism-bg-secondary` to `prism-bg-surface`, etc. All component references must be updated.

- [ ] **Step 2: Update globals.css**

Replace CSS custom properties:
```css
:root {
  --background: #0F1114;
  --foreground: #EDEDEF;

  --bg-base: #0F1114;
  --bg-surface: #181B20;
  --bg-elevated: #1F2228;
  --bg-overlay: #262A31;

  --text-primary: #EDEDEF;
  --text-secondary: #9CA3AF;
  --text-dim: #5C6370;

  --accent-primary: #D4956B;
  --accent-glow: #E8B898;
  --accent-live: #4ADE80;
  --accent-destructive: #EF4444;
}
```

Update focus-visible and selection colors from copper (#C17F4E) to warm amber (#D4956B).

- [ ] **Step 3: Update manifest.json**

```json
{
  "background_color": "#0F1114",
  "theme_color": "#D4956B"
}
```

- [ ] **Step 4: Find-and-replace old color class names across ALL components**

Every component file uses the old Tailwind classes. This is the biggest mechanical step. Map:

| Old class | New class |
|-----------|-----------|
| `prism-bg-primary` | `prism-bg-base` |
| `prism-bg-secondary` | `prism-bg-surface` |
| `prism-bg-elevated` | `prism-bg-elevated` (unchanged) |
| `prism-border` | `prism-border` (update color value in config) |
| `prism-text-primary` | `prism-text-primary` (unchanged name, new value) |
| `prism-text-secondary` | `prism-text-secondary` (unchanged name, new value) |
| `prism-text-dim` | `prism-text-dim` (unchanged name, new value) |
| `prism-accent-active` | `prism-accent-primary` |
| `prism-accent-live` | `prism-accent-live` (new value: green not red) |
| `prism-accent-verified` | DELETE (no verified badges in v2) |
| `prism-accent-glow` | `prism-accent-glow` (new value) |
| `prism-accent-like` | `prism-accent-primary` (no separate like color in v2) |
| `prism-map-ocean` | Update to `#0F1114` |

Run: `grep -rn "prism-bg-primary\|prism-bg-secondary\|prism-accent-active\|prism-accent-verified\|prism-accent-like" web/src/ --include="*.tsx" --include="*.css"` and fix every instance.

- [ ] **Step 5: Update constants.ts community colors**

```typescript
export const COMMUNITY_COLORS: Record<CommunityType, string> = {
  civic: "#3B82F6",
  diaspora: "#A855F7",
  rural: "#F59E0B",
  policy: "#22C55E",
  academic: "#06B6D4",
  cultural: "#F97316",
};
```

(civic changes from #4A9EFF to #3B82F6, policy from #10B981 to #22C55E)

- [ ] **Step 6: Verify build passes and Playwright screenshot**

- [ ] **Step 7: Commit**

```bash
git add -A && git commit -m "design: apply v2 color system — warm amber on cool dark grey"
```

### Task 5: Typography System

**Files:**
- Modify: `web/src/app/layout.tsx`
- Modify: `web/tailwind.config.ts` (fontFamily section)
- Modify: Every component using `font-display` class

- [ ] **Step 1: Replace Playfair Display with Sora in layout.tsx**

```typescript
import { Sora, DM_Sans, JetBrains_Mono } from "next/font/google";

const sora = Sora({
  subsets: ["latin"],
  weight: ["500", "700"],
  variable: "--font-display",
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-body",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
  display: "swap",
});
```

Update the `<html>` className to use `sora.variable`.

- [ ] **Step 1b: Update fontFamily in tailwind.config.ts**

Ensure the fontFamily section maps to the CSS variables:

```typescript
fontFamily: {
  display: ["var(--font-display)", "system-ui", "sans-serif"],
  body: ["var(--font-body)", "system-ui", "sans-serif"],
  mono: ["var(--font-mono)", "monospace"],
},
```

Also add custom text size scale to match the v2 spec (the default Tailwind `text-xl` is 1.25rem but the spec defines it as 1.5rem):

```typescript
fontSize: {
  xs: ["0.75rem", { lineHeight: "1rem" }],      // 12px
  sm: ["0.875rem", { lineHeight: "1.25rem" }],   // 14px
  base: ["1rem", { lineHeight: "1.5rem" }],      // 16px
  lg: ["1.125rem", { lineHeight: "1.75rem" }],   // 18px
  xl: ["1.5rem", { lineHeight: "2rem" }],         // 24px — spec override
  "2xl": ["2rem", { lineHeight: "2.5rem" }],      // 32px
},
```

- [ ] **Step 2: Remove italic from perspective card quotes**

In `perspective-card.tsx`, the blockquote uses `font-display italic`. Per v2 spec Section 3: "No italic text on dark backgrounds" and "Perspective quote text uses DM Sans 400 Regular, not italic serif."

Change:
```tsx
<blockquote className="font-display italic text-base leading-relaxed text-prism-text-primary mb-3">
```
To:
```tsx
<p className="font-body text-base leading-relaxed text-prism-text-primary mb-3">
```

- [ ] **Step 3: Audit all font-display usage**

Run: `grep -rn "font-display" web/src/ --include="*.tsx" --include="*.css"`

`font-display` (Sora) should ONLY appear on:
- The PRISM wordmark
- h1 headings / section headers

Everything else must use `font-body` (DM Sans) or `font-mono` (JetBrains Mono for numbers).

- [ ] **Step 4: Verify with Playwright — screenshot Nearby and Discover sections**

Per Jax's feedback: "The fonts on the Discover and Nearby sections are particularly unappealing." Confirm they now use DM Sans consistently.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "design: typography system — Sora display, DM Sans body, no italic"
```

### Task 6: Navigation Restructure

This is the biggest structural change. We're replacing the three-column layout with 5-tab bottom navigation.

**Files:**
- Create: `web/src/components/tab-bar.tsx`
- Create: `web/src/app/(tabs)/layout.tsx`
- Create: `web/src/app/(tabs)/map/page.tsx`
- Create: `web/src/app/(tabs)/feed/page.tsx`
- Create: `web/src/app/(tabs)/discover/page.tsx`
- Modify: `web/src/app/page.tsx` — redirect to /feed or make it the tab layout root
- Delete: `web/src/components/topic-sidebar.tsx`
- Delete: `web/src/components/alignment-panel.tsx`

- [ ] **Step 1: Create the TabBar component**

```tsx
// web/src/components/tab-bar.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/map", label: "Map", icon: "map-pin" },
  { href: "/feed", label: "Feed", icon: "list" },
  { href: "/create", label: "", icon: "plus", isCreate: true },
  { href: "/discover", label: "Discover", icon: "compass" },
  { href: "/profile", label: "Profile", icon: "user" },
];
```

Implementation details:
- Fixed bottom, `bg-[var(--bg-surface)]` with top border `bg-[var(--bg-elevated)]`
- Active: filled icon + label in `var(--accent-primary)` (#D4956B)
- Inactive: outline icon + label in `var(--text-secondary)` (#9CA3AF)
- Center "+" button: 48px circle, `bg-[var(--accent-primary)]`, white + icon
- Labels: DM Sans 500 at 12px
- Min touch target: 48x48px per tab
- On desktop (>768px): moves to left sidebar rail

- [ ] **Step 2: Create the (tabs) route group layout**

```tsx
// web/src/app/(tabs)/layout.tsx
import { TabBar } from "@/components/tab-bar";

export default function TabsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col h-screen bg-[var(--bg-base)]">
      <main id="main-content" className="flex-1 overflow-hidden">
        {children}
      </main>
      <TabBar />
    </div>
  );
}
```

- [ ] **Step 3: Create Map tab page (full-screen map)**

Move map logic from current `page.tsx` into `(tabs)/map/page.tsx`. Full viewport. Tap pin → bottom sheet with perspective. No feed below the map.

- [ ] **Step 4: Create Feed tab page**

Move feed/perspective card logic from current `page.tsx` into `(tabs)/feed/page.tsx`. Scrollable card list, no map, no sidebars. Cards are full-width on mobile.

- [ ] **Step 5: Create Discover tab page**

Search bar at top, trending topics, communities to follow. Content from the old topic sidebar + discover feed merged.

- [ ] **Step 5b: Create Create tab page**

Full-screen compose form per v2 spec Section 4:
- Text input for perspective (max 500 chars visible, 2000 with "Read more")
- Auto-detected location display (from browser geolocation)
- Community selector (if user belongs to multiple)
- Submit button in `--accent-primary`
- Nothing else on this page — clean, focused creation experience
- If user is not logged in, show a soft signup prompt

- [ ] **Step 5c: Create Profile tab page**

Per v2 spec Section 4 and Section 9:
- User avatar, display name, location
- Contribution streak counter (JetBrains Mono number + flame icon in `--accent-primary`). Track consecutive days posted. No punishment for breaking streak.
- Founding Voice badge if user is first contributor in their neighborhood
- Tab sub-navigation: "My Perspectives" / "Saved" / "Settings"
- My Perspectives: list of user's posted perspectives
- Saved: bookmarked perspectives
- Settings: link to /settings page
- Empty state per v2 spec: "Your perspective matters." / "Everything you share here becomes part of your community's story."

- [ ] **Step 6: Update root page.tsx**

The root `/` should either:
- Redirect to `/feed` (if user is logged in)
- Show the landing page (if not logged in)

Or make `page.tsx` import from `(tabs)/feed/page.tsx`.

- [ ] **Step 7: Remove imports of old layout components**

Remove all imports of topic-sidebar, alignment-panel, early-access-banner, stories-bar, and onboarding-aha from page.tsx and any other files. The actual file deletions happen in Task 13 (Component Cleanup) to avoid duplicate operations.

- [ ] **Step 8: Delete old mobile-nav.tsx, replace with tab-bar.tsx**

- [ ] **Step 9: Verify with Playwright at 375px and 1280px**

Confirm:
- 5 tabs visible at bottom on mobile
- Map and Feed are separate tabs (not sharing screen)
- Each tab's purpose is clear from icon + label
- Center "+" button is visually distinct
- Desktop: tab bar moves to left rail or stays at bottom

- [ ] **Step 10: Commit**

```bash
git add -A && git commit -m "design: 5-tab bottom navigation — Map, Feed, Create, Discover, Profile"
```

### Task 7: Perspective Card Redesign

**Files:**
- Modify: `web/src/components/perspective-card.tsx`

- [ ] **Step 1: Redesign card per v2 spec Section 6**

Key changes:
- Remove verified badge (all green checkmarks gone)
- Remove "NEW TO YOU" badge
- Remove italic serif font from quote
- Add individual author name (not just community name)
- Card bg: `var(--bg-surface)` (#181B20)
- Card hover: `var(--bg-elevated)` (#1F2228)
- No border — use elevation/shadow
- Border-radius: 12px
- Padding: 16px
- Gap between cards: 8px
- Community color dot before community name
- Author name in text-secondary
- Location + relative time in text-dim
- Quote in DM Sans 400 Regular at text-base
- Engagement counts in JetBrains Mono, show 0 as just the icon

- [ ] **Step 2: Verify with Playwright screenshot**

- [ ] **Step 3: Commit**

```bash
git add web/src/components/perspective-card.tsx
git commit -m "design: perspective card v2 — no italic, no verified badges, author attribution"
```

### Task 8: Logo / Wordmark

**Files:**
- Create: `web/src/components/prism-wordmark.tsx`
- Modify: Tab bar and any component showing the PRISM logo

- [ ] **Step 1: Create Sora wordmark with spectrum line**

Per v2 spec Section 8:
- "PRISM" in Sora 700 Bold
- Color: `var(--text-primary)` (#EDEDEF)
- Thin horizontal gradient line beneath using the 6 community colors in order
- No circle. No icon-in-circle. No monogram.

```tsx
export function PrismWordmark({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const textSize = { sm: "text-lg", md: "text-xl", lg: "text-2xl" }[size];
  return (
    <div className="flex flex-col items-start">
      <span className={`font-display font-bold tracking-wide text-[var(--text-primary)] ${textSize}`}>
        PRISM
      </span>
      <div
        className="h-[2px] w-full rounded-full mt-0.5"
        style={{
          background: "linear-gradient(to right, #3B82F6, #A855F7, #F59E0B, #22C55E, #06B6D4, #F97316)",
        }}
      />
    </div>
  );
}
```

- [ ] **Step 2: Replace old logo in tab bar / nav**

Remove the purple circle-P logo from topic-sidebar (already deleted) and mobile header. Use PrismWordmark in its place.

- [ ] **Step 3: Verify with Playwright**

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "design: PRISM wordmark — Sora bold with spectrum gradient line"
```

---

## PHASE 3: EMPTY STATES AND ONBOARDING

### Task 9: Empty State Components

**Files:**
- Create: `web/src/components/empty-state.tsx`
- Modify: Feed, Map, Discover, Profile pages

- [ ] **Step 1: Create reusable EmptyState component**

```tsx
interface EmptyStateProps {
  heading: string;
  body: string;
  ctaLabel?: string;
  ctaHref?: string;
  onCtaClick?: () => void;
  secondaryLabel?: string;
  secondaryHref?: string;
}
```

- Heading: Sora 700 at text-xl
- Body: DM Sans 400 at text-base, text-secondary
- CTA: accent-primary button
- Secondary: text link in text-secondary

- [ ] **Step 2: Apply empty states per v2 spec Section 7**

Use the exact copy from design-decisions-v2.md:

**Feed:** "Your neighborhood doesn't have a voice yet." / "Be the first to share a perspective from [detected location]."
**Map:** "You're here." / "No perspectives from this area yet..."
**Discover:** "PRISM is just getting started." / "Communities across the country are beginning to share..."
**Profile:** "Your perspective matters." / "Everything you share here becomes part of your community's story."

**Feed (user has posted, no one else has):** "You're a founding voice in [neighborhood]." / "You're one of the first people on PRISM here. Everything you post becomes the foundation." Show user's own perspectives below.

- [ ] **Step 3: Verify with Playwright — all 5 empty states look designed**

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "design: empty states with purpose-driven copy per v2 spec"
```

### Task 10: Onboarding Flow

**Files:**
- Modify: `web/src/app/onboarding/page.tsx`

- [ ] **Step 1: Rebuild to 3-step v2 spec flow (Section 10)**

Step 1: "What neighborhood are you in?" — Map centered on detected location, auto-detect via browser geolocation, manual entry, "This is me" button.

Step 2: "What's one thing about your neighborhood that outsiders don't understand?" — Compose form, location pre-filled, "Post" and "Skip for now" buttons.

Step 3: Navigate to Feed tab showing user's perspective (if posted) at top.

- [ ] **Step 2: Ensure no signup gate on browse**

The main app (map, feed) must be accessible without signup. Signup only prompted when user tries to post or interact.

- [ ] **Step 3: Verify with Playwright**

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "feat: 3-step onboarding — location, first perspective, feed"
```

---

## PHASE 4: ENGAGEMENT FEATURES

### Task 11: Verify Core Engagement Actions

**Files:** Various components and API routes

- [ ] **Step 1: Verify post creation works end-to-end**

Test with Playwright: tap create tab → write perspective → submit → appears in feed.
If broken, fix the create-post-modal and API route.

- [ ] **Step 2: Verify reactions work**

Test: tap a reaction on a perspective card → count updates → persists on refresh.
The v2 spec doesn't define specific reaction types differently, but the current "I see this / I didn't know this / I agree" reactions are reasonable. Keep them.

- [ ] **Step 3: Verify bookmark works**

Tap bookmark → saved → accessible from profile.

- [ ] **Step 4: Verify share works**

Tap share → native share dialog or clipboard copy.

- [ ] **Step 5: Add community-attributed replies**

When replying, show which community the user is speaking from. This is the key differentiator from a comment section.

Check if reply functionality exists. If not, create a reply component that:
- Shows user's community name + color dot
- Text input
- Posts as a threaded reply to the perspective

- [ ] **Step 6: Commit any fixes**

```bash
git add -A && git commit -m "feat: verify and fix engagement actions — post, react, bookmark, share"
```

### Task 11b: Retention Mechanics

Per v2 spec Section 9 — these are marked HIGH priority. Build the data model and in-app display now; push notifications come later.

**Files:**
- Create: `web/src/lib/streak.ts` — streak calculation logic
- Modify: `web/src/app/(tabs)/profile/page.tsx` — display streak + founding voice
- Modify: `web/src/app/(tabs)/feed/page.tsx` — notification badge for Local Pulse
- Create: `web/src/app/api/pulse/daily/route.ts` — daily pulse data endpoint (if not exists)

- [ ] **Step 1: Build contribution streak counter**

Track consecutive days a user has posted a perspective. Logic:
- Query user's posts grouped by date
- Count consecutive days ending at today
- Return streak count

Display on Profile tab: JetBrains Mono number + subtle flame icon in `--accent-primary`. At 7-day streak, show "7-day streak — you're a regular voice here."

No punishment for breaking — streak resets silently. No "you lost your streak" message.

- [ ] **Step 2: Build Founding Voice badge**

If a user is the first contributor in their geocoded neighborhood:
- Badge: "Founding Voice — [Neighborhood]"
- Appears on profile and next to name on perspectives
- Permanent — even after others join

Implementation: check if any other users have posted from the same neighborhood before this user's first post. If not, they get the badge.

- [ ] **Step 3: Build Local Pulse in-app badge**

The daily notification system, implemented as an in-app badge for now:
- Endpoint `/api/pulse/daily` returns: new perspectives near user, or cross-location content if local is empty
- Feed tab shows a notification dot/badge when new pulse content exists
- Tapping the badge scrolls to the pulse content

Notification copy:
- If local activity: "[X] new perspectives near you"
- If no local activity: "Your neighborhood is quiet today. [Similar neighborhood] is talking about [topic]."

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "feat: retention mechanics — streak counter, founding voice badge, local pulse"
```

---

## PHASE 5: MAP TOGGLE AND POLISH

### Task 12: Map Toggle (collapsible)

Per Jax's feedback: "The map takes up too much space. It must be toggleable."

In the v2 spec, map and feed are SEPARATE TABS. This inherently solves the problem — the map doesn't compete with the feed. However, we should also add a map preview at the top of the Feed tab that's collapsible.

**Files:**
- Modify: `web/src/app/(tabs)/feed/page.tsx`

- [ ] **Step 1: Add collapsible map preview to Feed tab**

- Default: small map peek (120px) at top of feed
- Tap to expand to 40vh
- Tap again or swipe down to collapse
- Framer Motion animation between states
- State stored in React state (session-scoped)

- [ ] **Step 2: Verify with Playwright**

- [ ] **Step 3: Commit**

```bash
git add -A && git commit -m "feat: collapsible map preview on Feed tab"
```

### Task 13: Component Cleanup

**Files:** Various

- [ ] **Step 1: Delete all removed components**

```bash
rm web/src/components/alignment-panel.tsx
rm web/src/components/topic-sidebar.tsx
rm web/src/components/stories-bar.tsx
rm web/src/components/early-access-banner.tsx
rm web/src/components/onboarding-aha.tsx
rm web/src/components/heat-perspectives-panel.tsx
rm web/src/components/prism-map.tsx
```

- [ ] **Step 2: Remove all imports of deleted components**

Run: `grep -rn "alignment-panel\|topic-sidebar\|stories-bar\|early-access-banner\|onboarding-aha\|heat-perspectives-panel\|prism-map" web/src/ --include="*.tsx" --include="*.ts"`

Fix every file.

- [ ] **Step 3: Search for any remaining old color/font references**

```bash
grep -rn "burgundy\|#8B1A2E\|#C23B5A\|#0D0B08\|#15120E\|#1D1914\|Playfair\|font-display italic\|prism-accent-verified" web/src/ --include="*.tsx" --include="*.css" --include="*.ts"
```

Fix every instance.

- [ ] **Step 4: Verify build passes**

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "chore: delete deprecated components, remove old color/font references"
```

---

## PHASE 6: QUALITY PASS

### Task 14: Visual Consistency Audit

- [ ] **Step 1: Playwright screenshot every page at 375px**

Pages: /feed, /map, /discover, /profile, /create, /login, /signup, /onboarding, /settings, /messages, /notifications

- [ ] **Step 2: Playwright screenshot every page at 1280px**

Same pages.

- [ ] **Step 3: For each screenshot, verify:**
- Only v2 palette colors used
- Only Sora / DM Sans / JetBrains Mono fonts
- No purple logos, no burgundy, no verified badges
- Tab bar correct on all pages
- Empty states look designed, not broken
- Mobile (375px): cards full-width with 16px horizontal padding, no horizontal scroll, all tap targets 48px+
- Desktop (>768px): two-column card layout on Feed and Discover tabs allowed
- Desktop (>1200px): three-column only if content justifies it

- [ ] **Step 4: Fix every inconsistency found**

- [ ] **Step 5: Commit fixes**

### Task 15: Deploy and Final Verification

- [ ] **Step 1: Deploy to Vercel**

```bash
cd web && npx vercel deploy --prod
```

- [ ] **Step 2: Run Playwright on live URL**

Full walkthrough: landing → feed → map → discover → profile → create → back to feed.
Screenshot every page.

- [ ] **Step 3: Lighthouse audit on live URL**

Target: 90+ Performance, 95+ Accessibility, 100 Best Practices, 100 SEO.

- [ ] **Step 4: Fix any issues found**

- [ ] **Step 5: Final commit**

```bash
git add -A && git commit -m "polish: final visual consistency and performance fixes"
```

### Task 16: Update CLAUDE.md

- [ ] **Step 1: Update CLAUDE-PRISM-MASTER.md**

Replace:
- Old color values with v2 palette
- Old typography spec with Sora + DM Sans + JetBrains Mono
- Old navigation description with 5-tab bottom bar
- Add session history noting this redesign

- [ ] **Step 2: Commit**

```bash
git add CLAUDE-PRISM-MASTER.md
git commit -m "docs: update CLAUDE.md to reflect v2 redesign"
```

---

## EXECUTION NOTES

- **Playwright verification is required** after every visual change. No task is done without a screenshot confirming correctness.
- **The v2 spec is authoritative.** If the current code conflicts, the spec wins.
- **Community type colors are the only colors that stay unchanged** (except minor value shifts: civic #4A9EFF→#3B82F6, policy #10B981→#22C55E).
- **No verified badges** until a real verification system exists.
- **No italic text** on dark backgrounds.
- **No fake data** — everything starts empty with designed empty states.
