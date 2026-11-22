import { existsSync } from 'node:fs';
import { loadEnvFile } from 'node:process';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  if (existsSync('.env')) {
    loadEnvFile('.env');
  }
  process.env.DOCUMENTS_FILE ??= 'data/documents.json';

  const app = await NestFactory.create(AppModule);

  app.enableCors();
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(`🚀 Aplikacja działa na: http://localhost:${port}`);
  console.log(`📄 Endpointy dokumentów: http://localhost:${port}/documents`);
}

bootstrap();
