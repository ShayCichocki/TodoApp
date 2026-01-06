import cors from 'cors';
import { env } from '../config/environment';

export const corsMiddleware = cors({
  origin: env.nodeEnv === 'production' ? false : 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
});
