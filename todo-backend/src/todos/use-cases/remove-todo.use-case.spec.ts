import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RemoveTodoUseCase } from './remove-todo.use-case';
import { Todo } from '../entities/todo.entity';

describe('RemoveTodoUseCase', () => {
  let useCase: RemoveTodoUseCase;
  let repository: jest.Mocked<Repository<Todo>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RemoveTodoUseCase,
        {
          provide: getRepositoryToken(Todo),
          useValue: {
            findOneBy: jest.fn(),
            remove: jest.fn(),
          },
        },
      ],
    }).compile();

    useCase = module.get(RemoveTodoUseCase);
    repository = module.get(getRepositoryToken(Todo));
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  describe('execute', () => {
    it('removes the entity it fetched, without a second lookup', async () => {
      const todo: Todo = {
        id: 1,
        title: 'Buy milk',
        description: null,
        completed: false,
        createdAt: new Date(),
      };
      repository.findOneBy.mockResolvedValue(todo);
      repository.remove.mockResolvedValue(todo);

      await useCase.execute(1);

      expect(repository.findOneBy).toHaveBeenCalledWith({ id: 1 });
      expect(repository.remove).toHaveBeenCalledWith(todo);
      expect(repository.findOneBy).toHaveBeenCalledTimes(1);
    });

    it('throws NotFoundException when the todo does not exist', async () => {
      repository.findOneBy.mockResolvedValue(null);

      await expect(useCase.execute(999)).rejects.toThrow(NotFoundException);
      expect(repository.remove).not.toHaveBeenCalled();
    });

    it('propagates errors thrown while removing', async () => {
      const todo: Todo = {
        id: 1,
        title: 'Buy milk',
        description: null,
        completed: false,
        createdAt: new Date(),
      };
      const dbError = new Error('connection lost');
      repository.findOneBy.mockResolvedValue(todo);
      repository.remove.mockRejectedValue(dbError);

      await expect(useCase.execute(1)).rejects.toThrow(dbError);
    });
  });
});
