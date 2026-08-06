import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Todo } from '../entities/todo.entity';
import { UpdateTodoDto } from '../dto/update-todo.dto';
import { findTodoOrFail } from './find-todo-or-fail';

@Injectable()
export class UpdateTodoUseCase {
  constructor(
    @InjectRepository(Todo)
    private readonly todosRepository: Repository<Todo>,
  ) {}

  async execute(id: number, dto: UpdateTodoDto): Promise<Todo> {
    const todo = await findTodoOrFail(this.todosRepository, id);
    const merged = this.todosRepository.merge(todo, dto);
    return this.todosRepository.save(merged);
  }
}
