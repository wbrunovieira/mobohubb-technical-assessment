import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule, getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FindAllTodosUseCase } from '../../src/todos/use-cases/find-all-todos.use-case';
import { Todo } from '../../src/todos/entities/todo.entity';

describe('FindAllTodosUseCase (integration)', () => {
  let module: TestingModule;
  let useCase: FindAllTodosUseCase;
  let repository: Repository<Todo>;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'better-sqlite3',
          database: ':memory:',
          entities: [Todo],
          synchronize: true,
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

  it('propagates the database error when the todos table is missing', async () => {
    await repository.query('DROP TABLE todos');

    await expect(useCase.execute()).rejects.toThrow();
  });
});
