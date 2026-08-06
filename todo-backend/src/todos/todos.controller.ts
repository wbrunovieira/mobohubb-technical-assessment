import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { FindAllTodosUseCase } from './use-cases/find-all-todos.use-case';
import { FindOneTodoUseCase } from './use-cases/find-one-todo.use-case';
import { CreateTodoUseCase } from './use-cases/create-todo.use-case';
import { UpdateTodoUseCase } from './use-cases/update-todo.use-case';
import { RemoveTodoUseCase } from './use-cases/remove-todo.use-case';
import { CreateTodoDto } from './dto/create-todo.dto';
import { UpdateTodoDto } from './dto/update-todo.dto';
import { Todo } from './entities/todo.entity';

@Controller('todos')
export class TodosController {
  constructor(
    private readonly findAllTodosUseCase: FindAllTodosUseCase,
    private readonly findOneTodoUseCase: FindOneTodoUseCase,
    private readonly createTodoUseCase: CreateTodoUseCase,
    private readonly updateTodoUseCase: UpdateTodoUseCase,
    private readonly removeTodoUseCase: RemoveTodoUseCase,
  ) {}

  @Get()
  findAll(): Promise<Todo[]> {
    return this.findAllTodosUseCase.execute();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number): Promise<Todo> {
    return this.findOneTodoUseCase.execute(id);
  }

  @Post()
  create(@Body() dto: CreateTodoDto): Promise<Todo> {
    return this.createTodoUseCase.execute(dto);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateTodoDto,
  ): Promise<Todo> {
    return this.updateTodoUseCase.execute(id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.removeTodoUseCase.execute(id);
  }
}
