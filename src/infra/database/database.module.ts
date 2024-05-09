import { UserRepository } from '@/domain/auth/application/gateways/repositories/user-repository';
import { Module } from '@nestjs/common';
import { InMemoryUserRepository } from './in-memory/repositories/in-memory-user-repository';

@Module({
  providers: [
    {
      provide: UserRepository,
      useClass: InMemoryUserRepository,
    },
  ],
  exports: [UserRepository],
})
export class DatabaseModule {}
