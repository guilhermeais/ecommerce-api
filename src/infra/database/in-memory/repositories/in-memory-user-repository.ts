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
    const index = this.users.findIndex((u) => u.id.equals(user.id));

    if (index === -1) {
      this.users.push(user);
    } else {
      this.users[index] = user;
    }
  }

  async findById(id: UniqueEntityID): Promise<User | null> {
    return this.users.find((user) => user.id.equals(id)) || null;
  }

  async clear(): Promise<void> {
    this.users.length = 0;
  }
}
