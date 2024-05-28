import { ClientSignUpUseCase } from '@/domain/auth/application/use-cases/client-sign-up';
import { ConfirmAccountUseCase } from '@/domain/auth/application/use-cases/confirm-account';
import { CreateSignUpInviteUseCase } from '@/domain/auth/application/use-cases/create-signup-invite';
import { FinishSignUpInviteUseCase } from '@/domain/auth/application/use-cases/finish-sign-up-invite';
import { ListSignUpInvitesUseCase } from '@/domain/auth/application/use-cases/list-signup-invites';
import { LoginUseCase } from '@/domain/auth/application/use-cases/login';
import { CreateProductUseCase } from '@/domain/product/application/use-cases/create-product';
import { UpdateProductUseCase } from '@/domain/product/application/use-cases/update-product';
import { CryptographyModule } from '@/infra/cryptography/cryptography.module';
import { DatabaseModule } from '@/infra/database/database.module';
import { EventsModule } from '@/infra/events/events.module';
import { Module } from '@nestjs/common';
import { StorageModule } from '../storage/storage.module';
import { ClientSignUpController } from './controllers/auth/client-sign-up.controller';
import { ConfirmAccountController } from './controllers/auth/confirm-account.controller';
import { CreateSignUpInviteController } from './controllers/auth/create-sign-up-invite.controller';
import { FinishSignUpInviteController } from './controllers/auth/finish-sign-up-invite.controller';
import { GetLoggedUserController } from './controllers/auth/get-logged-user.controller';
import { ListSignUpInvitesController } from './controllers/auth/list-sign-up-invites.controller';
import { LoginController } from './controllers/auth/login.controller';
import { CreateProductController } from './controllers/products/create-product.controller';
import { UpdateProductController } from './controllers/products/update-product.controller';

@Module({
  imports: [EventsModule, DatabaseModule, CryptographyModule, StorageModule],
  controllers: [
    ClientSignUpController,
    ConfirmAccountController,
    LoginController,
    CreateSignUpInviteController,
    FinishSignUpInviteController,
    ListSignUpInvitesController,
    GetLoggedUserController,

    CreateProductController,
    UpdateProductController,
  ],
  providers: [
    ClientSignUpUseCase,
    ConfirmAccountUseCase,
    LoginUseCase,
    CreateSignUpInviteUseCase,
    FinishSignUpInviteUseCase,
    ListSignUpInvitesUseCase,

    CreateProductUseCase,
    UpdateProductUseCase,
  ],
})
export class HttpModule {}
