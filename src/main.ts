import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import helmet from 'helmet';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { TypeOrmExceptionFilter } from './common/filters/typeorm-exception.filter';

async function bootstrap() {
  // 1) Crear la app Nest
  const app = await NestFactory.create(AppModule, { cors: true });

  // 2) Prefijo global para la API
  app.setGlobalPrefix('/api');

  // 3) Seguridad básica con Helmet
  app.use(helmet());

  // 4) CORS para permitir el front (Vite en 5173)
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  });

  // 5) Pipes globales de validación (DTOs)
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // ignora propiedades extra
      forbidNonWhitelisted: true, // lanza error si mandan campos de más
      transform: true, // transforma tipos automáticamente
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // 6) Configuración de Swagger
  const configDoc = new DocumentBuilder()
    .setTitle('DonaHoy API')
    .setDescription('Sistema de Gestión de Donaciones de Sangre')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('auth', 'Autenticación y registro')
    .addTag('users', 'Gestión de usuarios')
    .addTag('roles', 'Gestión de roles')
    .addTag('health-questionnaire', 'Cuestionario de elegibilidad')
    .addTag('campaigns', 'Campañas de donación')
    .addTag('enrollments', 'Inscripciones a campañas')
    .addTag('donations', 'Historial de donaciones')
    .addTag('certificates', 'Certificados')
    .addTag('centers', 'Centros de donación')
    .addTag('notifications', 'Notificaciones')
    .addTag('volunteers', 'Voluntariado')
    .addTag('blood-requests', 'Solicitudes de sangre')
    .addTag('ranking', 'Ranking y gamificación')
    .addTag('reports', 'Reportes y auditoría')
    .build();

  const document = SwaggerModule.createDocument(app, configDoc);
  SwaggerModule.setup('api/docs', app, document);

  // 7) Filtro global para errores de base de datos (TypeORM)
  app.useGlobalFilters(new TypeOrmExceptionFilter());

  // 8) Leer el puerto desde .env (o 3000 por defecto)
  const config = app.get(ConfigService);
  const port = config.get<number>('PORT') || 3000;

  await app.listen(port);
  console.log(`Server running at http://localhost:${port}/api`);
  console.log(`Swagger available at http://localhost:${port}/api/docs`);
}

bootstrap();
