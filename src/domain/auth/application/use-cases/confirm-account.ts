import { UniqueEntityID } from '@/core/entities/unique-entity-id';
import { EntityNotFoundError } from '@/core/errors/commom/entity-not-found-error';
import { UseCase } from '@/core/types/use-case';
import { Logger } from '@/shared/logger';
import { ConfirmationTokensRepository } from '../gateways/repositories/confirmation-tokens-repository';
import { UsersRepository } from '../gateways/repositories/user-repository';
import { ConfirmationTokenExpiredError } from './errors/confirmation-token-expired-error';
import { InvalidConfirmationTokenError } from './errors/invalid-confirmation-token-error';
import { Injectable } from '@nestjs/common';

export type ConfirmAccountRequest = {
  confirmationId: string;
  userId: string;
};

export type ConfirmAccountResponse = void;

@Injectable()
export class ConfirmAccountUseCase
  implements UseCase<ConfirmAccountRequest, ConfirmAccountResponse>
{
  constructor(
    private readonly logger: Logger,
    private readonly userRepository: UsersRepository,
    private readonly confirmationTokensRepository: ConfirmationTokensRepository,
  ) {}

  async execute(
    request: ConfirmAccountRequest,
  ): Promise<ConfirmAccountResponse> {
    const { confirmationId, userId } = request;
    const requestUserId = new UniqueEntityID(userId);
    try {
      const confirmationToken =
        await this.confirmationTokensRepository.findById(
          new UniqueEntityID(confirmationId),
        );

      if (!confirmationToken) {
        throw new EntityNotFoundError('Token de confirmação', confirmationId);
      }

      if (confirmationToken.isExpired()) {
        this.logger.log(
          ConfirmAccountUseCase.name,
          `The confirmation ${confirmationId} is expired`,
        );
        throw new ConfirmationTokenExpiredError();
      }

      if (!confirmationToken.userId.equals(requestUserId)) {
        this.logger.warn(
          ConfirmAccountUseCase.name,
          `User ${userId} tried to confirm the confirmation ${confirmationId} that does not belong to him`,
        );

        throw new InvalidConfirmationTokenError();
      }

      const user = await this.userRepository.findById(confirmationToken.userId);

      if (!user) {
        throw new EntityNotFoundError(
          'Usuário',
          confirmationToken.userId.toString(),
        );
      }

      user.confirm(confirmationToken);

      await Promise.all([
        this.userRepository.save(user),
        this.confirmationTokensRepository.save(confirmationToken),
      ]);
    } catch (error: any) {
      this.logger.error(
        ConfirmAccountUseCase.name,
        `Error when trying to confirm the confirmation ${confirmationId}: ${error.message}`,
        error.stack,
      );

      throw error;
    }
  }
}
