import { INestApplication } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import request from 'supertest';
import { App } from 'supertest/types';
import { createTestApp, closeTestApp, TestApp } from '../utils/create-test-app';
import { TodoResponseBody } from '../utils/todo-response';
import { Todo } from '../../src/todos/entities/todo.entity';

describe('POST /todos (e2e)', () => {
  let testApp: TestApp;
  let app: INestApplication<App>;
  let todosRepository: Repository<Todo>;

  beforeEach(async () => {
    testApp = await createTestApp('data/test-create-todo.sqlite');
    app = testApp.app;
    todosRepository = app.get(getRepositoryToken(Todo));
  });

  afterEach(async () => {
    await closeTestApp(testApp);
  });

  it('returns 201 and persists the todo', async () => {
    const response = await request(app.getHttpServer())
      .post('/todos')
      .send({ title: 'Buy milk', description: 'Whole milk' })
      .expect(201);
    const body = response.body as TodoResponseBody;

    expect(body).toMatchObject({
      title: 'Buy milk',
      description: 'Whole milk',
      completed: false,
    });

    const stored = await todosRepository.findOneBy({ id: body.id });
    expect(stored?.title).toBe('Buy milk');
  });

  it('returns 400 when title is missing', () => {
    return request(app.getHttpServer())
      .post('/todos')
      .send({ description: 'Whole milk' })
      .expect(400);
  });

  it('returns 400 when title is an empty string', () => {
    return request(app.getHttpServer())
      .post('/todos')
      .send({ title: '' })
      .expect(400);
  });

  it('returns 400 when the body includes fields not in the DTO (e.g. id)', () => {
    return request(app.getHttpServer())
      .post('/todos')
      .send({ title: 'Buy milk', id: 999 })
      .expect(400);
  });
});
