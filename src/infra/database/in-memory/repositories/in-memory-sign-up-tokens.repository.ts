import { UniqueEntityID } from '@/core/entities/unique-entity-id';
import { SignUpInvitesRepository } from '@/domain/auth/application/gateways/repositories/sign-up-invites.repository';
import { SignUpInvite } from '@/domain/auth/enterprise/entities/signup-invite';

export class InMemorySignUpInvitesRepository
  implements SignUpInvitesRepository
{
  private readonly invites: SignUpInvite[] = [];

  async clear(): Promise<void> {
    this.invites.length = 0;
  }

  async save(signUpInvite: SignUpInvite): Promise<void> {
    const index = this.invites.findIndex((t) => t.id.equals(signUpInvite.id));

    if (index === -1) {
      this.invites.push(signUpInvite);
    } else {
      this.invites[index] = signUpInvite;
    }
  }

  async findById(id: UniqueEntityID): Promise<SignUpInvite | null> {
    const found = this.invites.find((t) => t.id.equals(id));

    return found || null;
  }
}
