import { existsSync, unlinkSync } from 'fs';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { App } from 'supertest/types';
import { TodosModule } from '../../src/todos/todos.module';
import { dataSourceOptions } from '../../src/database/data-source';
import { createValidationPipe } from '../../src/validation-pipe';

export interface TestApp {
  app: INestApplication<App>;
  databasePath: string;
}

function resetDatabaseFile(path: string): void {
  if (existsSync(path)) {
    unlinkSync(path);
  }
}

/**
 * Builds a full Nest app for e2e tests, wired the same way AppModule is —
 * real, file-based SQLite driven by the actual migrations, no `synchronize`
 * — but pointed at a caller-specific database file so concurrent e2e spec
 * files never collide on the same on-disk database.
 *
 * Pass a path unique to the spec file, e.g. `data/test-find-all-todos.sqlite`.
 */
export async function createTestApp(databasePath: string): Promise<TestApp> {
  resetDatabaseFile(databasePath);

  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [
      TypeOrmModule.forRoot({
        ...dataSourceOptions,
        database: databasePath,
        autoLoadEntities: true,
        synchronize: false,
        migrationsRun: true,
      }),
      TodosModule,
    ],
  }).compile();

  const app = moduleFixture.createNestApplication<INestApplication<App>>();
  app.useGlobalPipes(createValidationPipe());
  await app.init();

  return { app, databasePath };
}

export async function closeTestApp({
  app,
  databasePath,
}: TestApp): Promise<void> {
  // `app.close()` alone does NOT run shutdown hooks (that needs
  // `enableShutdownHooks()`), so the DataSource is destroyed explicitly here
  // — otherwise it stays registered/open across test cases and the next
  // test silently reuses the stale connection instead of a fresh one.
  const dataSource = app.get(DataSource);
  await app.close();
  if (dataSource.isInitialized) {
    await dataSource.destroy();
  }
  resetDatabaseFile(databasePath);
}
