import { Controller, Get } from '@nestjs/common';
import { FindAllTodosUseCase } from './use-cases/find-all-todos.use-case';
import { Todo } from './entities/todo.entity';

@Controller('todos')
export class TodosController {
  constructor(private readonly findAllTodosUseCase: FindAllTodosUseCase) {}

  @Get()
  findAll(): Promise<Todo[]> {
    return this.findAllTodosUseCase.execute();
  }
}
