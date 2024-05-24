import { ClientSignUpUseCase } from '@/domain/auth/application/use-cases/client-sign-up';
import { ConfirmAccountUseCase } from '@/domain/auth/application/use-cases/confirm-account';
import { LoginUseCase } from '@/domain/auth/application/use-cases/login';
import { CryptographyModule } from '@/infra/cryptography/cryptography.module';
import { DatabaseModule } from '@/infra/database/database.module';
import { EventsModule } from '@/infra/events/events.module';
import { Module } from '@nestjs/common';
import { ClientSignUpController } from './controllers/auth/client-sign-up.controller';
import { ConfirmAccountController } from './controllers/auth/confirm-account.controller';
import { CreateSignUpInviteController } from './controllers/auth/create-sign-up-invite.controller';
import { LoginController } from './controllers/auth/login.controller';
import { CreateSignUpInviteUseCase } from '@/domain/auth/application/use-cases/create-signup-invite';
import { FinishSignUpInviteController } from './controllers/auth/finish-sign-up-invite.controller';
import { FinishSignUpInviteUseCase } from '@/domain/auth/application/use-cases/finish-sign-up-invite';
import { ListSignUpInvitesController } from './controllers/auth/list-sign-up-invites.controller';
import { ListSignUpInvitesUseCase } from '@/domain/auth/application/use-cases/list-signup-invites';
import { GetLoggedUserController } from './controllers/auth/get-logged-user.controller';

@Module({
  imports: [EventsModule, DatabaseModule, CryptographyModule],
  controllers: [
    ClientSignUpController,
    ConfirmAccountController,
    LoginController,
    CreateSignUpInviteController,
    FinishSignUpInviteController,
    ListSignUpInvitesController,
    GetLoggedUserController,
  ],
  providers: [
    ClientSignUpUseCase,
    ConfirmAccountUseCase,
    LoginUseCase,
    CreateSignUpInviteUseCase,
    FinishSignUpInviteUseCase,
    ListSignUpInvitesUseCase,
  ],
})
export class HttpModule {}
