# PRISM Tool Synergy Map

## How All Tools Work Together for Maximum UI Quality

### Core Build Tools
- **Next.js 15 + Tailwind CSS** — Foundation. All styling via tailwind.config.ts tokens (prism-* namespace)
- **Framer Motion** — ALL animations. No CSS-only animations. fade-up, slide-in, stagger, scroll-triggered reveals
- **ShadCN/ui** — Base component primitives (Dialog, Tabs, Avatar, Tooltip)
- **Mapbox GL JS** — Map rendering with custom dark style, glowing dot pins, pulse animations

### Quality & Verification Tools
- **Playwright MCP** — Visual verification of every component. Screenshot at desktop (1280px) and mobile (375px). Navigate flows, verify interactions. Nothing is "done" without a Playwright screenshot.
- **PostHog MCP** — Analytics tracking verification. Confirm events fire correctly.
- **Supabase MCP** — Database operations, schema verification, RLS testing, data cleanup

### Design Enhancement Tools
- **magic-mcp (21st.dev)** — Check for premium component equivalents before building custom. Use `21st_magic_component_builder` for custom components, `21st_magic_component_inspiration` for design references
- **nano-banana-2** — Generate abstract UI visuals for landing page illustrations, PWA icons. NOT for photos of people.
- **frontend-design skill** — Apply to every component that looks generic. Enforces premium design patterns.
- **ui-ux-pro-max skill** — 67 styles, 96 palettes, 57 font pairings. Reference for design decisions.

### Workflow Tools
- **write-plan / execute-plan skills** — Structure multi-step phases before coding
- **dispatching-parallel-agents skill** — Run independent tasks simultaneously (security + perf + design audits)
- **verification-before-completion skill** — Never claim done without evidence
- **Vercel MCP** — Production deployment and verification

### Synergy Flow
1. **Design** → Check magic-mcp for inspiration → Apply frontend-design skill → Reference ui-ux-pro-max
2. **Build** → Framer Motion for all animations → Tailwind prism-* tokens for all colors → ShadCN for primitives
3. **Verify** → Playwright screenshot at desktop + mobile → Compare against spec → Fix gaps
4. **Ship** → Vercel deploy → Playwright against live URL → PostHog event verification
