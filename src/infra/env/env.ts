import { z } from 'zod';
import 'dotenv/config';

export const envSchema = z.object({
  PORT: z.coerce.number().optional().default(3000),
  JWT_PRIVATE_KEY: z.string(),
  JWT_PUBLIC_KEY: z.string(),

  CONFIRMATION_TOKEN_EXPIRES_IN: z.coerce
    .number()
    .optional()
    .default(1000 * 60 * 60 * 24),

  SIGNUP_INVITE_EXPIRES_IN: z.coerce
    .number()
    .optional()
    .default(1000 * 60 * 60 * 24),

  APP_NAME: z.string().optional().default('PiaLabs Ecommerce'),

  APP_EMAIL: z.string().email(),

  ACCOUNT_CONFIRMATION_URL: z.string().url(),

  FINISH_SIGNUP_INVITE_URL: z.string().url(),

  GOOGLE_CLIENT_ID: z.string(),
  GOOGLE_CLIENT_SECRET: z.string(),
  GOOGLE_REFRESH_TOKEN: z.string(),
  GOOGLE_REDIRECT_URI: z
    .string()
    .default('https://developers.google.com/oauthplayground'),

  GOOGLE_STORAGE_BUCKET: z.string(),
  GOOGLE_APPLICATION_CREDENTIALS: z.string().base64({
    message:
      'GOOGLE_APPLICATION_CREDENTIALS deve ser as credenciais em base64.',
  }),
  MONGO_URI: z.string(),
  IS_TESTING: z
    .boolean({
      coerce: true,
    })
    .optional()
    .default(false),
});

export type Env = z.infer<typeof envSchema>;
