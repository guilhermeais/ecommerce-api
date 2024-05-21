import { UniqueEntityID } from '@/core/entities/unique-entity-id';
import { PaginatedResponse } from '@/core/types/pagination';
import { SignUpInvitesRepository } from '@/domain/auth/application/gateways/repositories/sign-up-invites.repository';
import { SignUpInvite } from '@/domain/auth/enterprise/entities/signup-invite';

export class InMemorySignUpInvitesRepository
  implements SignUpInvitesRepository
{
  private readonly invites: SignUpInvite[] = [];
  async list(request: {
    page: number;
    limit: number;
  }): Promise<PaginatedResponse<SignUpInvite>> {
    const page = request.page - 1;
    const start = page * request.limit;
    const end = start + request.limit;

    const items = this.invites.slice(start, end);
    const pages = Math.ceil(this.invites.length / request.limit);

    return {
      items,
      total: this.invites.length,
      pages,
      limit: request.limit,
      currentPage: request.page,
    };
  }

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
