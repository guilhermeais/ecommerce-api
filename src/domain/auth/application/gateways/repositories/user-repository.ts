import { UniqueEntityID } from '@/core/entities/unique-entity-id';
import { User } from '../../../enterprise/entities/user';
import { Email } from '../../../enterprise/entities/value-objects/email';
import { Repository } from '@/core/types/repository';

export abstract class UsersRepository implements Repository<User> {
  abstract save(user: User): Promise<void>;
  abstract findByEmail(email: Email): Promise<User | null>;
  abstract findById(id: UniqueEntityID): Promise<User | null>;

  abstract clear(): Promise<void>;
}
