import { ConfirmAccountUseCase } from '@/domain/auth/application/use-cases/confirm-account';
import { User } from '@/domain/auth/enterprise/entities/user';
import { CurrentUser } from '@/infra/auth/current-user.decorator';
import { Logger } from '@/shared/logger';
import { Controller, Param, Post } from '@nestjs/common';
import { z } from 'zod';
import { ZodValidationPipe } from '../../pipes/zod-validation.pipe';

@Controller('/sign-up/:confirmationId/confirm')
export class ConfirmAccountController {
  constructor(
    private readonly clientSignUpUseCase: ConfirmAccountUseCase,
    private readonly logger: Logger,
  ) {}

  @Post()
  async handle(
    @Param(
      'confirmationId',
      new ZodValidationPipe(
        z
          .string({
            message: 'confirmationId é obrigatório.',
          })
          .uuid({
            message: 'confirmationId deve ser um UUID.',
          }),
      ),
    )
    confirmationId: string,
    @CurrentUser() user: User,
  ): Promise<void> {
    try {
      this.logger.log(
        ConfirmAccountController.name,
        `Confirming account with confirmationId ${confirmationId} to user ${user.id.toString()} - ${user.name}`,
      );

      await this.clientSignUpUseCase.execute({
        confirmationId,
        userId: user.id.toString(),
      });

      this.logger.log(
        ConfirmAccountController.name,
        `Account confirmed with confirmationId ${confirmationId} to user ${user.id.toString()} - ${user.name}`,
      );
    } catch (error: any) {
      this.logger.error(
        ConfirmAccountController.name,
        `Error: ${JSON.stringify(error)}`,
        error.stack,
      );

      throw error;
    }
  }
}
