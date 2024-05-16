import { z } from 'zod';
import 'dotenv/config';

export const envSchema = z.object({
  PORT: z.coerce.number().optional().default(3000),
  JWT_PRIVATE_KEY: z.string(),
  JWT_PUBLIC_KEY: z.string(),

  APP_NAME: z.string().optional().default('PiaLabs Ecommerce'),

  APP_EMAIL: z.string().email(),

  APP_CONFIRMATION_URL: z.string().url(),

  GOOGLE_CLIENT_ID: z.string(),
  GOOGLE_CLIENT_SECRET: z.string(),
  GOOGLE_REFRESH_TOKEN: z.string(),
  GOOGLE_REDIRECT_URI: z
    .string()
    .default('https://developers.google.com/oauthplayground'),
});

export type Env = z.infer<typeof envSchema>;
