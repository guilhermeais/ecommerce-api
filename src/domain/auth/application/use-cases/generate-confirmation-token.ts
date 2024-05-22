import { UniqueEntityID } from '@/core/entities/unique-entity-id';
import { EntityNotFoundError } from '@/core/errors/commom/entity-not-found-error';
import { UseCase } from '@/core/types/use-case';
import { EnvService } from '@/infra/env/env.service';
import { Logger } from '@/shared/logger';
import { Injectable } from '@nestjs/common';
import { ConfirmationToken } from '../../enterprise/entities/confirmation-token';
import { ConfirmationTokensRepository } from '../gateways/repositories/confirmation-tokens-repository';
import { UsersRepository } from '../gateways/repositories/user-repository';

export type GenerateConfirmationTokenRequest = {
  userId: string;
  expiresIn?: number;
};

export type GenerateConfirmationTokenResponse = ConfirmationToken;

@Injectable()
export class GenerateConfirmationTokenUseCase
  implements
    UseCase<
      GenerateConfirmationTokenRequest,
      GenerateConfirmationTokenResponse
    >
{
  constructor(
    private readonly userRepository: UsersRepository,
    private readonly logger: Logger,
    private readonly confirmationTokenRepository: ConfirmationTokensRepository,
    private readonly envService: EnvService,
  ) {}

  async execute(
    request: GenerateConfirmationTokenRequest,
  ): Promise<GenerateConfirmationTokenResponse> {
    try {
      this.logger.log(
        GenerateConfirmationTokenUseCase.name,
        `Generating confirmation token for user ${request.userId}`,
      );

      const userId = new UniqueEntityID(request.userId);

      const user = await this.userRepository.findById(userId);

      if (!user) {
        throw new EntityNotFoundError('Usuário', request.userId);
      }

      const CONFIRMATION_TOKEN_EXPIRES_IN = this.envService.get(
        'CONFIRMATION_TOKEN_EXPIRES_IN',
      );

      const expiresIn = request.expiresIn || CONFIRMATION_TOKEN_EXPIRES_IN;

      this.logger.log(
        GenerateConfirmationTokenUseCase.name,
        `Generating confirmation token for user ${request.userId} with expiration ${expiresIn}`,
      );

      const confirmationToken = ConfirmationToken.create({
        expiresIn,
        userId: user.id,
        email: user.email,
        userName: user.name,
      });

      this.logger.log(
        GenerateConfirmationTokenUseCase.name,
        `Saving confirmation token ${confirmationToken.id.toString()} for user ${request.userId}`,
      );

      await this.confirmationTokenRepository.save(confirmationToken);

      return confirmationToken;
    } catch (error: any) {
      this.logger.error(
        GenerateConfirmationTokenUseCase.name,
        `Error generating confirmation token for user ${request.userId}`,
        error.stack,
      );

      throw error;
    }
  }
}
