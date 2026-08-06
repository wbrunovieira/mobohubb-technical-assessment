import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FindAllTodosUseCase } from './find-all-todos.use-case';
import { Todo } from '../entities/todo.entity';

describe('FindAllTodosUseCase', () => {
  let useCase: FindAllTodosUseCase;
  let repository: jest.Mocked<Repository<Todo>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FindAllTodosUseCase,
        {
          provide: getRepositoryToken(Todo),
          useValue: {
            find: jest.fn(),
          },
        },
      ],
    }).compile();

    useCase = module.get(FindAllTodosUseCase);
    repository = module.get(getRepositoryToken(Todo));
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  describe('execute', () => {
    it('returns all todos from the repository', async () => {
      const todos: Todo[] = [
        {
          id: 1,
          title: 'Buy milk',
          description: null,
          completed: false,
          createdAt: new Date(),
        },
      ];
      repository.find.mockResolvedValue(todos);

      const result = await useCase.execute();

      expect(result).toEqual(todos);
      expect(repository.find).toHaveBeenCalledWith({
        order: { createdAt: 'DESC', id: 'DESC' },
      });
    });

    it('returns an empty array when there are no todos', async () => {
      repository.find.mockResolvedValue([]);

      const result = await useCase.execute();

      expect(result).toEqual([]);
    });

    it('preserves todos with a null description', async () => {
      const todos: Todo[] = [
        {
          id: 1,
          title: 'Buy milk',
          description: null,
          completed: false,
          createdAt: new Date(),
        },
      ];
      repository.find.mockResolvedValue(todos);

      const result = await useCase.execute();

      expect(result[0].description).toBeNull();
    });

    it('propagates errors thrown by the repository', async () => {
      const dbError = new Error('connection lost');
      repository.find.mockRejectedValue(dbError);

      await expect(useCase.execute()).rejects.toThrow(dbError);
    });
  });
});
