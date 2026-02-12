import { NestFactory } from '@nestjs/core';
import { Pool } from 'pg';
import { AppModule } from '../app.module';
import appDataSource from '../config/typeorm.config';
import { SeedService } from '../modules/seed/seed.service';

async function resetDatabaseSchema() {
  const pool = new Pool({
    host: process.env.DB_HOST ?? 'localhost',
    port: Number(process.env.DB_PORT ?? 5432),
    user: process.env.DB_USERNAME ?? 'postgres',
    password: process.env.DB_PASSWORD ?? 'Diorygon@2080',
    database: process.env.DB_DATABASE ?? 'postgres',
  });

  const client = await pool.connect();
  try {
    await client.query('DROP SCHEMA IF EXISTS public CASCADE;');
    await client.query('CREATE SCHEMA public;');
    await client.query('GRANT ALL ON SCHEMA public TO public;');
  } finally {
    client.release();
    await pool.end();
  }
}

async function runMigrations() {
  if (!appDataSource.isInitialized) {
    await appDataSource.initialize();
  }

  await appDataSource.runMigrations();
  await appDataSource.destroy();
}

async function runSeed(seedService: SeedService) {
  await seedService.seed();
}

async function bootstrap() {
  process.env.AUTO_SEED = 'false';

  await resetDatabaseSchema();
  await runMigrations();

  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['log', 'error', 'warn'],
  });

  try {
    const seedService = app.get(SeedService);
    await runSeed(seedService);

    console.log('Reset + migrations + seed concluídos com sucesso.');
  } finally {
    await app.close();
  }
}

void bootstrap();
