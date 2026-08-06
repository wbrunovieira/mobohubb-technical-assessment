import { NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { findTodoOrFail } from './find-todo-or-fail';
import { Todo } from '../entities/todo.entity';

describe('findTodoOrFail', () => {
  let repository: jest.Mocked<Pick<Repository<Todo>, 'findOneBy'>>;

  beforeEach(() => {
    repository = { findOneBy: jest.fn() };
  });

  it('returns the todo when it exists', async () => {
    const todo: Todo = {
      id: 1,
      title: 'Buy milk',
      description: null,
      completed: false,
      createdAt: new Date(),
    };
    repository.findOneBy.mockResolvedValue(todo);

    const result = await findTodoOrFail(repository, 1);

    expect(result).toEqual(todo);
    expect(repository.findOneBy).toHaveBeenCalledWith({ id: 1 });
  });

  it('throws NotFoundException when the todo does not exist', async () => {
    repository.findOneBy.mockResolvedValue(null);

    await expect(findTodoOrFail(repository, 999)).rejects.toThrow(
      NotFoundException,
    );
  });
});
