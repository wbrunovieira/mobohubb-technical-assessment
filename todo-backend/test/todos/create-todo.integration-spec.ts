import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateTodoUseCase } from '../../src/todos/use-cases/create-todo.use-case';
import { Todo } from '../../src/todos/entities/todo.entity';
import { createTestModule, closeTestModule } from '../utils/create-test-module';

describe('CreateTodoUseCase (integration)', () => {
  let module: TestingModule;
  let useCase: CreateTodoUseCase;
  let repository: Repository<Todo>;

  beforeEach(async () => {
    module = await createTestModule([CreateTodoUseCase]);

    useCase = module.get(CreateTodoUseCase);
    repository = module.get(getRepositoryToken(Todo));
  });

  afterEach(async () => {
    await closeTestModule(module);
  });

  it('persists a todo with completed defaulting to false', async () => {
    const result = await useCase.execute({ title: 'Buy milk' });

    expect(result.id).toBeDefined();
    expect(result.completed).toBe(false);

    const stored = await repository.findOneBy({ id: result.id });
    expect(stored?.title).toBe('Buy milk');
    expect(stored?.completed).toBe(false);
  });

  it('persists a null description when none is given', async () => {
    const result = await useCase.execute({ title: 'Buy milk' });

    expect(result.description).toBeNull();
  });

  it('persists the given description when provided', async () => {
    const result = await useCase.execute({
      title: 'Buy milk',
      description: 'Whole milk',
    });

    expect(result.description).toBe('Whole milk');
  });

  it('sets createdAt automatically', async () => {
    const result = await useCase.execute({ title: 'Buy milk' });

    expect(result.createdAt).toBeInstanceOf(Date);
  });
});
