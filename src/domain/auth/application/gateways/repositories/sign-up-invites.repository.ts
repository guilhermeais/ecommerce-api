import { UniqueEntityID } from '@/core/entities/unique-entity-id';
import { PaginatedRequest, PaginatedResponse } from '@/core/types/pagination';
import { Repository } from '@/core/types/repository';
import { SignUpInvite } from '@/domain/auth/enterprise/entities/signup-invite';

export abstract class SignUpInvitesRepository
  implements Repository<SignUpInvite>
{
  abstract list(
    request: PaginatedRequest,
  ): Promise<PaginatedResponse<SignUpInvite>>;

  abstract findById(id: UniqueEntityID): Promise<SignUpInvite | null>;
  abstract save(signUpInvite: SignUpInvite): Promise<void>;
  abstract clear(): Promise<void>;
}
