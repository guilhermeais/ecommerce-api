import { ConfirmationTokensRepository } from '@/domain/auth/application/gateways/repositories/confirmation-tokens-repository';
import { SignUpInvitesRepository } from '@/domain/auth/application/gateways/repositories/sign-up-invites.repository';
import { UsersRepository } from '@/domain/auth/application/gateways/repositories/user-repository';
import { Module } from '@nestjs/common';
import {
  AUTH_MONGOOSE_CONNECTION_PROVIDER,
  AuthMongooseConnectionFactory,
} from './mongodb/auth/auth-mongoose-connection.provider';
import { MongoDbConfirmationTokensRepository } from './mongodb/auth/repositories/mongodb-confirmation-tokens.repository';
import { MongoDbSignUpInvitesRepository } from './mongodb/auth/repositories/mongodb-signup-invites.repository';
import { MongoDbUsersRepository } from './mongodb/auth/repositories/mongodb-users.repository';
import { MongoConfirmationTokenModelProvider } from './mongodb/auth/schemas/confirmation-token.model';
import { MongoSignUpModelProvider } from './mongodb/auth/schemas/sign-up-invite.model';
import { MongoUserModelProvider } from './mongodb/auth/schemas/user.model';

@Module({
  providers: [
    {
      provide: UsersRepository,
      useClass: MongoDbUsersRepository,
    },
    {
      provide: ConfirmationTokensRepository,
      useClass: MongoDbConfirmationTokensRepository,
    },
    {
      provide: SignUpInvitesRepository,
      useClass: MongoDbSignUpInvitesRepository,
    },
    AuthMongooseConnectionFactory,
    MongoUserModelProvider,
    MongoConfirmationTokenModelProvider,
    MongoSignUpModelProvider,
  ],
  exports: [
    UsersRepository,
    ConfirmationTokensRepository,
    SignUpInvitesRepository,
    AUTH_MONGOOSE_CONNECTION_PROVIDER,
  ],
})
export class DatabaseModule {}
