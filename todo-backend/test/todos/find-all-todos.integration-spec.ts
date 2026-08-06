import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule, getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FindAllTodosUseCase } from '../../src/todos/use-cases/find-all-todos.use-case';
import { Todo } from '../../src/todos/entities/todo.entity';
import { dataSourceOptions } from '../../src/database/data-source';

describe('FindAllTodosUseCase (integration)', () => {
  let module: TestingModule;
  let useCase: FindAllTodosUseCase;
  let repository: Repository<Todo>;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [
        // Same schema-creation path as dev/prod (real migrations, no
        // `synchronize`) so a drift between the entity and a migration
        // would fail here too, not just at e2e/runtime.
        TypeOrmModule.forRoot({
          ...dataSourceOptions,
          database: ':memory:',
          synchronize: false,
          migrationsRun: true,
        }),
        TypeOrmModule.forFeature([Todo]),
      ],
      providers: [FindAllTodosUseCase],
    }).compile();

    useCase = module.get(FindAllTodosUseCase);
    repository = module.get(getRepositoryToken(Todo));
  });

  afterEach(async () => {
    await module.close();
  });

  it('returns an empty array when the todos table has no rows', async () => {
    const result = await useCase.execute();

    expect(result).toEqual([]);
  });

  it('returns all todos persisted in the database', async () => {
    await repository.save(repository.create({ title: 'Buy milk' }));
    await repository.save(
      repository.create({ title: 'Walk the dog', completed: true }),
    );

    const result = await useCase.execute();

    expect(result).toHaveLength(2);
    expect(result.map((todo) => todo.title).sort()).toEqual(
      ['Buy milk', 'Walk the dog'].sort(),
    );
  });

  it('persists a null description and a default completed value of false', async () => {
    await repository.save(repository.create({ title: 'Buy milk' }));

    const [todo] = await useCase.execute();

    expect(todo.description).toBeNull();
    expect(todo.completed).toBe(false);
  });

  it('orders the most recently created todo first, using id as a tiebreaker', async () => {
    const first = await repository.save(repository.create({ title: 'First' }));
    const second = await repository.save(
      repository.create({ title: 'Second' }),
    );

    // createdAt has 1-second resolution (see the migration's
    // `DEFAULT (datetime('now'))`), so these two rows likely share the same
    // timestamp — the id DESC tiebreaker is what keeps this deterministic
    // either way, instead of relying on SQLite's incidental row order.
    const result = await useCase.execute();

    expect(result.map((todo) => todo.id)).toEqual([second.id, first.id]);
  });

  it('returns a single todo unwrapped correctly (no off-by-one in ordering)', async () => {
    const only = await repository.save(repository.create({ title: 'Solo' }));

    const result = await useCase.execute();

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(only.id);
  });

  it('propagates the database error when the todos table is missing', async () => {
    await repository.query('DROP TABLE todos');

    await expect(useCase.execute()).rejects.toThrow();
  });
});
