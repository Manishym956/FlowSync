/**
 * Environment configuration module.
 *
 * Parses and validates all required environment variables at startup.
 * The application will fail immediately if required variables are missing,
 * rather than failing at runtime when the variable is first accessed.
 */

import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const envSchema = z.object({
  // Server
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('3001').transform(Number),

  // Database
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),

  // Redis
  REDIS_URL: z.string().min(1, 'REDIS_URL is required'),

  // Authentication
  API_KEY: z.string().min(1, 'API_KEY is required'),
  JWT_SECRET: z.string().min(1, 'JWT_SECRET is required'),

  // External connectors
  FHIR_BASE_URL: z.string().url().default('https://hapi.fhir.org/baseR4'),
  RANDOM_USER_API_URL: z.string().url().default('https://randomuser.me/api/'),
  MESSAGING_API_KEY: z.string().optional(),
  RESEND_API_KEY: z.string().default('re_mock_api_key_12345'),
  RESEND_FROM_EMAIL: z.string().email().default('notifications@flowsync.dev'),

  // Webhooks
  WEBHOOK_SECRET: z.string().default('dev-webhook-secret'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment configuration:');
  console.error(parsed.error.format());
  process.exit(1);
}

export const env = parsed.data;
