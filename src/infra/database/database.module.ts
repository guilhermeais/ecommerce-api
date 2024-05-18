import { ConfirmationTokensRepository } from '@/domain/auth/application/gateways/repositories/confirmation-tokens-repository';
import { SignUpInvitesRepository } from '@/domain/auth/application/gateways/repositories/sign-up-invites.repository';
import { UserRepository } from '@/domain/auth/application/gateways/repositories/user-repository';
import { Module } from '@nestjs/common';
import { InMemoryConfirmationTokensRepository } from './in-memory/repositories/in-memory-confirmation-tokens.repository';
import { InMemorySignUpInvitesRepository } from './in-memory/repositories/in-memory-sign-up-tokens.repository';
import { InMemoryUserRepository } from './in-memory/repositories/in-memory-user-repository';

@Module({
  providers: [
    {
      provide: UserRepository,
      useClass: InMemoryUserRepository,
    },
    {
      provide: ConfirmationTokensRepository,
      useClass: InMemoryConfirmationTokensRepository,
    },
    {
      provide: SignUpInvitesRepository,
      useClass: InMemorySignUpInvitesRepository,
    },
  ],
  exports: [
    UserRepository,
    ConfirmationTokensRepository,
    SignUpInvitesRepository,
  ],
})
export class DatabaseModule {}
