import { ConfirmationTokensRepository } from '@/domain/auth/application/gateways/repositories/confirmation-tokens-repository';
import { SignUpInvitesRepository } from '@/domain/auth/application/gateways/repositories/sign-up-invites.repository';
import { UsersRepository } from '@/domain/auth/application/gateways/repositories/user-repository';
import { Module } from '@nestjs/common';
import { InMemoryConfirmationTokensRepository } from './in-memory/repositories/in-memory-confirmation-tokens.repository';
import { InMemorySignUpInvitesRepository } from './in-memory/repositories/in-memory-sign-up-tokens.repository';
import {
  AUTH_MONGOOSE_CONNECTION_PROVIDER,
  AuthMongooseConnectionFactory,
} from './mongodb/auth/auth-mongoose-connection.provider';
import { MongoDbUsersRepository } from './mongodb/auth/repositories/mongodb-users.repository';
import { MongoUserModelProvider } from './mongodb/auth/schemas/user.model';

@Module({
  providers: [
    {
      provide: UsersRepository,
      useClass: MongoDbUsersRepository,
    },
    {
      provide: ConfirmationTokensRepository,
      useClass: InMemoryConfirmationTokensRepository,
    },
    {
      provide: SignUpInvitesRepository,
      useClass: InMemorySignUpInvitesRepository,
    },
    AuthMongooseConnectionFactory,
    MongoUserModelProvider,
  ],
  exports: [
    UsersRepository,
    ConfirmationTokensRepository,
    SignUpInvitesRepository,
    AUTH_MONGOOSE_CONNECTION_PROVIDER,
  ],
})
export class DatabaseModule {}
