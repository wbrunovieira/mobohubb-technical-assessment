import { INestApplication } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import request from 'supertest';
import { App } from 'supertest/types';
import { createTestApp, closeTestApp, TestApp } from '../utils/create-test-app';
import { Todo } from '../../src/todos/entities/todo.entity';

describe('GET /todos/:id (e2e)', () => {
  let testApp: TestApp;
  let app: INestApplication<App>;
  let todosRepository: Repository<Todo>;

  beforeEach(async () => {
    testApp = await createTestApp('data/test-find-one-todo.sqlite');
    app = testApp.app;
    todosRepository = app.get(getRepositoryToken(Todo));
  });

  afterEach(async () => {
    await closeTestApp(testApp);
  });

  it('returns 200 with the matching todo', async () => {
    const saved = await todosRepository.save(
      todosRepository.create({ title: 'Buy milk', description: 'Whole milk' }),
    );

    const response = await request(app.getHttpServer())
      .get(`/todos/${saved.id}`)
      .expect(200);

    expect(response.body).toMatchObject({
      id: saved.id,
      title: 'Buy milk',
      description: 'Whole milk',
      completed: false,
    });
  });

  it('returns 404 when no todo matches the id', () => {
    return request(app.getHttpServer()).get('/todos/999').expect(404);
  });

  it('returns 400 when the id is not a number', () => {
    return request(app.getHttpServer()).get('/todos/not-a-number').expect(400);
  });
});
