import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { PrismaService } from './prisma/prisma.service';

async function bootstrap() {
  // rawBody: true preserves the raw request bytes on request.rawBody
  // alongside Nest's normal JSON parsing — needed to verify Stripe's
  // webhook signature, which is computed over the exact raw payload.
  const app = await NestFactory.create(AppModule, { rawBody: true });
  const config = app.get(ConfigService);

  app.use(helmet());
  app.use(cookieParser());

  app.enableCors({
    origin: config.get<string>('corsOrigin'),
    credentials: true,
  });

  const apiPrefix = config.get<string>('apiPrefix')!;
  app.setGlobalPrefix(apiPrefix);

  const prismaService = app.get(PrismaService);
  await prismaService.enableShutdownHooks(app);

  // Swagger exposes the full API surface and DTO shapes — fine for local
  // dev, not something a public production deployment should serve.
  const isProduction = config.get<string>('nodeEnv') === 'production';
  if (!isProduction) {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('Burkha by Malika API')
      .setDescription('Backend API for the Burkha by Malika e-commerce platform')
      .setVersion('1.0')
      .addBearerAuth()
      .addTag('auth')
      .addTag('users')
      .addTag('categories')
      .addTag('products')
      .addTag('orders')
      .addTag('cart')
      .addTag('wishlist')
      .addTag('contact')
      .addTag('payments')
      .addTag('payment-settings')
      .build();
    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup(`${apiPrefix}/docs`, app, document);
  }

  const port = config.get<number>('port')!;
  await app.listen(port);

  console.log(`🚀 Burkha by Malika API running on http://localhost:${port}/${apiPrefix}`);

  if (!isProduction) {
    console.log(`📚 Swagger docs available at http://localhost:${port}/${apiPrefix}/docs`);
  }
}

bootstrap();
