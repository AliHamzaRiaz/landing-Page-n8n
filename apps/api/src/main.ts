import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    // Required for Meta X-Hub-Signature-256 verification
    rawBody: true,
  });
  const config = app.get(ConfigService);

  const prefix = config.get<string>('API_PREFIX', 'api');
  app.setGlobalPrefix(prefix);

  app.use(
    helmet({
      // Allow browser clients on other origins (Vercel) to read API responses.
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );

  const corsOrigin = config.get<string>(
    'CORS_ORIGIN',
    'http://localhost:5173,http://localhost:5174,http://127.0.0.1:5173,http://127.0.0.1:5174',
  );
  // Normalize: trim + strip trailing slashes so "https://app.vercel.app/" still matches.
  const origins = corsOrigin
    .split(',')
    .map((o) => o.trim().replace(/\/+$/, ''))
    .filter(Boolean);
  app.enableCors({
    origin: (
      requestOrigin: string | undefined,
      callback: (err: Error | null, allow?: boolean | string) => void,
    ) => {
      if (!requestOrigin) {
        callback(null, true);
        return;
      }
      const normalized = requestOrigin.replace(/\/+$/, '');
      if (origins.includes(normalized)) {
        callback(null, normalized);
        return;
      }
      callback(null, false);
    },
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new TransformInterceptor());

  // Prefer platform PORT (Render/Railway); fall back to API_PORT for local.
  const port = Number(process.env.PORT ?? config.get('API_PORT') ?? 3001);
  await app.listen(port, '0.0.0.0');
}

bootstrap();
