# ris-survey-ui

Tasks checking list (daily survey). Rebuilt from the 2.1.0 Nuxt 2 + MSSQL/MongoDB app as
**Astro (SSR) + Preact islands + Kysely/Postgres + Better Auth**, running on **Bun**.

## Features (same flows as 2.1.0)

- **Checklists** – create / edit / reorder (drag & drop) / soft-delete, unique title, unique list names.
- **Survey** – tick every item or mark it as a problem (`FAIL` / `WARN` / `INFO` + reason), draft kept in `localStorage`.
- **History** – grouped by day, worst status icon, per-status badges, editors.
- **Edit history** – only changed items get a new version; the version page shows older versions.
- **Auth** – e-mail + password, open registration, no e-mail verification.

Dropped on purpose: LDAP, `/api/monitor/*`, the LINE bot endpoint (LINE push is a log-only hook in `src/lib/notify.ts`, like 2.1.0).

## Run

```bash
cp .env.example .env            # DATABASE_URL, BETTER_AUTH_SECRET, BETTER_AUTH_URL
bun install
bun run migrate                 # creates / updates the schema (idempotent)
bun run dev                     # http://localhost:3000
```

Everything in docker (Postgres + app, migrations run on start):

```bash
docker compose up --build       # http://localhost:3000
```

## Tests

| What | Command |
| --- | --- |
| Unit (pure logic) | `bun test src` |
| Types | `bun run check` |
| End-to-end (Playwright), full stack in docker | `sh scripts/e2e-docker.sh` |
| End-to-end against a running app | `E2E_BASE_URL=http://localhost:3000 bunx playwright test` |

The docker run builds `web` + `db` + a Playwright container and exits non-zero if any test fails.
Reports land in `playwright-report/` and `test-results/`.

## Layout

```
src/lib/logic.ts      validation / status rules (unit tested)
src/lib/repo.ts       all SQL (Kysely), transactions
src/migrations/       Kysely migrations (Better Auth tables are migrated by Better Auth)
src/middleware.ts     session lookup, auth redirect / 401, CSRF origin check
src/pages/api/        JSON API: /api/tasks, /api/surveys, /api/health, /api/auth/*
src/components/       Preact islands: AuthForm, TaskEditor, SurveyForm
tests/e2e/            Playwright specs
```

## Notes

- Env: `AUTH_RATE_LIMIT=false` disables Better Auth's rate limit (the compose file does, for e2e). Keep it on in production.
- `BETTER_AUTH_SECRET` is required when `NODE_ENV=production`.
- Hostnames: don't name a compose service `app` for browser tests – `.app` is an HSTS-preloaded TLD and Chromium forces https.
