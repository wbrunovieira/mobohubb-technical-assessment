import { INestApplication } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import request from 'supertest';
import { App } from 'supertest/types';
import { createTestApp, closeTestApp, TestApp } from '../utils/create-test-app';
import { TodoResponseBody } from '../utils/todo-response';
import { Todo } from '../../src/todos/entities/todo.entity';

describe('PATCH /todos/:id (e2e)', () => {
  let testApp: TestApp;
  let app: INestApplication<App>;
  let todosRepository: Repository<Todo>;

  beforeEach(async () => {
    testApp = await createTestApp('data/test-update-todo.sqlite');
    app = testApp.app;
    todosRepository = app.get(getRepositoryToken(Todo));
  });

  afterEach(async () => {
    await closeTestApp(testApp);
  });

  it('returns 200 with the updated todo, leaving other fields unchanged', async () => {
    const saved = await todosRepository.save(
      todosRepository.create({ title: 'Buy milk', description: 'Whole milk' }),
    );

    const response = await request(app.getHttpServer())
      .patch(`/todos/${saved.id}`)
      .send({ completed: true })
      .expect(200);
    const body = response.body as TodoResponseBody;

    expect(body).toMatchObject({
      id: saved.id,
      title: 'Buy milk',
      description: 'Whole milk',
      completed: true,
    });
  });

  it('returns 404 when no todo matches the id', () => {
    return request(app.getHttpServer())
      .patch('/todos/999')
      .send({ completed: true })
      .expect(404);
  });

  it('returns 400 when the body includes fields not in the DTO (e.g. createdAt)', async () => {
    const saved = await todosRepository.save(
      todosRepository.create({ title: 'Buy milk' }),
    );

    return request(app.getHttpServer())
      .patch(`/todos/${saved.id}`)
      .send({ createdAt: '2020-01-01T00:00:00.000Z' })
      .expect(400);
  });
});
