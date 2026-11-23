# Phase 1 — what works vs credentials

## Works without any credentials

| Capability | How |
|------------|-----|
| Sample content scripts | `samples/content/*.json` |
| Sample design profiles | `samples/design-profiles/*.json` |
| Content normalization | `@content-auto/content` |
| AI design spec generation | Deterministic mock AI |
| Schema validation | Zod `designSpecSchema` |
| Job storage + status workflow | Local JSON + Express API |
| Review dashboard | React app calling the API |
| Spec preview + JSON download | Dashboard |
| Editable Figma design creation | Plugin imports downloaded JSON into **new** frames |
| Tests | Normalization, schema, happy-path generate flow |

## Needs credentials (optional)

| Integration | Env vars | Phase 1 behavior without them |
|-------------|----------|-------------------------------|
| OpenAI | `OPENAI_API_KEY` | Mock AI produces valid specs |
| Figma REST | `FIGMA_ACCESS_TOKEN` | Mock file metadata; plugin still works offline |
| Google Sheets/Docs | `GOOGLE_SERVICE_ACCOUNT_JSON`, sheet/doc IDs | Local JSON samples; stubs throw if called |

## Explicitly out of scope

- Google OAuth
- Production Figma REST writes / overwriting reference templates
- n8n / workflow automation
- Multi-brand advanced AI, image generation
- Publishing / calendars / multi-user auth

## How to verify

```bash
npm install
npm test
npm run typecheck
npm run build
npm run dev          # API :3001 + dashboard :5173
```

Then: generate a job in the dashboard → download spec → Plugins → Development → import `plugins/figma` → paste JSON → Create editable design.
