import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UpdateTodoUseCase } from './update-todo.use-case';
import { Todo } from '../entities/todo.entity';

describe('UpdateTodoUseCase', () => {
  let useCase: UpdateTodoUseCase;
  let repository: jest.Mocked<Repository<Todo>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UpdateTodoUseCase,
        {
          provide: getRepositoryToken(Todo),
          useValue: {
            findOneBy: jest.fn(),
            merge: jest.fn(),
            save: jest.fn(),
          },
        },
      ],
    }).compile();

    useCase = module.get(UpdateTodoUseCase);
    repository = module.get(getRepositoryToken(Todo));
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  describe('execute', () => {
    it('merges the dto into the existing todo and saves it', async () => {
      const existing: Todo = {
        id: 1,
        title: 'Buy milk',
        description: null,
        completed: false,
        createdAt: new Date(),
      };
      const merged: Todo = { ...existing, completed: true };
      repository.findOneBy.mockResolvedValue(existing);
      repository.merge.mockReturnValue(merged);
      repository.save.mockResolvedValue(merged);

      const result = await useCase.execute(1, { completed: true });

      expect(repository.findOneBy).toHaveBeenCalledWith({ id: 1 });
      expect(repository.merge).toHaveBeenCalledWith(existing, {
        completed: true,
      });
      expect(repository.save).toHaveBeenCalledWith(merged);
      expect(result).toEqual(merged);
    });

    it('throws NotFoundException when the todo does not exist', async () => {
      repository.findOneBy.mockResolvedValue(null);

      await expect(useCase.execute(999, { completed: true })).rejects.toThrow(
        NotFoundException,
      );
      expect(repository.merge).not.toHaveBeenCalled();
      expect(repository.save).not.toHaveBeenCalled();
    });

    it('propagates errors thrown while saving', async () => {
      const existing: Todo = {
        id: 1,
        title: 'Buy milk',
        description: null,
        completed: false,
        createdAt: new Date(),
      };
      const dbError = new Error('connection lost');
      repository.findOneBy.mockResolvedValue(existing);
      repository.merge.mockReturnValue(existing);
      repository.save.mockRejectedValue(dbError);

      await expect(useCase.execute(1, { completed: true })).rejects.toThrow(
        dbError,
      );
    });
  });
});
