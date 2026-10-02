import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api/v1');

  // Enhanced CORS configuration
  app.enableCors({
    origin: (process.env.CORS_ORIGINS || process.env.CORS_ORIGIN || 'http://localhost:3000').split(',').map((origin) => origin.trim()),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token', 'X-API-Key', 'X-MFA-Code'],
    maxAge: 3600,
  });

  // Swagger/OpenAPI Documentation: a map of every route, so not served in production
  const serveDocs = process.env.NODE_ENV !== 'production';
  const config = new DocumentBuilder()
    .setTitle('HotelHub API')
    .setDescription('Multi-tenant hotel management system API')
    .setVersion('1.0.0')
    .addBearerAuth()
    .build();
  if (serveDocs) {
    SwaggerModule.setup('api/docs', app, SwaggerModule.createDocument(app, config));
  }

  // Trust proxy for rate limiting
  const expressApp = app.getHttpAdapter().getInstance();
  expressApp.set('trust proxy', 1);

  const port = process.env.PORT || 3001;
  await app.listen(port);
  console.log(`🚀 API running on http://localhost:${port}`);
  if (serveDocs) console.log(`📚 API Docs available at http://localhost:${port}/api/docs`);
}

bootstrap().catch((err) => {
  console.error('Bootstrap error:', err);
  process.exit(1);
});
