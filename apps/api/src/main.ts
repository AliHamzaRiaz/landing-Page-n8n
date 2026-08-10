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

  app.use(helmet());

  const corsOrigin = config.get<string>(
    'CORS_ORIGIN',
    'http://localhost:5173,http://localhost:5174,http://127.0.0.1:5173,http://127.0.0.1:5174',
  );
  const origins = corsOrigin.split(',').map((o) => o.trim()).filter(Boolean);
  app.enableCors({
    origin: origins.length === 1 ? origins[0] : origins,
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

  const port = Number(config.get('API_PORT') ?? process.env.PORT ?? 3001);
  await app.listen(port);
}

bootstrap();
