import { UseCase } from '@/core/types/use-case';
import { SignUpInvite } from '../../enterprise/entities/signup-invite';
import { SignUpInvitesRepository } from '../gateways/repositories/sign-up-invites.repository';
import { Logger } from '@/shared/logger';
import { PaginatedRequest, PaginatedResponse } from '@/core/types/pagination';

export type ListSignUpInvitesRequest = PaginatedRequest;

export type ListSignUpInvitesResponse = PaginatedResponse<SignUpInvite>;

export class ListSignUpInvitesUseCase
  implements UseCase<ListSignUpInvitesRequest, ListSignUpInvitesResponse>
{
  constructor(
    private readonly signupInvitesRepository: SignUpInvitesRepository,
    private readonly logger: Logger,
  ) {}

  async execute(
    request: ListSignUpInvitesRequest,
  ): Promise<ListSignUpInvitesResponse> {
    this.logger.log(
      ListSignUpInvitesUseCase.name,
      `Listing all sign up invites with: ${JSON.stringify(request, null, 2)}`,
    );

    try {
      return await this.signupInvitesRepository.list(request);
    } catch (error: any) {
      this.logger.error(
        ListSignUpInvitesUseCase.name,
        error.message,
        error.stack,
      );
      throw error;
    }
  }
}
