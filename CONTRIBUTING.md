# Contributing to TurnFlow Home

Thanks for your interest in contributing. This document gives a short path to get you up and running, explains the most common tasks contributors do, and lists the quality gates for changes.

TL;DR — 5-minute quickstart

1. Clone the repo and install dependencies:

```bash
git clone https://github.com/hypnoticdata777/turnflow-home.git
cd turnflow-home
npm install
```

2. Create a local env file and fill required values:

```bash
cp .env.local.example .env.local
# edit .env.local and set at least: DATABASE_URL, AUTH_SECRET, BLOB_READ_WRITE_TOKEN, SEED_PASSWORD
```

3. Start a local Postgres and run migrations/seeds (option A: recommended)

```bash
# start a local DB and the app (docker-compose based)
./scripts/dev-local.sh
```

4. Run the app

```bash
npm run dev
# or for production-like build & preview
npm run build && npm run start
```

If you prefer to run Postgres manually, run `npm run db:migrate` and `npm run db:seed` after setting DATABASE_URL.

What to work on, and where to find things

- Code map: docs/05-implementation/code-map.md — a map of features to files.
- UI: components/* — React/TSX presentational components and shells.
- Server / business logic: lib/* — core server-side flows live here (request-workflow.ts, request-intake.ts, vendor-*).
- DB migrations: drizzle/*
- Docs and design: docs/* (read docs/README.md first)

Developer scripts

- npm run dev — Next.js dev server
- npm run build — build for production
- npm run start — run built app
- npm run lint — run ESLint
- npm run typecheck — TypeScript type check
- npm run test — run unit tests (Vitest)
- npm run verify — lint + typecheck + tests + build
- npm run db:migrate — run Drizzle migrations
- npm run db:seed — seed demo accounts (requires SEED_PASSWORD unless DB is localhost)

How we expect PRs to be

- Small, focused, and well-tested. Prefer multiple small PRs over a single large change.
- Run `npm run verify` before submitting a PR.
- Include screenshots or a short video for UI changes.

Pull request checklist (summary)

- [ ] I ran `npm run verify` locally and it passed (lint, typecheck, tests, build)
- [ ] I added tests for new logic or fixed an existing failing test
- [ ] I updated docs if I changed behavior or added a new feature
- [ ] I linked to relevant issues or design docs

Reporting bugs and feature requests

If you find a bug or want to propose a feature, use the issue templates to file details. Good bug reports include steps to reproduce, environment, and the expected vs actual behavior.

Code style and conventions

- TypeScript with strict mode. Follow existing patterns in lib/ and components/.
- Keep business logic in lib/ where possible; components should be presentational and call pure functions from lib/.
- Keep components small and testable.

Thanks — your contributions matter. If you have questions, open an issue with the "question" label or ping the maintainers in the repo.