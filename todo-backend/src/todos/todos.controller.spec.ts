import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { TodosController } from './todos.controller';
import { FindAllTodosUseCase } from './use-cases/find-all-todos.use-case';
import { FindOneTodoUseCase } from './use-cases/find-one-todo.use-case';
import { CreateTodoUseCase } from './use-cases/create-todo.use-case';
import { UpdateTodoUseCase } from './use-cases/update-todo.use-case';
import { RemoveTodoUseCase } from './use-cases/remove-todo.use-case';
import { Todo } from './entities/todo.entity';

describe('TodosController', () => {
  let controller: TodosController;
  let findAllTodosUseCase: jest.Mocked<FindAllTodosUseCase>;
  let findOneTodoUseCase: jest.Mocked<FindOneTodoUseCase>;
  let createTodoUseCase: jest.Mocked<CreateTodoUseCase>;
  let updateTodoUseCase: jest.Mocked<UpdateTodoUseCase>;
  let removeTodoUseCase: jest.Mocked<RemoveTodoUseCase>;

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
        {
          provide: FindOneTodoUseCase,
          useValue: {
            execute: jest.fn(),
          },
        },
        {
          provide: CreateTodoUseCase,
          useValue: {
            execute: jest.fn(),
          },
        },
        {
          provide: UpdateTodoUseCase,
          useValue: {
            execute: jest.fn(),
          },
        },
        {
          provide: RemoveTodoUseCase,
          useValue: {
            execute: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get(TodosController);
    findAllTodosUseCase = module.get(FindAllTodosUseCase);
    findOneTodoUseCase = module.get(FindOneTodoUseCase);
    createTodoUseCase = module.get(CreateTodoUseCase);
    updateTodoUseCase = module.get(UpdateTodoUseCase);
    removeTodoUseCase = module.get(RemoveTodoUseCase);
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

  describe('findOne', () => {
    it('delegates to FindOneTodoUseCase.execute with the parsed id', async () => {
      const todo: Todo = {
        id: 1,
        title: 'Buy milk',
        description: null,
        completed: false,
        createdAt: new Date(),
      };
      findOneTodoUseCase.execute.mockResolvedValue(todo);

      const result = await controller.findOne(1);

      expect(result).toEqual(todo);
      expect(findOneTodoUseCase.execute).toHaveBeenCalledWith(1);
    });

    it('propagates NotFoundException from the use case', async () => {
      findOneTodoUseCase.execute.mockRejectedValue(
        new NotFoundException('Todo with id 999 not found'),
      );

      await expect(controller.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('delegates to CreateTodoUseCase.execute with the dto', async () => {
      const dto = { title: 'Buy milk' };
      const created: Todo = {
        id: 1,
        title: 'Buy milk',
        description: null,
        completed: false,
        createdAt: new Date(),
      };
      createTodoUseCase.execute.mockResolvedValue(created);

      const result = await controller.create(dto);

      expect(result).toEqual(created);
      expect(createTodoUseCase.execute).toHaveBeenCalledWith(dto);
    });

    it('propagates errors thrown by the use case', async () => {
      const useCaseError = new Error('unexpected failure');
      createTodoUseCase.execute.mockRejectedValue(useCaseError);

      await expect(controller.create({ title: 'Buy milk' })).rejects.toThrow(
        useCaseError,
      );
    });
  });

  describe('update', () => {
    it('delegates to UpdateTodoUseCase.execute with the id and dto', async () => {
      const dto = { completed: true };
      const updated: Todo = {
        id: 1,
        title: 'Buy milk',
        description: null,
        completed: true,
        createdAt: new Date(),
      };
      updateTodoUseCase.execute.mockResolvedValue(updated);

      const result = await controller.update(1, dto);

      expect(result).toEqual(updated);
      expect(updateTodoUseCase.execute).toHaveBeenCalledWith(1, dto);
    });

    it('propagates NotFoundException from the use case', async () => {
      updateTodoUseCase.execute.mockRejectedValue(
        new NotFoundException('Todo with id 999 not found'),
      );

      await expect(controller.update(999, { completed: true })).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('remove', () => {
    it('delegates to RemoveTodoUseCase.execute with the parsed id', async () => {
      removeTodoUseCase.execute.mockResolvedValue(undefined);

      await controller.remove(1);

      expect(removeTodoUseCase.execute).toHaveBeenCalledWith(1);
    });

    it('propagates NotFoundException from the use case', async () => {
      removeTodoUseCase.execute.mockRejectedValue(
        new NotFoundException('Todo with id 999 not found'),
      );

      await expect(controller.remove(999)).rejects.toThrow(NotFoundException);
    });
  });
});
