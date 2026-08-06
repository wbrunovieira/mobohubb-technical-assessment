import 'reflect-metadata';
import { DataSource, DataSourceOptions } from 'typeorm';
import { Todo } from '../todos/entities/todo.entity';

export const dataSourceOptions = {
  type: 'better-sqlite3',
  database: process.env.DATABASE_PATH ?? 'data/todos.sqlite',
  entities: [Todo],
  migrations: [__dirname + '/migrations/*{.ts,.js}'],
  migrationsTableName: 'migrations',
} satisfies DataSourceOptions;

export default new DataSource(dataSourceOptions);
