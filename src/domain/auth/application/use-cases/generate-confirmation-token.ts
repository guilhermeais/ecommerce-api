import { UseCase } from '@/core/types/use-case';
import { UserRepository } from '../gateways/repositories/user-repository';
import { Logger } from '@/shared/logger';
import { Encrypter } from '../gateways/cryptography/encrypter';
import { UniqueEntityID } from '@/core/entities/unique-entity-id';
import { EntityNotFoundError } from '@/core/errors/commom/entity-not-found-error';
import { ConfirmationToken } from '../../enterprise/entities/confirmation-token';
import { ConfirmationTokensRepository } from '../gateways/repositories/confirmation-tokens-repository';

export type GenerateConfirmationTokenRequest = {
  userId: string;
  expiresIn?: number;
};

export type GenerateConfirmationTokenResponse = ConfirmationToken;
export class GenerateConfirmationTokenUseCase
  implements
    UseCase<
      GenerateConfirmationTokenRequest,
      GenerateConfirmationTokenResponse
    >
{
  constructor(
    private readonly userRepository: UserRepository,
    private readonly logger: Logger,
    private readonly encrypter: Encrypter,
    private readonly confirmationTokenRepository: ConfirmationTokensRepository,
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
      const ONE_DAY_MS = 1000 * 60 * 60 * 24;

      const expiresIn = request.expiresIn || ONE_DAY_MS;

      const payload = {
        userId: user.id.toString(),
        email: user.email.value,
        createdAt: new Date().toISOString(),
      };

      this.logger.log(
        GenerateConfirmationTokenUseCase.name,
        `Generating confirmation token for user ${request.userId} with expiration ${expiresIn}: ${JSON.stringify(payload)}`,
      );

      const token = await this.encrypter.encrypt(payload, {
        expiresIn,
      });

      this.logger.log(
        GenerateConfirmationTokenUseCase.name,
        `Generated confirmation token for user ${request.userId}: ${token}`,
      );

      const confirmationToken = ConfirmationToken.create({
        token,
        expiresIn,
        userId: user.id.toString(),
      });

      this.logger.log(
        GenerateConfirmationTokenUseCase.name,
        `Saving confirmation token for user ${request.userId}`,
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
