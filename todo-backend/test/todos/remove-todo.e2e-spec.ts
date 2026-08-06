import { INestApplication } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import request from 'supertest';
import { App } from 'supertest/types';
import { createTestApp, closeTestApp, TestApp } from '../utils/create-test-app';
import { Todo } from '../../src/todos/entities/todo.entity';

describe('DELETE /todos/:id (e2e)', () => {
  let testApp: TestApp;
  let app: INestApplication<App>;
  let todosRepository: Repository<Todo>;

  beforeEach(async () => {
    testApp = await createTestApp('data/test-remove-todo.sqlite');
    app = testApp.app;
    todosRepository = app.get(getRepositoryToken(Todo));
  });

  afterEach(async () => {
    await closeTestApp(testApp);
  });

  it('returns 204 and removes the todo', async () => {
    const saved = await todosRepository.save(
      todosRepository.create({ title: 'Buy milk' }),
    );

    const response = await request(app.getHttpServer())
      .delete(`/todos/${saved.id}`)
      .expect(204);

    expect(response.body).toEqual({});
    const stored = await todosRepository.findOneBy({ id: saved.id });
    expect(stored).toBeNull();
  });

  it('returns 404 when no todo matches the id', () => {
    return request(app.getHttpServer()).delete('/todos/999').expect(404);
  });

  it('returns 404 on a second delete of the same id', async () => {
    const saved = await todosRepository.save(
      todosRepository.create({ title: 'Buy milk' }),
    );

    await request(app.getHttpServer()).delete(`/todos/${saved.id}`).expect(204);

    return request(app.getHttpServer())
      .delete(`/todos/${saved.id}`)
      .expect(404);
  });
});
