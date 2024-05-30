import { PaginatedResponse } from '@/core/types/pagination';
import { ListSignUpInvitesUseCase } from '@/domain/auth/application/use-cases/list-signup-invites';
import { Role } from '@/domain/auth/enterprise/entities/enums/role';
import { User } from '@/domain/auth/enterprise/entities/user';
import { CurrentUser } from '@/infra/auth/current-user.decorator';
import { Roles } from '@/infra/auth/roles.decorator';
import { Logger } from '@/shared/logger';
import { Controller, Get, Query } from '@nestjs/common';
import { z } from 'zod';
import { ZodValidationPipe } from '../../pipes/zod-validation.pipe';
import {
  SignUpInviteHTTPResponse,
  SignUpInvitePresenter,
} from '../presenters/sign-up-invite-presenter';

const ListSignUpInvitesQuerySchema = z.object({
  limit: z
    .number({
      coerce: true,
    })
    .default(10),
  page: z
    .number({
      coerce: true,
    })
    .default(1),
});

export type ListSignUpInvitesQuery = z.infer<
  typeof ListSignUpInvitesQuerySchema
>;

export type ListSignUpInvitesResponse =
  PaginatedResponse<SignUpInviteHTTPResponse>;

@Controller('/admin/sign-up/invites')
export class ListSignUpInvitesController {
  constructor(
    private readonly listSignUpInvitesUseCase: ListSignUpInvitesUseCase,
    private readonly logger: Logger,
  ) {}

  @Roles(Role.MASTER, Role.ADMIN)
  @Get()
  async handle(
    @Query(new ZodValidationPipe(ListSignUpInvitesQuerySchema))
    query: ListSignUpInvitesQuery,
    @CurrentUser() currentUser: User,
  ): Promise<ListSignUpInvitesResponse> {
    const { limit, page } = query;
    try {
      this.logger.log(
        ListSignUpInvitesController.name,
        `User ${currentUser.id.toString()} - ${currentUser.name} listing invites with: ${JSON.stringify(query)}`,
      );

      const result = await this.listSignUpInvitesUseCase.execute({
        limit,
        page,
      });

      this.logger.log(
        ListSignUpInvitesController.name,
        `User ${currentUser.id.toString()} - ${currentUser.name} found ${result.total} invites.`,
      );

      return {
        ...result,
        items: result.items.map(SignUpInvitePresenter.toHTTP),
      };
    } catch (error: any) {
      this.logger.error(
        ListSignUpInvitesController.name,
        `Error on listing invites to ${currentUser.id} - ${currentUser.name}: ${JSON.stringify(query)}: ${error.message}`,
        error.stack,
      );

      throw error;
    }
  }
}
