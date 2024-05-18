import { ClientSignUpUseCase } from '@/domain/auth/application/use-cases/client-sign-up';
import { ConfirmAccountUseCase } from '@/domain/auth/application/use-cases/confirm-account';
import { LoginUseCase } from '@/domain/auth/application/use-cases/login';
import { CryptographyModule } from '@/infra/cryptography/cryptography.module';
import { DatabaseModule } from '@/infra/database/database.module';
import { EventsModule } from '@/infra/events/events.module';
import { Module } from '@nestjs/common';
import { ClientSignUpController } from './controllers/auth/client-sign-up.controller';
import { ConfirmAccountController } from './controllers/auth/confirm-account.controller';
import { LoginController } from './controllers/auth/login.controller';

@Module({
  imports: [EventsModule, DatabaseModule, CryptographyModule],
  controllers: [
    ClientSignUpController,
    ConfirmAccountController,
    LoginController,
  ],
  providers: [ClientSignUpUseCase, ConfirmAccountUseCase, LoginUseCase],
})
export class HttpModule {}
