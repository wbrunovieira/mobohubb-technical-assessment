import { Provider } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { Todo } from '../../src/todos/entities/todo.entity';
import { dataSourceOptions } from '../../src/database/data-source';

/**
 * Builds a TestingModule for integration specs: a real `Repository<Todo>`
 * against an in-memory SQLite database created via the project's real
 * migrations (not `synchronize`), so entity/migration drift fails here too.
 */
export async function createTestModule(
  providers: Provider[],
): Promise<TestingModule> {
  return Test.createTestingModule({
    imports: [
      TypeOrmModule.forRoot({
        ...dataSourceOptions,
        database: ':memory:',
        synchronize: false,
        migrationsRun: true,
      }),
      TypeOrmModule.forFeature([Todo]),
    ],
    providers,
  }).compile();
}

export async function closeTestModule(module: TestingModule): Promise<void> {
  // `module.close()` alone does NOT run shutdown hooks (that needs
  // `enableShutdownHooks()`), so the DataSource is destroyed explicitly
  // here — otherwise it stays registered/open across spec files sharing a
  // Jest worker, and the next module intermittently reuses the stale
  // connection instead of its own fresh one (the same class of bug fixed
  // for e2e specs in test/utils/create-test-app.ts).
  const dataSource = module.get(DataSource);
  await module.close();
  if (dataSource.isInitialized) {
    await dataSource.destroy();
  }
}
