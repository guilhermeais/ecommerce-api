import { UniqueEntityID } from '@/core/entities/unique-entity-id';
import { ConfirmationTokensRepository } from '@/domain/auth/application/gateways/repositories/confirmation-tokens-repository';
import { ConfirmationToken } from '@/domain/auth/enterprise/entities/confirmation-token';
import { EnvService } from '@/infra/env/env.service';
import { Logger } from '@/shared/logger';
import { Inject, Injectable } from '@nestjs/common';
import { Model } from 'mongoose';
import { MongoDbConfirmationTokenMapper } from '../mappers/mongodb-confirmation-token.mapper';
import { MongoConfirmationTokenModel } from '../schemas/confirmation-token.model';

@Injectable()
export class MongoDbConfirmationTokensRepository
  implements ConfirmationTokensRepository
{
  constructor(
    @Inject(MongoConfirmationTokenModel.COLLECTION_NAME)
    private readonly confirmationTokenModel: Model<MongoConfirmationTokenModel>,
    private readonly env: EnvService,
    private readonly logger: Logger,
  ) {}

  async save(confirmationToken: ConfirmationToken): Promise<void> {
    try {
      this.logger.log(
        MongoDbConfirmationTokensRepository.name,
        `Saving confirmation token ${confirmationToken.id.toValue()}`,
      );

      const exists = await this.confirmationTokenModel.exists({
        _id: confirmationToken.id.toValue(),
      });

      if (exists) {
        await this.confirmationTokenModel.updateOne(
          { _id: confirmationToken.id.toValue() },
          MongoDbConfirmationTokenMapper.toPersistence(confirmationToken),
        );
        this.logger.log(
          MongoDbConfirmationTokensRepository.name,
          `Confirmation token ${confirmationToken.id.toValue()} updated`,
        );

        return;
      }

      await this.confirmationTokenModel.create(
        MongoDbConfirmationTokenMapper.toPersistence(confirmationToken),
      );

      this.logger.log(
        MongoDbConfirmationTokensRepository.name,
        `Confirmation token ${confirmationToken.id.toValue()} saved`,
      );
    } catch (error: any) {
      this.logger.error(
        MongoDbConfirmationTokensRepository.name,
        `Error saving confirmation token ${confirmationToken.id.toValue()}: ${error.message}`,
        error.stack,
      );

      throw error;
    }
  }

  async findById(id: UniqueEntityID): Promise<ConfirmationToken | null> {
    try {
      this.logger.log(
        MongoDbConfirmationTokensRepository.name,
        `Finding confirmation token ${id.toValue()}`,
      );

      const confirmationToken = await this.confirmationTokenModel.findById(
        id.toValue(),
      );

      if (!confirmationToken) {
        this.logger.log(
          MongoDbConfirmationTokensRepository.name,
          `Confirmation token ${id.toValue()} not found`,
        );

        return null;
      }

      this.logger.log(
        MongoDbConfirmationTokensRepository.name,
        `Confirmation token ${id.toValue()} found`,
      );

      return MongoDbConfirmationTokenMapper.toDomain(confirmationToken);
    } catch (error: any) {
      this.logger.error(
        MongoDbConfirmationTokensRepository.name,
        `Error finding confirmation token ${id.toValue()}: ${error.message}`,
        error.stack,
      );

      throw error;
    }
  }

  async clear(): Promise<void> {
    const isTesting = this.env.get('IS_TESTING');
    if (isTesting) {
      await this.confirmationTokenModel.deleteMany({}).exec();
      return;
    }

    throw new Error('You can only clear the database in testing environment');
  }
}
