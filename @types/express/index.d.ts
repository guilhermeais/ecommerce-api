import { User } from '@/domain/auth/enterprise/entities/user';
import '@types/express';

declare module 'express-serve-static-core' {
  interface Request {
    user?: User;
  }
}
