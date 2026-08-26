import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { ResponseInterceptor } from './lib/common/interceptors/response-interceptors';
import { HttpExceptionFilter } from './lib/common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true }));
  app.enableCors({
    origin: config.get<string>('FRONTEND_URL'),
    credentials: true,
  });
  app.useGlobalInterceptors(app.get(ResponseInterceptor));
  app.useGlobalFilters(new HttpExceptionFilter());

  const port = config.get<number>('PORT', 3000);
  // await app.listen(port, '0.0.0.0');
  await app.listen(port);
  // eslint-disable-next-line no-console
  console.log(`TaskManager Pro API listening on :${port}`);
}
bootstrap();
