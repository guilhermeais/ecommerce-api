import { z } from 'zod';
import 'dotenv/config';
const ONE_DAY = 1000 * 60 * 60 * 24;

export const envSchema = z.object({
  PORT: z.coerce.number().optional().default(3000),
  JWT_PRIVATE_KEY: z.string(),
  JWT_PUBLIC_KEY: z.string(),
  JWT_EXPIRES_IN: z.coerce.number().optional().default(ONE_DAY),

  CONFIRMATION_TOKEN_EXPIRES_IN: z.coerce.number().optional().default(ONE_DAY),

  SIGNUP_INVITE_EXPIRES_IN: z.coerce.number().optional().default(ONE_DAY),

  APP_NAME: z.string().optional().default('PiaLabs Ecommerce'),

  APP_EMAIL: z.string().email(),

  ACCOUNT_CONFIRMATION_URL: z.string().url(),

  FINISH_SIGNUP_INVITE_URL: z.string().url(),

  GOOGLE_STORAGE_BUCKET: z.string(),
  GOOGLE_APPLICATION_CREDENTIALS: z.string().base64({
    message:
      'GOOGLE_APPLICATION_CREDENTIALS deve ser as credenciais em base64.',
  }),

  GOOGLE_GMAIL_USER: z.string().email(),
  GOOGLE_GMAIL_PASSWORD: z.string(),
  MONGO_URI: z.string(),
  IS_TESTING: z
    .boolean({
      coerce: true,
    })
    .optional()
    .default(false),
});

export type Env = z.infer<typeof envSchema>;
