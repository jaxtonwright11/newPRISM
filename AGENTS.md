# AGENTS.md

## Cursor Cloud specific instructions

### Project overview

PRISM is a community perspective social media platform. The codebase is a monorepo:

| Directory | Purpose |
|---|---|
| `/web` | Next.js 14 App Router web app (TypeScript + Tailwind CSS) |
| `/shared/types/index.ts` | Shared TypeScript types used by web and future mobile app |
| `/docs` | Design specs, feature specs, technical spec — read before any task |

### Running the web app

```bash
cd /workspace/web && npm run dev
```

Dev server runs on `http://localhost:3000`.

### Lint, typecheck, build

```bash
cd /workspace/web
npm run lint          # ESLint
npx tsc --noEmit      # TypeScript strict check
npm run build         # Production build
```

### Key caveats

- **No Supabase or Mapbox configured yet.** The app runs with seed data and a map placeholder. When `NEXT_PUBLIC_MAPBOX_TOKEN` and Supabase env vars are added to `/web/.env.local`, the live map and database will activate.
- **Shared types path alias:** `@shared/*` maps to `../shared/*` via tsconfig paths. Import from `@shared/types` in web code.
- **Design spec is law.** Always read `/docs/PRISM_DESIGN_SPEC (1).md` before making UI changes. Dark theme colors, typography, and component specs are defined there.
- **Full technical spec:** `/docs/prism-full-spec.md` has the complete database schema (14 tables), API routes, and build order.
- **TypeScript strict mode** is enabled with zero `any` types policy. `tsc --noEmit` must pass.
- **Server components by default.** Only add `'use client'` when client interactivity is required.
