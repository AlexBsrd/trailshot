import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  // Fail fast in prod on missing/default secrets (compose can't enforce this
  // without breaking dev, so it's checked here — the right layer).
  if (process.env.NODE_ENV === 'production') {
    const jwt = process.env.JWT_SECRET;
    const pass = process.env.ADMIN_PASSWORD;
    if (!jwt || jwt === 'dev-secret-change-in-production' || !pass || pass === 'admin') {
      throw new Error('Set JWT_SECRET and ADMIN_PASSWORD (non-default) in .env for production.');
    }
  }

  const app = await NestFactory.create(AppModule);
  app.enableCors({ origin: ['http://localhost:4200', 'http://localhost:4201', 'http://localhost:4202'] });
  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
