import { NotFoundException } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RemoveTodoUseCase } from '../../src/todos/use-cases/remove-todo.use-case';
import { Todo } from '../../src/todos/entities/todo.entity';
import { createTestModule, closeTestModule } from '../utils/create-test-module';

describe('RemoveTodoUseCase (integration)', () => {
  let module: TestingModule;
  let useCase: RemoveTodoUseCase;
  let repository: Repository<Todo>;

  beforeEach(async () => {
    module = await createTestModule([RemoveTodoUseCase]);

    useCase = module.get(RemoveTodoUseCase);
    repository = module.get(getRepositoryToken(Todo));
  });

  afterEach(async () => {
    await closeTestModule(module);
  });

  it('removes the row from the database', async () => {
    const saved = await repository.save(
      repository.create({ title: 'Buy milk' }),
    );

    await useCase.execute(saved.id);

    const stored = await repository.findOneBy({ id: saved.id });
    expect(stored).toBeNull();
  });

  it('does not affect other todos', async () => {
    const toDelete = await repository.save(
      repository.create({ title: 'Buy milk' }),
    );
    const toKeep = await repository.save(
      repository.create({ title: 'Walk the dog' }),
    );

    await useCase.execute(toDelete.id);

    const remaining = await repository.findOneBy({ id: toKeep.id });
    expect(remaining).not.toBeNull();
  });

  it('throws NotFoundException when no todo matches the given id', async () => {
    await expect(useCase.execute(999)).rejects.toThrow(NotFoundException);
  });

  it('throws NotFoundException on a second delete of the same id', async () => {
    const saved = await repository.save(
      repository.create({ title: 'Buy milk' }),
    );

    await useCase.execute(saved.id);

    await expect(useCase.execute(saved.id)).rejects.toThrow(NotFoundException);
  });
});
