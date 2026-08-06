import { Test, TestingModule } from '@nestjs/testing';
import { TodosController } from './todos.controller';
import { FindAllTodosUseCase } from './use-cases/find-all-todos.use-case';
import { Todo } from './entities/todo.entity';

describe('TodosController', () => {
  let controller: TodosController;
  let findAllTodosUseCase: jest.Mocked<FindAllTodosUseCase>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TodosController],
      providers: [
        {
          provide: FindAllTodosUseCase,
          useValue: {
            execute: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get(TodosController);
    findAllTodosUseCase = module.get(FindAllTodosUseCase);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('delegates to FindAllTodosUseCase.execute and returns its result', async () => {
      const todos: Todo[] = [
        {
          id: 1,
          title: 'Buy milk',
          description: null,
          completed: false,
          createdAt: new Date(),
        },
      ];
      findAllTodosUseCase.execute.mockResolvedValue(todos);

      const result = await controller.findAll();

      expect(result).toEqual(todos);
      expect(findAllTodosUseCase.execute).toHaveBeenCalledTimes(1);
    });

    it('returns an empty array when the use case has no todos', async () => {
      findAllTodosUseCase.execute.mockResolvedValue([]);

      const result = await controller.findAll();

      expect(result).toEqual([]);
    });

    it('propagates errors thrown by the use case instead of swallowing them', async () => {
      const useCaseError = new Error('unexpected failure');
      findAllTodosUseCase.execute.mockRejectedValue(useCaseError);

      await expect(controller.findAll()).rejects.toThrow(useCaseError);
    });
  });
});
