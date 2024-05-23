import { SignUpInvite } from '@/domain/auth/enterprise/entities/signup-invite';
import { MongoSignUpInviteModel } from '../schemas/sign-up-invite.model';
import { MongoDbUserMapper } from './mongodb-user.mapper';
import { Email } from '@/domain/auth/enterprise/entities/value-objects/email';
import { UniqueEntityID } from '@/core/entities/unique-entity-id';

export class MongoDbSignUpInvitesMapper {
  static toPersistence(
    signUpInvite: SignUpInvite,
  ): Omit<MongoSignUpInviteModel, 'sentBy'> {
    return {
      _id: signUpInvite.id.toValue(),
      id: signUpInvite.id.toValue(),
      createdAt: signUpInvite.createdAt,
      guestEmail: signUpInvite.guestEmail.value,
      guestName: signUpInvite.guestName,
      sentById: signUpInvite.sentBy.id.toValue(),
      status: signUpInvite.status,
      expiresIn: signUpInvite.expiresIn,
    };
  }

  static toDomain(signUpInvite: MongoSignUpInviteModel): SignUpInvite {
    return SignUpInvite.restore(
      {
        createdAt: signUpInvite.createdAt,
        guestEmail: Email.restore(signUpInvite.guestEmail),
        guestName: signUpInvite.guestName,
        sentBy: MongoDbUserMapper.toDomain(signUpInvite.sentBy),
        status: signUpInvite.status,
        expiresIn: signUpInvite.expiresIn,
      },
      new UniqueEntityID(signUpInvite.id),
    );
  }
}
