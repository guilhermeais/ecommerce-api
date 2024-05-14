import { ClientSignUpUseCase } from '@/domain/auth/application/use-cases/client-sign-up';
import { CryptographyModule } from '@/infra/cryptography/cryptography.module';
import { DatabaseModule } from '@/infra/database/database.module';
import { EventsModule } from '@/infra/events/events.module';
import { Module } from '@nestjs/common';
import { ClientSignUpController } from './controllers/auth/client-sign-up.controller';

@Module({
  imports: [EventsModule, DatabaseModule, CryptographyModule],
  controllers: [ClientSignUpController],
  providers: [ClientSignUpUseCase],
})
export class HttpModule {}
