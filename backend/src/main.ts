import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

function normalizeOrigin(origin: string) {
  return origin.trim().replace(/\/$/, '');
}

function parseOriginList(raw?: string) {
  return (raw || '')
    .split(',')
    .map((origin) => normalizeOrigin(origin))
    .filter(Boolean);
}

function escapeRegex(value: string) {
  return value.replace(/[|\\{}()[\]^$+?.]/g, '\\$&');
}

function buildWildcardRegex(pattern: string) {
  return new RegExp(`^${escapeRegex(pattern).replace(/\*/g, '.*')}$`);
}

function buildVercelPreviewRegex(origin: string) {
  const match = origin.match(/^https:\/\/([a-z0-9-]+)\.vercel\.app$/i);
  if (!match) {
    return null;
  }

  return new RegExp(`^https://${escapeRegex(match[1])}-.+\\.vercel\\.app$`, 'i');
}

function getAllowedCorsOrigins() {
  const allowAllOrigins = process.env.CORS_ALLOW_ALL === 'true';
  const raw = process.env.FRONTEND_URL;

  if (allowAllOrigins) {
    return {
      allowAllOrigins: true,
      exactOrigins: [] as string[],
      patternOrigins: [] as RegExp[],
    };
  }

  if (!raw) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Falta FRONTEND_URL en produccion');
    }
    return {
      allowAllOrigins: false,
      exactOrigins: ['http://localhost:3000'],
      patternOrigins: [],
    };
  }

  const exactOrigins = parseOriginList(raw);
  const patternOrigins = parseOriginList(process.env.FRONTEND_URL_PATTERNS).map((pattern) =>
    buildWildcardRegex(pattern),
  );

  for (const origin of exactOrigins) {
    const vercelPreviewRegex = buildVercelPreviewRegex(origin);
    if (vercelPreviewRegex) {
      patternOrigins.push(vercelPreviewRegex);
    }
  }

  return {
    allowAllOrigins: false,
    exactOrigins,
    patternOrigins,
  };
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.getHttpAdapter().getInstance().disable('x-powered-by');

  const { allowAllOrigins, exactOrigins, patternOrigins } = getAllowedCorsOrigins();

  app.enableCors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowAllOrigins) return callback(null, true);

      const normalizedOrigin = normalizeOrigin(origin);
      const isAllowed =
        exactOrigins.includes(normalizedOrigin) ||
        patternOrigins.some((pattern) => pattern.test(normalizedOrigin));

      return callback(null, isAllowed);
    },
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
  );

  app.setGlobalPrefix('api');

  const port = process.env.PORT ?? 3001;
  await app.listen(port);
  console.log(`🚀 Backend corriendo en http://localhost:${port}/api`);
}

bootstrap();
