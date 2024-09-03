async function importModules() {
  const { initializeTracing } = await import('./tracing/tracing');
  await initializeTracing();

  const { NestFactory } = await import('@nestjs/core');
  const { AppModule } = await import('./app.module');
  const { EnvService } = await import('./env/env.service');
  const { DefaultExceptionFilter } = await import(
    './http/filters/default-exception-filter.filter'
  );

  return { NestFactory, AppModule, EnvService, DefaultExceptionFilter };
}

async function bootstrap() {
  const { NestFactory, AppModule, EnvService, DefaultExceptionFilter } =
    await importModules();

  const app = await NestFactory.create(AppModule);
  app.useGlobalFilters(new DefaultExceptionFilter());
  const envService = app.get(EnvService);

  const port = envService.get('PORT');

  app.enableCors({
    origin: '*',
  });

  await app.listen(port);
  console.log(`🚀 Server running on http://localhost:${port}`);
}

bootstrap();
