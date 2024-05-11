import { UniqueEntityID } from '@/core/entities/unique-entity-id';
import { User } from '../../../enterprise/entities/user';
import { Email } from '../../../enterprise/entities/value-objects/email';

export abstract class UserRepository {
  abstract save(user: User): Promise<void>;
  abstract findByEmail(email: Email): Promise<User | null>;
  abstract findById(id: UniqueEntityID): Promise<User | null>;

  abstract clear(): Promise<void>;
}
