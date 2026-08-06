import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateTodoUseCase } from './create-todo.use-case';
import { Todo } from '../entities/todo.entity';

describe('CreateTodoUseCase', () => {
  let useCase: CreateTodoUseCase;
  let repository: jest.Mocked<Repository<Todo>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateTodoUseCase,
        {
          provide: getRepositoryToken(Todo),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
          },
        },
      ],
    }).compile();

    useCase = module.get(CreateTodoUseCase);
    repository = module.get(getRepositoryToken(Todo));
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  describe('execute', () => {
    it('creates and saves a todo from the dto', async () => {
      const dto = { title: 'Buy milk', description: 'Whole milk' };
      const created = { ...dto } as Todo;
      const saved: Todo = {
        id: 1,
        title: 'Buy milk',
        description: 'Whole milk',
        completed: false,
        createdAt: new Date(),
      };
      repository.create.mockReturnValue(created);
      repository.save.mockResolvedValue(saved);

      const result = await useCase.execute(dto);

      expect(repository.create).toHaveBeenCalledWith(dto);
      expect(repository.save).toHaveBeenCalledWith(created);
      expect(result).toEqual(saved);
    });

    it('propagates errors thrown by the repository', async () => {
      const dbError = new Error('connection lost');
      repository.create.mockReturnValue({} as Todo);
      repository.save.mockRejectedValue(dbError);

      await expect(useCase.execute({ title: 'Buy milk' })).rejects.toThrow(
        dbError,
      );
    });
  });
});
