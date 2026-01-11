import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';
import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';
import { ValidationPipe } from '@nestjs/common';

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

  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true, // Strips out properties that are not in the DTO
    transform: true, // Automatically transforms types (e.g. string numbers to real numbers)
  }));

  const config = new DocumentBuilder()
    .setTitle('Al-Zafar Backend')
    .setDescription('The Al-Zafar Shopping App API description')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(process.env.PORT ?? 3000);
  console.log(`🚀 Server running on: http://localhost:${process.env.PORT ?? 3000}`);
  console.log(`📖 Swagger docs available on: http://localhost:${process.env.PORT ?? 3000}/api/docs`);
}
bootstrap();
