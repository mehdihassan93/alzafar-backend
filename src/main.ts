import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';
import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import compression from 'compression';
import { TimeoutInterceptor } from './common/interceptors/timeout.interceptor';
import { NoSqlSanitizerPipe } from './common/pipes/nosql-sanitizer.pipe';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: WinstonModule.createLogger({
      transports: [
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.colorize(),
            winston.format.printf(({ timestamp, level, message, context }) => {
              return `${timestamp} [${context || 'App'}] ${level}: ${message}`;
            }),
          ),
        }),
        new winston.transports.File({
          filename: 'error.log',
          level: 'error',
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.json(),
          ),
        }),
      ],
    }),
  });

  app.enableCors({
    origin: true, // In production, replace with specific domains
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  app.use(
    helmet({
      crossOriginResourcePolicy: false,
    }),
  );
  app.use(compression());
  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalInterceptors(new TimeoutInterceptor());
  app.useGlobalPipes(
    new NoSqlSanitizerPipe(),
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('Al-Zafar Enterprise API')
    .setDescription(
      'The core high-performance engine for Al-Zafar Shopping platform.',
    )
    .setVersion('1.1')
    .setContact(
      'Al-Zafar Support',
      'https://alzafar.com/support',
      'support@alzafar.com',
    )
    .addTag('Products', 'Search indexed catalog & Ratings')
    .addTag('Orders', 'Inventory aware checkout & Audit trails')
    .addTag('Admin Analytics', 'Business intelligence for stakeholders')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
    customSiteTitle: 'Al-Zafar API Documentation',
  });

  await app.listen(process.env.PORT ?? 3000);
  console.log(
    `🚀 Server running on: http://localhost:${process.env.PORT ?? 3000}`,
  );
  console.log(
    `📖 Swagger docs available on: http://localhost:${process.env.PORT ?? 3000}/api/docs`,
  );
}
bootstrap();
