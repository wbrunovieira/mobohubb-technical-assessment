import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FindOneTodoUseCase } from './find-one-todo.use-case';
import { Todo } from '../entities/todo.entity';

describe('FindOneTodoUseCase', () => {
  let useCase: FindOneTodoUseCase;
  let repository: jest.Mocked<Repository<Todo>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FindOneTodoUseCase,
        {
          provide: getRepositoryToken(Todo),
          useValue: {
            findOneBy: jest.fn(),
          },
        },
      ],
    }).compile();

    useCase = module.get(FindOneTodoUseCase);
    repository = module.get(getRepositoryToken(Todo));
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  describe('execute', () => {
    it('returns the todo when it exists', async () => {
      const todo: Todo = {
        id: 1,
        title: 'Buy milk',
        description: null,
        completed: false,
        createdAt: new Date(),
      };
      repository.findOneBy.mockResolvedValue(todo);

      const result = await useCase.execute(1);

      expect(result).toEqual(todo);
      expect(repository.findOneBy).toHaveBeenCalledWith({ id: 1 });
    });

    it('throws NotFoundException when the todo does not exist', async () => {
      repository.findOneBy.mockResolvedValue(null);

      await expect(useCase.execute(999)).rejects.toThrow(NotFoundException);
    });

    it('propagates errors thrown by the repository', async () => {
      const dbError = new Error('connection lost');
      repository.findOneBy.mockRejectedValue(dbError);

      await expect(useCase.execute(1)).rejects.toThrow(dbError);
    });
  });
});
