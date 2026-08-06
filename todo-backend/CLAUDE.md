# todo-backend

NestJS REST API for the Todo List technical assessment (see `../README.md`
for the full requirements: data model, required endpoints, evaluation
criteria). This file documents the conventions established while building
`GET /todos` — the first route — so the remaining routes (`GET /todos/:id`,
`POST /todos`, `PATCH /todos/:id`, `DELETE /todos/:id`) stay consistent.

## Skills

- **`create-route`** (`.claude/skills/create-route/SKILL.md`) — use this to
  add any new route. It encodes every decision below as a step-by-step
  recipe (use-case file, DTO, controller wiring, migration, three-tier
  tests).
- **`commit`** (`.claude/skills/commit/SKILL.md`) — this repo's commit
  message convention. No AI/Claude/Anthropic attribution or co-author
  trailer, ever.

## Language

Code comments and commit messages are always in English, regardless of the
language used in conversation.

## Architecture

- **One use-case class per route**, under `src/todos/use-cases/`, named
  `<verb>-<resource>.use-case.ts` → class `<Verb><Resource>UseCase` with a
  single public `execute()` method (e.g. `FindAllTodosUseCase`). The
  controller stays thin: inject the use-case(s) a route needs and delegate.
  This was a deliberate choice over a single fat `TodosService` so each
  route's logic — and its 404/validation branches once they exist — lives
  in one file instead of accreting into one growing service.
- **Persistence: TypeORM + SQLite, schema managed via migrations** —
  `synchronize` is off (`false`) in every environment, including tests.
  Every entity change must ship a migration:
  ```
  npm run migration:generate -- src/database/migrations/<DescriptiveName>
  npm run migration:run
  ```
  The CLI DataSource lives at `src/database/data-source.ts` and exports
  `dataSourceOptions` (typed with `satisfies DataSourceOptions`, not a type
  annotation — annotating it widens the discriminated union and breaks
  downstream spreads). `AppModule` and every test that needs a real
  connection reuse `dataSourceOptions` rather than redeclaring it.
- **CORS is enabled** (`app.enableCors()` in `main.ts`) since the frontend
  is a separate origin. Supertest-based e2e tests run in-process and will
  never catch a CORS regression — verify it manually against the real
  frontend if you touch this.
- **Ports**: backend defaults to **3001** (3000 was occupied locally when
  this was set up), frontend to **3002** (`todo-frontend/package.json`,
  pinned explicitly so it can't auto-shift onto 3001). The frontend reads
  the API URL from `NEXT_PUBLIC_API_URL` (see `todo-frontend/.env.example`).

## Testing — three tiers, different jobs

- **Unit** (`src/**/*.spec.ts`, run via `npm test`): mock the repository
  (unit-test a use-case) or the use-case (unit-test the controller). Cover
  the happy path, the empty/null edge cases, and error propagation (the
  use-case/controller must not swallow a rejected promise).
- **Integration** (`test/**/*.integration-spec.ts`, run via
  `npm run test:integration`): real `Repository<Todo>` against an
  **in-memory SQLite database created via real migrations**
  (`migrationsRun: true`, not `synchronize: true` — this is what would
  catch an entity/migration drift). Import `dataSourceOptions` from
  `src/database/data-source.ts` and override just `database: ':memory:'`.
- **E2E** (`test/**/*.e2e-spec.ts`, run via `npm run test:e2e`): full Nest
  app over HTTP (supertest), against a **real, file-based** SQLite database
  driven by the same migrations dev/prod use. Always build the app via
  `createTestApp('data/test-<spec-name>.sqlite')` from
  `test/utils/create-test-app.ts` — give every spec file its own DB path.
  Never import `AppModule` directly and `overrideModule` its
  `TypeOrmModule`: TypeORM's process-global `DataSourceNameRegistry` ends
  up reusing the previous test's stale connection instead of the override,
  which silently leaks data across test cases. `createTestApp` sidesteps
  this by rebuilding AppModule's composition (`TodosModule` +
  `TypeOrmModule.forRoot(...)`) directly. Always pair it with
  `closeTestApp()` in `afterEach` — `app.close()` alone does not destroy
  the `DataSource` (that needs `enableShutdownHooks()`, which isn't
  enabled), so skipping this leaks connections between tests too.
- **Don't replicate all three tiers with equal density for every route.**
  Unit-test validation/404 branches, integration-test the write paths,
  keep e2e to one happy path plus one error case per route.
- `test/jest-e2e.json` runs with `maxWorkers: 1` — e2e specs touch real
  files on disk; don't remove this without re-verifying there's no
  cross-file collision.

## Commands

```
npm run start:dev          # dev server, port 3001, migrations run on boot
npm test                   # unit
npm run test:integration   # integration
npm run test:e2e           # e2e
npm run lint                # eslint --fix (mutates files)
npm run lint:check          # eslint, no fix — use this as a CI/verification gate
npm run migration:generate -- src/database/migrations/<Name>
npm run migration:run
npm run migration:revert
```

## Repo remotes

- `origin` → `wbrunovieira/mobohubb-technical-assessment` (fork, has push
  access) — push work-in-progress here.
- `upstream` → `bjjprogrammer/mobohubb-technical-assessment` (original
  assessment repo) — open the final PR against `upstream/main`, per the
  README's delivery instructions.
