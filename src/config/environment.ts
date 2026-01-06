import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

interface Environment {
  port: number;
  nodeEnv: string;
  appName: string;
  clientDistPath: string;
  databaseUrl: string;
  sessionSecret: string;
}

function validateEnvironment(): Environment {
  const port = process.env['PORT'];
  const nodeEnv = process.env['NODE_ENV'] ?? 'development';
  const appName = process.env['APP_NAME'] ?? 'express-hello-app';

  if (port === undefined) {
    throw new Error('PORT environment variable is required');
  }

  const portNumber = parseInt(port, 10);
  if (isNaN(portNumber) || portNumber < 0 || portNumber > 65535) {
    throw new Error('PORT must be a valid number between 0 and 65535');
  }

  const clientDistPath = path.resolve(__dirname, '../../client/dist');

  const databaseUrl = process.env['DATABASE_URL'];
  if (!databaseUrl) {
    throw new Error('DATABASE_URL environment variable is required');
  }

  const sessionSecret = process.env['SESSION_SECRET'];
  if (!sessionSecret) {
    throw new Error('SESSION_SECRET environment variable is required');
  }

  if (sessionSecret.length < 32) {
    throw new Error('SESSION_SECRET must be at least 32 characters long');
  }

  return {
    port: portNumber,
    nodeEnv,
    appName,
    clientDistPath,
    databaseUrl,
    sessionSecret,
  };
}

export const env: Environment = validateEnvironment();
