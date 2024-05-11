import { Repository } from '@/core/types/repository';
import { ConfirmationToken } from '@/domain/auth/enterprise/entities/confirmation-token';

export abstract class ConfirmationTokensRepository
  implements Repository<ConfirmationToken>
{
  abstract save(confirmationToken: ConfirmationToken): Promise<void>;
  abstract findByToken(token: string): Promise<ConfirmationToken | undefined>;
  abstract clear(): Promise<void>;
}
