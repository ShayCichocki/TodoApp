import express, { Application, Request, Response } from 'express';
import path from 'path';
import { env } from './config/environment';
import routes from './routes';
import { corsMiddleware } from './middleware/cors';
import { sessionConfig } from './config/session';
import { prisma } from './lib/prisma';

const app: Application = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

if (env.nodeEnv === 'development') {
  app.use(corsMiddleware);
}

app.use(sessionConfig);

app.use('/', routes);

if (env.nodeEnv === 'production') {
  app.use(express.static(env.clientDistPath));

  app.get('*', (_req: Request, res: Response): void => {
    res.sendFile(path.join(env.clientDistPath, 'index.html'));
  });
}

function startServer(): void {
  app.listen(env.port, (): void => {
    // eslint-disable-next-line no-console
    console.log(`Server is running on http://localhost:${env.port}`);
    // eslint-disable-next-line no-console
    console.log(`Environment: ${env.nodeEnv}`);
    if (env.nodeEnv === 'development') {
      // eslint-disable-next-line no-console
      console.log(`API available at http://localhost:${env.port}/api`);
      // eslint-disable-next-line no-console
      console.log('Frontend dev server: http://localhost:5173');
    }
  });
}

startServer();

process.on('SIGINT', async () => {
  // eslint-disable-next-line no-console
  console.log('\nShutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  // eslint-disable-next-line no-console
  console.log('\nShutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});
