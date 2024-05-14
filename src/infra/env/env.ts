import { z } from 'zod';
import 'dotenv/config';

export const envSchema = z.object({
  PORT: z.coerce.number().optional().default(3000),
  JWT_PRIVATE_KEY: z.string(),
  JWT_PUBLIC_KEY: z.string(),

  APP_NAME: z.string().optional().default('Ecommerce dos Pia'),
});

export type Env = z.infer<typeof envSchema>;
