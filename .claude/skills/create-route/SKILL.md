---
name: create-route
description: Add a new REST route to todo-backend (GET /todos/:id, POST /todos, PATCH /todos/:id, DELETE /todos/:id, or any future route) following this project's established conventions — use-case-per-file, DTOs/validation, migrations, three-tier tests. Use whenever asked to add/implement a backend route in this repo.
---

# Adding a route to todo-backend

This encodes every architectural decision made while building `GET /todos`
(see `todo-backend/CLAUDE.md` for the narrative version). Follow it
mechanically so every route looks like it was written by the same person.

Read `todo-backend/CLAUDE.md` first if you haven't already this session —
it has the *why* behind each rule below.

## 1. One use-case class per route

Create `src/todos/use-cases/<verb>-<resource>.use-case.ts`:

```ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Todo } from '../entities/todo.entity';

@Injectable()
export class <Verb><Resource>UseCase {
  constructor(
    @InjectRepository(Todo)
    private readonly todosRepository: Repository<Todo>,
  ) {}

  async execute(/* params */): Promise<Todo /* or void */> {
    // business logic here
  }
}
```

Naming: `find-one-todo.use-case.ts` → `FindOneTodoUseCase`,
`create-todo.use-case.ts` → `CreateTodoUseCase`,
`update-todo.use-case.ts` → `UpdateTodoUseCase`,
`remove-todo.use-case.ts` → `RemoveTodoUseCase`. Single public `execute()`
method. Do not add a second public method — if a route needs another
operation, that's a new use-case file.

**404 handling belongs in the use-case**, via `NotFoundException` — Nest's
exception filter turns it into a proper 404 response for free. This
couples the use-case to an HTTP-flavored exception, which is a deliberate
tradeoff for this project's size, not an oversight.

**Avoid duplicating "find by id or throw 404" across find-one/update/remove.**
Once a second use-case needs it, extract a small shared helper (e.g. a
`findOneOrFail(id: number)` method on a thin `TodosRepository` wrapper, or
a private function imported by each use-case) rather than copy-pasting the
`if (!todo) throw new NotFoundException(...)` block a third time.

## 2. DTOs and validation (routes with a request body)

For `POST`/`PATCH`, add `src/todos/dto/<action>-todo.dto.ts` using
`class-validator`:

```ts
import { IsBoolean, IsOptional, IsString, IsNotEmpty } from 'class-validator';

export class CreateTodoDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;
}
```

`UpdateTodoDto` should be `PartialType(CreateTodoDto)` (from
`@nestjs/mapped-types`) plus an optional `@IsBoolean() completed?: boolean`.

If a global `ValidationPipe` isn't registered yet in `src/main.ts`, add one
the first time a DTO is introduced:

```ts
app.useGlobalPipes(
  new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true }),
);
```

`whitelist: true` is what stops a client from PATCHing `id` or `createdAt`
— don't skip it.

For path params (`:id`), use `@Param('id', ParseIntPipe) id: number` in
the controller — never a bare `@Param('id') id: string` — so `/todos/abc`
is a clean 400 instead of a confusing downstream error.

## 3. Controller

Keep it a one-line delegation, same shape as the existing `findAll`:

```ts
@Post()
create(@Body() dto: CreateTodoDto): Promise<Todo> {
  return this.createTodoUseCase.execute(dto);
}
```

Inject only the use-case(s) that specific method needs — don't funnel
everything through one shared "TodosUseCases" bag.

## 4. Module registration

Add the new use-case class to `providers` in `src/todos/todos.module.ts`.

## 5. Migration (only if the entity itself changes)

`GET /todos/:id`, `POST /todos`, `PATCH /todos/:id`, `DELETE /todos/:id`
don't require entity changes — skip this section for them. If a future
route needs a new column, generate a migration instead of hand-editing:

```
npm run migration:generate -- src/database/migrations/<DescriptiveName>
npm run migration:run
```

Never turn `synchronize` back on.

## 6. Tests — three tiers, don't over-apply them

Match density to what the route actually risks:

- **Unit** (`src/todos/use-cases/<name>.use-case.spec.ts` +
  `src/todos/todos.controller.spec.ts` additions): mock the repository.
  Cover the happy path, the 404/not-found branch, validation-adjacent edge
  cases (e.g. empty title), and error propagation (repository rejects →
  use-case/controller must reject, not swallow).
- **Integration** (`test/todos/<name>.integration-spec.ts`): real
  `Repository<Todo>` against `:memory:` SQLite built via real migrations —
  copy the pattern from `test/todos/find-all-todos.integration-spec.ts`:
  ```ts
  TypeOrmModule.forRoot({
    ...dataSourceOptions,
    database: ':memory:',
    synchronize: false,
    migrationsRun: true,
  })
  ```
  Use this tier for the actual write/mutation paths (create persists
  correctly, update only changes given fields, delete actually removes the
  row).
- **E2E** (`test/todos/<name>.e2e-spec.ts`): one happy path plus one error
  case (404, or 400 for a bad body) is usually enough — don't replicate
  the full unit-test matrix here. Always use the shared helper:
  ```ts
  import { createTestApp, closeTestApp, TestApp } from '../utils/create-test-app';

  let testApp: TestApp;
  beforeEach(async () => { testApp = await createTestApp('data/test-<unique-name>.sqlite'); });
  afterEach(async () => { await closeTestApp(testApp); });
  ```
  Give every spec file a **unique** database path (mirror the spec's own
  name) — reusing one collides across parallel/sequential runs.
  Never import `AppModule` directly + `overrideModule(TypeOrmModule)`; see
  `create-test-app.ts`'s doc comment for why that leaks state across tests.

## 7. Before calling it done

```
npm run lint:check
npm test
npm run test:integration
npm run test:e2e
```

All four must be clean. Then manually hit the route once with `curl`
against the running dev server (`npm run start:dev`, port 3001) as a final
sanity check — the test suites are the real gate, but a live curl catches
anything a mocked/in-memory test setup couldn't (e.g. an actual CORS
header, a serialization quirk).

Comments and commit messages: English, per `todo-backend/CLAUDE.md`. Use
the `commit` skill when you're ready to commit — it has this repo's
message convention (and the no-AI-attribution rule) baked in.
