import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TodosController } from './todos.controller';
import { FindAllTodosUseCase } from './use-cases/find-all-todos.use-case';
import { FindOneTodoUseCase } from './use-cases/find-one-todo.use-case';
import { CreateTodoUseCase } from './use-cases/create-todo.use-case';
import { UpdateTodoUseCase } from './use-cases/update-todo.use-case';
import { RemoveTodoUseCase } from './use-cases/remove-todo.use-case';
import { Todo } from './entities/todo.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Todo])],
  controllers: [TodosController],
  providers: [
    FindAllTodosUseCase,
    FindOneTodoUseCase,
    CreateTodoUseCase,
    UpdateTodoUseCase,
    RemoveTodoUseCase,
  ],
})
export class TodosModule {}
