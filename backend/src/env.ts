import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().transform(Number).default('3000'),
  WEB_ORIGIN: z.string().default('http://localhost:5173'),
  API_BEARER: z.string().default('VB_DEV_TOKEN'),
  DATABASE_URL: z.string().default('file:./dev.db'),
  VENOM_MULTI_DEVICE: z.string().transform(val => val === 'true').default('true'),
  VENOM_SESSION_DIR: z.string().default('./sessions'),
  UPLOAD_DIR: z.string().default('./uploads'),
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
});

const env = envSchema.parse(process.env);

export default env;
