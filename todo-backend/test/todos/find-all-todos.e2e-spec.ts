import { INestApplication } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import request from 'supertest';
import { App } from 'supertest/types';
import { createTestApp, closeTestApp, TestApp } from '../utils/create-test-app';
import { Todo } from '../../src/todos/entities/todo.entity';

// Over HTTP, `createdAt` is serialized to an ISO string rather than a Date.
type TodoResponseBody = Omit<Todo, 'createdAt'> & { createdAt: string };

describe('GET /todos (e2e)', () => {
  let testApp: TestApp;
  let app: INestApplication<App>;
  let todosRepository: Repository<Todo>;

  beforeEach(async () => {
    testApp = await createTestApp('data/test-find-all-todos.sqlite');
    app = testApp.app;
    todosRepository = app.get(getRepositoryToken(Todo));
  });

  afterEach(async () => {
    await closeTestApp(testApp);
  });

  it('returns 200 with an empty array when no todos exist', () => {
    return request(app.getHttpServer())
      .get('/todos')
      .expect(200)
      .expect('Content-Type', /json/)
      .expect([]);
  });

  it('returns every persisted todo with the correct shape and values', async () => {
    const saved = await todosRepository.save(
      todosRepository.create({ title: 'Buy milk', description: 'Whole milk' }),
    );

    const response = await request(app.getHttpServer())
      .get('/todos')
      .expect(200);
    const body = response.body as TodoResponseBody[];

    expect(body).toHaveLength(1);
    expect(body[0]).toMatchObject({
      id: saved.id,
      title: 'Buy milk',
      description: 'Whole milk',
      completed: false,
    });
    expect(typeof body[0].createdAt).toBe('string');
    expect(new Date(body[0].createdAt).toString()).not.toBe('Invalid Date');
  });

  it('serializes an omitted description as null rather than undefined', async () => {
    await todosRepository.save(todosRepository.create({ title: 'Buy milk' }));

    const response = await request(app.getHttpServer())
      .get('/todos')
      .expect(200);
    const body = response.body as TodoResponseBody[];

    expect(body[0].description).toBeNull();
  });

  it('returns multiple todos in a stable, complete list', async () => {
    await todosRepository.save(todosRepository.create({ title: 'Buy milk' }));
    await todosRepository.save(
      todosRepository.create({ title: 'Walk the dog', completed: true }),
    );

    const response = await request(app.getHttpServer())
      .get('/todos')
      .expect(200);
    const body = response.body as TodoResponseBody[];

    expect(body).toHaveLength(2);
    expect(body.map((todo) => todo.title).sort()).toEqual(
      ['Buy milk', 'Walk the dog'].sort(),
    );
  });

  it('orders the most recently created todo first, using id as a tiebreaker', async () => {
    const first = await todosRepository.save(
      todosRepository.create({ title: 'First' }),
    );
    const second = await todosRepository.save(
      todosRepository.create({ title: 'Second' }),
    );

    const response = await request(app.getHttpServer())
      .get('/todos')
      .expect(200);
    const body = response.body as TodoResponseBody[];

    expect(body.map((todo) => todo.id)).toEqual([second.id, first.id]);
  });
});
