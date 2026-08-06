import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Todo } from '../entities/todo.entity';
import { findTodoOrFail } from './find-todo-or-fail';

@Injectable()
export class FindOneTodoUseCase {
  constructor(
    @InjectRepository(Todo)
    private readonly todosRepository: Repository<Todo>,
  ) {}

  execute(id: number): Promise<Todo> {
    return findTodoOrFail(this.todosRepository, id);
  }
}
