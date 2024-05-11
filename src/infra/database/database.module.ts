import { UserRepository } from '@/domain/auth/application/gateways/repositories/user-repository';
import { Module } from '@nestjs/common';
import { InMemoryUserRepository } from './in-memory/repositories/in-memory-user-repository';
import { ConfirmationTokensRepository } from '@/domain/auth/application/gateways/repositories/confirmation-tokens-repository';
import { InMemoryConfirmationTokensRepository } from './in-memory/repositories/in-memory-confirmation-tokens.repository';

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
  ],
  exports: [UserRepository, ConfirmationTokensRepository],
})
export class DatabaseModule {}
