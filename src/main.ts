import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { RedisStore } from 'connect-redis';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import IORedis from 'ioredis';
import { AppModule } from './app.module';
import { ms } from './libs/common/utils/ms.util';
import { parseBoolean } from './libs/common/utils/parse-boolean.util';
async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const config = app.get(ConfigService)

  const redisObject = new IORedis(config.getOrThrow('REDIS_URI'))
  app.use(cookieParser(
    config.getOrThrow('COOKIES_SECRET')
  ))

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true
    })
  )

  app.use(session({
    secret: config.getOrThrow("SESSION_SECRET"),
    name: config.getOrThrow("SESSION_NAME"),
    resave: true,
    saveUninitialized: false,
    cookie: {
      domain: config.getOrThrow("SESSION_DOMAIN"),
      maxAge: ms(config.getOrThrow("SESSION_MAX_AGE")),
      httpOnly: parseBoolean(config.getOrThrow("SESSION_HTTP_ONLY")),
      secure: parseBoolean(config.getOrThrow("SESSION_SECURE")),
      sameSite: 'lax'
    },
    store: new RedisStore({
      client: redisObject,
      prefix: config.getOrThrow("SESSION_FOLDER")
    })
  }))

  app.enableCors({
    origin: config.getOrThrow('ALLOWED_ORIGIN'),
    credentials: true,
    exposedHeaders: ['set-cookie']
  })

  await app.listen(config.getOrThrow('APPLICATION_PORT'));
}
bootstrap();
