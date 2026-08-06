import { NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Todo } from '../entities/todo.entity';

export async function findTodoOrFail(
  repository: Pick<Repository<Todo>, 'findOneBy'>,
  id: number,
): Promise<Todo> {
  const todo = await repository.findOneBy({ id });
  if (!todo) {
    throw new NotFoundException(`Todo with id ${id} not found`);
  }
  return todo;
}
