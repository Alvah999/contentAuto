# contentAuto

AI-powered Figma content automation — **Phase 1 local MVP**.

Sample content scripts + design profiles → normalized content → schema-validated design specs (OpenAI or mock) → editable Figma layers via plugin → local review dashboard.

> Independent app. Does **not** modify Memento- or ursgal-agency.

## Quick start

```bash
cp .env.example .env   # optional — works with empty keys (mock AI / mock Figma REST)
npm install
npm test
npm run typecheck
npm run build
npm run dev            # API http://localhost:3001 + dashboard http://localhost:5173
```

Or separately:

```bash
npm run dev:api
npm run dev:dashboard
```

## What you get

1. **Samples** — `samples/content/`, `samples/design-profiles/`
2. **Normalization** — stable structure for AI planning
3. **Design specs** — Zod-validated `DesignSpec` v1.0 (mock AI if no `OPENAI_API_KEY`)
4. **Figma plugin** — imports a spec and creates **new** editable frames/layers (never overwrites references)
5. **Dashboard** — generate jobs, preview specs, advance status:  
   `draft → generated → in_review → approved | revision_requested | rejected → exported`
6. **Express API** — content, profiles, generate, jobs, status

## API (main routes)

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/health` | Liveness + AI/Figma modes |
| `GET` | `/api/content` | List sample content scripts |
| `GET` | `/api/profiles` | List design profiles |
| `POST` | `/api/generate` | `{ contentId, profileId }` → job with design spec |
| `GET` | `/api/jobs` | List jobs |
| `GET` | `/api/jobs/:id` | Job detail |
| `GET` | `/api/jobs/:id/spec` | Design spec only |
| `PATCH` | `/api/jobs/:id/status` | `{ status, reviewNotes? }` |

## Figma plugin

1. Generate a job in the dashboard and **Download spec JSON**
2. In Figma: **Plugins → Development → Import plugin from manifest…**
3. Select `plugins/figma/manifest.json` (build first: `npm run build -w @content-auto/figma-plugin`)
4. Paste the JSON → **Create editable design**

## Environment

See [`.env.example`](./.env.example). All external services are mocked when credentials are missing.

## Docs

- [docs/architecture.md](./docs/architecture.md)
- [docs/phase1.md](./docs/phase1.md) — what works vs what needs credentials

## Monorepo layout

```
apps/api              Express API
apps/dashboard        React + Vite review UI
packages/shared       Types + Zod schemas
packages/content      Providers + normalization
packages/ai           OpenAI / mock design-spec generation
packages/design-engine  Profiles, validation, Figma REST adapter
packages/storage      JSON job store
packages/workflows    Generate + review pipeline
plugins/figma         Figma plugin
samples/              Sample content + profiles
tests/                Vitest suite
```
