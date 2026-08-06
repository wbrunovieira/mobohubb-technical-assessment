import 'reflect-metadata';
import { DataSource, DataSourceOptions } from 'typeorm';
import { Todo } from '../todos/entities/todo.entity';

export const dataSourceOptions: DataSourceOptions = {
  type: 'better-sqlite3',
  database: process.env.DATABASE_PATH ?? 'data/todos.sqlite',
  entities: [Todo],
  migrations: [__dirname + '/migrations/*{.ts,.js}'],
  migrationsTableName: 'migrations',
};

export default new DataSource(dataSourceOptions);
