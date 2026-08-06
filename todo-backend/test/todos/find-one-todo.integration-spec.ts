import { NotFoundException } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FindOneTodoUseCase } from '../../src/todos/use-cases/find-one-todo.use-case';
import { Todo } from '../../src/todos/entities/todo.entity';
import { createTestModule, closeTestModule } from '../utils/create-test-module';

describe('FindOneTodoUseCase (integration)', () => {
  let module: TestingModule;
  let useCase: FindOneTodoUseCase;
  let repository: Repository<Todo>;

  beforeEach(async () => {
    module = await createTestModule([FindOneTodoUseCase]);

    useCase = module.get(FindOneTodoUseCase);
    repository = module.get(getRepositoryToken(Todo));
  });

  afterEach(async () => {
    await closeTestModule(module);
  });

  it('returns the persisted todo matching the given id', async () => {
    const saved = await repository.save(
      repository.create({ title: 'Buy milk', description: 'Whole milk' }),
    );
    await repository.save(repository.create({ title: 'Walk the dog' }));

    const result = await useCase.execute(saved.id);

    expect(result.id).toBe(saved.id);
    expect(result.title).toBe('Buy milk');
    expect(result.description).toBe('Whole milk');
  });

  it('throws NotFoundException when no todo matches the given id', async () => {
    await expect(useCase.execute(999)).rejects.toThrow(NotFoundException);
  });
});
