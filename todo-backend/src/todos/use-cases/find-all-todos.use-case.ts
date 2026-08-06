import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Todo } from '../entities/todo.entity';

@Injectable()
export class FindAllTodosUseCase {
  constructor(
    @InjectRepository(Todo)
    private readonly todosRepository: Repository<Todo>,
  ) {}

  execute(): Promise<Todo[]> {
    // `id` is the tiebreaker: createdAt has 1-second resolution, so two
    // todos created within the same second would otherwise sort randomly.
    return this.todosRepository.find({
      order: { createdAt: 'DESC', id: 'DESC' },
    });
  }
}
