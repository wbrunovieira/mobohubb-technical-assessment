import { NotFoundException } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UpdateTodoUseCase } from '../../src/todos/use-cases/update-todo.use-case';
import { Todo } from '../../src/todos/entities/todo.entity';
import { createTestModule, closeTestModule } from '../utils/create-test-module';

describe('UpdateTodoUseCase (integration)', () => {
  let module: TestingModule;
  let useCase: UpdateTodoUseCase;
  let repository: Repository<Todo>;

  beforeEach(async () => {
    module = await createTestModule([UpdateTodoUseCase]);

    useCase = module.get(UpdateTodoUseCase);
    repository = module.get(getRepositoryToken(Todo));
  });

  afterEach(async () => {
    await closeTestModule(module);
  });

  it('updates only the given fields, leaving the rest unchanged', async () => {
    const saved = await repository.save(
      repository.create({ title: 'Buy milk', description: 'Whole milk' }),
    );

    const result = await useCase.execute(saved.id, { completed: true });

    expect(result.completed).toBe(true);
    expect(result.title).toBe('Buy milk');
    expect(result.description).toBe('Whole milk');
  });

  it('persists the update', async () => {
    const saved = await repository.save(
      repository.create({ title: 'Buy milk' }),
    );

    await useCase.execute(saved.id, { title: 'Buy oat milk' });

    const stored = await repository.findOneBy({ id: saved.id });
    expect(stored?.title).toBe('Buy oat milk');
  });

  it('throws NotFoundException when no todo matches the given id', async () => {
    await expect(useCase.execute(999, { completed: true })).rejects.toThrow(
      NotFoundException,
    );
  });
});
