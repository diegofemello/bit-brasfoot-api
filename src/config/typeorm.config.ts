import 'dotenv/config';
import { DataSource } from 'typeorm';

const isTsRuntime = __filename.endsWith('.ts');

export default new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST ?? 'localhost',
  port: Number(process.env.DB_PORT ?? 5432),
  username: process.env.DB_USERNAME ?? 'postgres',
  password: process.env.DB_PASSWORD ?? 'Diorygon@2080',
  database: process.env.DB_DATABASE ?? 'postgres',
  synchronize: false,
  entities: isTsRuntime ? ['src/**/*.entity.ts'] : ['dist/**/*.entity.js'],
  migrations: isTsRuntime
    ? ['src/database/migrations/*.ts']
    : ['dist/database/migrations/*.js'],
});
