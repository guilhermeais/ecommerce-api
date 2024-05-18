import { CreateSignUpInviteUseCase } from '@/domain/auth/application/use-cases/create-signup-invite';
import { Role } from '@/domain/auth/enterprise/entities/enums/role';
import { User } from '@/domain/auth/enterprise/entities/user';
import { CurrentUser } from '@/infra/auth/current-user.decorator';
import { Roles } from '@/infra/auth/roles.decorator';
import { Logger } from '@/shared/logger';
import { Body, Controller, Post } from '@nestjs/common';
import { z } from 'zod';
import { ZodValidationPipe } from '../../pipes/zod-validation.pipe';

const CreateSignUpInviteBodySchema = z.object({
  email: z.string({
    message: 'Email do convidado é obrigatório!',
  }),
  name: z.string({
    message: 'Nome do convidado é obrigatório!',
  }),
});

export type CreateSignUpInviteBody = z.infer<
  typeof CreateSignUpInviteBodySchema
>;

export type CreateSignUpInviteResponse = {
  signUpInviteId: string;
};

@Controller('/admin/sign-up/invites')
export class CreateSignUpInviteController {
  constructor(
    private readonly createSignUpInviteUseCase: CreateSignUpInviteUseCase,
    private readonly logger: Logger,
  ) {}

  @Roles(Role.MASTER)
  @Post()
  async handle(
    @Body(new ZodValidationPipe(CreateSignUpInviteBodySchema))
    body: CreateSignUpInviteBody,
    @CurrentUser() currentUser: User,
  ): Promise<CreateSignUpInviteResponse> {
    const { email, name } = body;
    try {
      this.logger.log(
        CreateSignUpInviteController.name,
        `User ${currentUser.id.toString()} - ${currentUser.name} Creating invite with: ${JSON.stringify(body)}`,
      );

      const result = await this.createSignUpInviteUseCase.execute({
        email,
        name,
        sentBy: currentUser,
      });

      this.logger.log(
        CreateSignUpInviteController.name,
        `User ${currentUser.id.toString()} - ${currentUser.name} Created invite with: ${JSON.stringify(body)}`,
      );

      return result;
    } catch (error: any) {
      this.logger.error(
        CreateSignUpInviteController.name,
        `Error on inviting: ${JSON.stringify(body)}: ${error.message}`,
        error.stack,
      );

      throw error;
    }
  }
}
