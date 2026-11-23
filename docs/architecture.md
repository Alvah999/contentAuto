# Architecture — contentAuto Phase 1

## Overview

Modular monorepo that turns content scripts + design reference profiles into schema-validated design specs, then into editable Figma layers via a plugin. A local React dashboard drives generation and review.

```
samples/ ──► content provider ──► normalize ──► AI provider ──► design spec (Zod)
                                      ▲                              │
                          design profiles                            ▼
                                                           JSON job store
                                                                 │
                     dashboard ◄──── Express API ◄───────────────┘
                                                                 │
                                              Figma plugin (import spec → new frames)
```

## Packages

| Package | Role |
|---------|------|
| `@content-auto/shared` | Shared types + Zod schemas (`DesignSpec`, job statuses) |
| `@content-auto/content` | Content provider interface, local JSON, Google stubs, normalization |
| `@content-auto/design-engine` | Profiles, spec validation, Figma REST adapter (read-only / mock) |
| `@content-auto/ai` | AI provider interface; OpenAI when keyed, else deterministic mock |
| `@content-auto/storage` | Local JSON job store + sample loaders |
| `@content-auto/workflows` | Generate pipeline + status machine |
| `@content-auto/api` | Express HTTP API |
| `@content-auto/dashboard` | React + Vite review UI |
| `@content-auto/figma-plugin` | Creates editable Figma layers from a DesignSpec |

## Job status machine

`draft → generated → in_review → approved | revision_requested | rejected → exported`

- `revision_requested` may return to `draft` or `generated`
- Invalid transitions are rejected by the API

## Adapters (credentials optional)

- **Content:** `LocalJsonContentProvider` (active). `GoogleSheetsContentProvider` / `GoogleDocsContentProvider` are stubs.
- **AI:** `MockAiDesignProvider` without `OPENAI_API_KEY`; `OpenAiDesignProvider` when set (falls back to mock if response fails validation).
- **Figma REST:** `MockFigmaAdapter` without `FIGMA_ACCESS_TOKEN`; live read metadata only when set. **Never overwrites references** — `overwriteReference` always throws.
- **Figma plugin:** offline; imports JSON into **new** frames only.

## Storage

Jobs persist as `data/jobs/<id>.json`. Samples live under `samples/content` and `samples/design-profiles`.

## Future MEMENTO OS

Integrate only via clear HTTP APIs from this app — no coupling into Memento-/ursgal-agency codebases.
