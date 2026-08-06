import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Todo } from '../entities/todo.entity';
import { findTodoOrFail } from './find-todo-or-fail';

@Injectable()
export class RemoveTodoUseCase {
  constructor(
    @InjectRepository(Todo)
    private readonly todosRepository: Repository<Todo>,
  ) {}

  async execute(id: number): Promise<void> {
    const todo = await findTodoOrFail(this.todosRepository, id);
    await this.todosRepository.remove(todo);
  }
}
