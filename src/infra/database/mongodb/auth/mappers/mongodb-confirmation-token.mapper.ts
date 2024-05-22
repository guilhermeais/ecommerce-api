import { ConfirmationToken } from '@/domain/auth/enterprise/entities/confirmation-token';
import { MongoConfirmationTokenModel } from '../schemas/confirmation-token.model';
import { UniqueEntityID } from '@/core/entities/unique-entity-id';
import { Email } from '@/domain/auth/enterprise/entities/value-objects/email';

export class MongoDbConfirmationTokenMapper {
  static toPersistence(
    confirmationToken: ConfirmationToken,
  ): MongoConfirmationTokenModel {
    return {
      _id: confirmationToken.id.toValue(),
      id: confirmationToken.id.toValue(),
      email: confirmationToken.email.value,
      userId: confirmationToken.userId.toValue(),
      userName: confirmationToken.userName,
      expiresIn: confirmationToken.expiresIn,
      used: confirmationToken.used,
      createdAt: confirmationToken.createdAt,
    };
  }

  static toDomain(
    confirmationToken: MongoConfirmationTokenModel,
  ): ConfirmationToken {
    return ConfirmationToken.restore(
      {
        email: Email.restore(confirmationToken.email),
        userId: new UniqueEntityID(confirmationToken.userId),
        userName: confirmationToken.userName,
        expiresIn: confirmationToken.expiresIn,
        used: confirmationToken.used,
        createdAt: confirmationToken.createdAt,
      },
      new UniqueEntityID(confirmationToken.id),
    );
  }
}
