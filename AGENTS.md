# AGENTS.md

## Cursor Cloud specific instructions

### Project Structure

PRISM is a greenfield community perspective social media platform. The codebase is organized as:

- `web/` — Next.js 14 App Router + TypeScript + Tailwind CSS (the main web application)
- `shared/types/index.ts` — Shared TypeScript types used across web and future mobile app
- `supabase/` — Supabase config and migration files (14 tables with RLS)
- `docs/` — Design specs, feature specs, and platform context documents
- `.cursor/rules/prism.md` — Cursor agent rules for the PRISM project

### Running the Web App

```bash
cd web && npm run dev
```

The dev server starts at `http://localhost:3000`. Hot reloading works for all source files.

### Lint and Type Check

```bash
cd web && npm run lint       # ESLint
cd web && npx tsc --noEmit   # TypeScript strict mode check
```

### Build

```bash
cd web && npm run build
```

### Key Gotchas

- **ShadCN v4 + Tailwind v3**: The project uses ShadCN UI components that have been downgraded to Tailwind CSS v3 compatibility. The `components.json` references `style: "base-nova"` but the actual components in `src/components/ui/` are v3-compatible rewrites. When adding new ShadCN components via `npx shadcn@latest add`, you **must** manually adjust them for Tailwind v3 syntax: replace `@import "shadcn/tailwind.css"` with `@tailwind` directives, remove `@base-ui/react` imports, and replace `useRender` patterns with standard `React.forwardRef`.
- **Supabase local dev requires Docker**: The Supabase CLI is installed as a dev dependency (`npx supabase`), but `supabase start` requires Docker, which is not available in the Cloud Agent environment. Use Supabase cloud project credentials in `.env.local` for testing, or mock data for UI development.
- **Supabase client is nullable**: `src/lib/supabase.ts` exports `supabase` as `SupabaseClient | null`. It returns `null` when the Supabase URL is not a valid HTTP(S) URL. Always null-check before using.
- **Environment variables**: Secrets are injected via environment. Copy `web/.env.example` to `web/.env.local` and fill in real values. Required: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_MAPBOX_TOKEN` (must start with `pk.`).
- **Health check endpoint**: `GET /api/health` reports the status of Supabase connection and env var configuration. Use it to verify credentials are working.
- **Shared types import path**: Components import from `../../../shared/types` (relative path). This works with the current directory structure but future work should add a path alias.
- **Mapbox map**: The `PrismMap` component (`src/components/prism-map.tsx`) dynamically imports `mapbox-gl` and gracefully falls back to an error message when the token is missing or invalid. Mapbox CSS is loaded via CDN link in `layout.tsx`.

### Spec Documents

Before building any feature, read the relevant spec docs in `docs/`:
- `prism-full-spec.md` — Full technical spec with schema, API routes, and types
- `PRISM_PLATFORM_CONTEXT_V2.md` — Platform philosophy and context
- `PRISM_FEATURES_V3.md` — Complete feature specifications
- `PRISM_DESIGN_SPEC (1).md` — Visual design spec
- `PRISM_SUPPLEMENTARY_V2.md` — What NOT to build, founder context
