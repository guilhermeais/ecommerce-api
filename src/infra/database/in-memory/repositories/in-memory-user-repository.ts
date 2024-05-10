import { UniqueEntityID } from '@/core/entities/unique-entity-id';
import { UserRepository } from '@/domain/auth/application/gateways/repositories/user-repository';
import { User } from '@/domain/auth/enterprise/entities/user';
import { Email } from '@/domain/auth/enterprise/entities/value-objects/email';

export class InMemoryUserRepository implements UserRepository {
  private readonly users: User[] = [];

  async findByEmail(email: Email): Promise<User | null> {
    return this.users.find((user) => user.email.equals(email)) || null;
  }

  async save(user: User): Promise<void> {
    this.users.push(user);
  }

  async findById(id: UniqueEntityID): Promise<User | null> {
    return this.users.find((user) => user.id.equals(id)) || null;
  }
}
