import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { EnvService } from './env/env.service';
import { DefaultExceptionFilter } from './http/filters/default-exception-filter.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalFilters(new DefaultExceptionFilter());
  const configService = app.get(EnvService);
  const port = configService.get('PORT');

  app.enableCors({
    origin: '*',
  });

  await app.listen(port);
  console.log(`🚀 Server running on http://localhost:${port}`);
}
bootstrap();
