import { existsSync, unlinkSync } from 'fs';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { TypeOrmModule, getRepositoryToken } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppController } from '../../src/app.controller';
import { AppService } from '../../src/app.service';
import { TodosModule } from '../../src/todos/todos.module';
import { dataSourceOptions } from '../../src/database/data-source';
import { Todo } from '../../src/todos/entities/todo.entity';

const TEST_DATABASE_PATH = 'data/test-todos.sqlite';

// Over HTTP, `createdAt` is serialized to an ISO string rather than a Date.
type TodoResponseBody = Omit<Todo, 'createdAt'> & { createdAt: string };

function resetTestDatabase() {
  if (existsSync(TEST_DATABASE_PATH)) {
    unlinkSync(TEST_DATABASE_PATH);
  }
}

describe('GET /todos (e2e)', () => {
  let app: INestApplication<App>;
  let todosRepository: Repository<Todo>;

  beforeEach(async () => {
    resetTestDatabase();

    // Mirrors AppModule's composition (see src/app.module.ts) instead of
    // importing it directly: AppModule's TypeOrmModule.forRoot() call is
    // evaluated once at module-load time and, across the module-scoped
    // `overrideModule` used in previous attempts, TypeORM's process-global
    // DataSourceNameRegistry kept resolving the stale 'default' connection
    // from the previous test instead of the freshly overridden one. Building
    // the test module from the same pieces AppModule uses — but with the
    // real, file-based, migration-driven config below — sidesteps that.
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          ...dataSourceOptions,
          database: TEST_DATABASE_PATH,
          autoLoadEntities: true,
          synchronize: false,
          migrationsRun: true,
        }),
        TodosModule,
      ],
      controllers: [AppController],
      providers: [AppService],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    todosRepository = app.get(getRepositoryToken(Todo));
  });

  afterEach(async () => {
    // `app.close()` alone does NOT run shutdown hooks (that needs
    // `enableShutdownHooks()`), so the DataSource is destroyed explicitly
    // here — otherwise it stays registered/open across test cases and the
    // next test silently reuses the stale connection instead of a fresh one.
    const dataSource = app.get(DataSource);
    await app.close();
    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
    resetTestDatabase();
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
});
