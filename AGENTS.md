# AGENTS.md

## Cursor Cloud specific instructions

### Overview

CRO Agent SaaS is an AI-powered Conversion Rate Optimization platform built with Next.js 15, React 19, Tailwind CSS, and Supabase. See `README.md` for the full feature list.

### Running the app

- **Dev server**: `npm run dev` (runs on port 3000)
- **Build**: `npm run build`
- **Lint**: `npm run lint`

### Environment setup

- Copy `.env.example` to `.env.local` and fill in real values for full functionality.
- At minimum, set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` (even placeholders) — some API routes call `createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, ...)` directly without fallback, so the build will fail if these are empty.
- The `ANTHROPIC_API_KEY` is required for AI features (chat, CRO analysis, A/B test generation).

### Gotchas

- **ESLint**: The repo did not ship with an ESLint config. A `.eslintrc.json` extending `next/core-web-vitals` was added. `eslint@^8` and `eslint-config-next@15` must be installed as devDependencies since `eslint-config-next@16` requires ESLint 9 and has circular-structure issues with `next lint`.
- **`next lint` deprecation warning**: Next.js 15.5+ prints a deprecation notice for `next lint`. The command still works; the warning is informational only.
- **Build vs Dev**: `next.config.ts` has `eslint: { ignoreDuringBuilds: true }` and `typescript: { ignoreBuildErrors: true }`, so builds pass despite lint/type errors. The existing codebase has several lint warnings (unescaped entities, `<img>` usage, conditional hooks) that are pre-existing.
- **Auth middleware**: All non-API, non-login routes redirect to `/login` when unauthenticated. To access the dashboard, a real Supabase project with valid credentials is needed.
- **No automated tests**: The project has no test framework or test files. Testing is manual via the browser.
