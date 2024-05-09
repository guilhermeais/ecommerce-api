import { User } from '../../../enterprise/entities/user';
import { Email } from '../../../enterprise/entities/value-objects/email';

export abstract class UserRepository {
  abstract save(user: User): Promise<void>;
  abstract findByEmail(email: Email): Promise<User | null>;
}
