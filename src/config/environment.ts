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
  googleCalendar: {
    clientId: string;
    clientSecret: string;
    redirectUri: string;
  };
  outlookCalendar: {
    clientId: string;
    clientSecret: string;
    redirectUri: string;
  };
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

  // Google Calendar OAuth (optional - will use stub if not provided)
  const googleClientId = process.env['GOOGLE_CALENDAR_CLIENT_ID'] ?? 'STUB_CLIENT_ID';
  const googleClientSecret = process.env['GOOGLE_CALENDAR_CLIENT_SECRET'] ?? 'STUB_CLIENT_SECRET';
  const googleRedirectUri = process.env['GOOGLE_CALENDAR_REDIRECT_URI'] ?? 'http://localhost:3000/api/calendar/oauth/callback';

  // Outlook Calendar OAuth (optional - will use stub if not provided)
  const outlookClientId = process.env['OUTLOOK_CALENDAR_CLIENT_ID'] ?? 'STUB_CLIENT_ID';
  const outlookClientSecret = process.env['OUTLOOK_CALENDAR_CLIENT_SECRET'] ?? 'STUB_CLIENT_SECRET';
  const outlookRedirectUri = process.env['OUTLOOK_CALENDAR_REDIRECT_URI'] ?? 'http://localhost:3000/api/calendar/oauth/callback';

  return {
    port: portNumber,
    nodeEnv,
    appName,
    clientDistPath,
    databaseUrl,
    sessionSecret,
    googleCalendar: {
      clientId: googleClientId,
      clientSecret: googleClientSecret,
      redirectUri: googleRedirectUri,
    },
    outlookCalendar: {
      clientId: outlookClientId,
      clientSecret: outlookClientSecret,
      redirectUri: outlookRedirectUri,
    },
  };
}

export const env: Environment = validateEnvironment();
