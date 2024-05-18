import { UniqueEntityID } from '@/core/entities/unique-entity-id';
import { ConfirmationTokensRepository } from '@/domain/auth/application/gateways/repositories/confirmation-tokens-repository';
import { ConfirmationToken } from '@/domain/auth/enterprise/entities/confirmation-token';

export class InMemoryConfirmationTokensRepository
  implements ConfirmationTokensRepository
{
  private readonly tokens: ConfirmationToken[] = [];
  async clear(): Promise<void> {
    this.tokens.length = 0;
  }

  async save(confirmationToken: ConfirmationToken): Promise<void> {
    this.tokens.push(confirmationToken);
  }

  async findById(id: UniqueEntityID): Promise<ConfirmationToken | null> {
    const found = this.tokens.find((t) => t.id.equals(id));

    return found || null;
  }
}
