import session from 'express-session';
import ConnectSQLite3 from 'connect-sqlite3';
import path from 'path';
import { env } from './environment';

const SQLiteStore = ConnectSQLite3(session);

export const sessionConfig = session({
  store: new SQLiteStore({
    db: 'sessions.db',
    dir: path.resolve(__dirname, '../../prisma'),
  }) as session.Store,
  secret: env.sessionSecret,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: env.nodeEnv === 'production',
    httpOnly: true,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    sameSite: 'lax',
  },
  name: 'sessionId',
});
