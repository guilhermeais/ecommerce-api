import { FinishSignUpInviteUseCase } from '@/domain/auth/application/use-cases/finish-sign-up-invite';
import { Public } from '@/infra/auth/public.decorator';
import { Logger } from '@/shared/logger';
import { Body, Controller, Param, Post } from '@nestjs/common';
import { z } from 'zod';
import { ZodValidationPipe } from '../../pipes/zod-validation.pipe';
import { UserPresenter } from '../presenters/user-presenter';
import { LoginResponse } from './login.controller';

const AddressSchema = z.object({
  cep: z.string(),
  address: z.string(),
  number: z.string(),
  state: z.string(),
  city: z.string(),
});

const FinishSignUpInviteRequestSchema = z.object({
  password: z.string(),
  name: z.string(),
  cpf: z.string(),
  phone: z.string().optional(),
  address: z.optional(AddressSchema),
});

export type FinishSignUpInviteBody = z.infer<
  typeof FinishSignUpInviteRequestSchema
>;

export type FinishSignUpInviteResponse = LoginResponse;

@Controller('/admin/sign-up/invites/:inviteId/finish')
export class FinishSignUpInviteController {
  constructor(
    private readonly finishSignUpInviteUseCase: FinishSignUpInviteUseCase,
    private readonly logger: Logger,
  ) {}

  @Public()
  @Post()
  async handle(
    @Body(new ZodValidationPipe(FinishSignUpInviteRequestSchema))
    body: FinishSignUpInviteBody,
    @Param('inviteId') inviteId: string,
  ): Promise<FinishSignUpInviteResponse> {
    try {
      this.logger.log(
        FinishSignUpInviteController.name,
        `Finishing invite ${inviteId} with: ${JSON.stringify({
          ...body,
          password: '*****',
        })}`,
      );

      const { authToken, user } = await this.finishSignUpInviteUseCase.execute({
        inviteId,
        userData: body,
      });

      this.logger.log(
        FinishSignUpInviteController.name,
        `Client ${user.id.toString()} - ${user.name} signed up with email ${user.email} using the invite ${inviteId}`,
      );

      return {
        authToken,
        user: UserPresenter.toHTTP(user),
      };
    } catch (error: any) {
      this.logger.error(
        FinishSignUpInviteController.name,
        `Error on finishing invite ${inviteId}: ${JSON.stringify(error)}`,
        error.stack,
      );

      throw error;
    }
  }
}
