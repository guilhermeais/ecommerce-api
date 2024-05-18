import { UniqueEntityID } from '@/core/entities/unique-entity-id';
import { Repository } from '@/core/types/repository';
import { SignUpInvite } from '@/domain/auth/enterprise/entities/signup-invite';

export abstract class SignUpInvitesRepository
  implements Repository<SignUpInvite>
{
  abstract findById(id: UniqueEntityID): Promise<SignUpInvite | null>;
  abstract save(signUpInvite: SignUpInvite): Promise<void>;
  abstract clear(): Promise<void>;
}
