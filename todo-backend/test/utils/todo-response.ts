import { Todo } from '../../src/todos/entities/todo.entity';

// Over HTTP, `createdAt` is serialized to an ISO string rather than a Date.
export type TodoResponseBody = Omit<Todo, 'createdAt'> & { createdAt: string };
