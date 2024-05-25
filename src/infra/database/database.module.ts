import { ConfirmationTokensRepository } from '@/domain/auth/application/gateways/repositories/confirmation-tokens-repository';
import { SignUpInvitesRepository } from '@/domain/auth/application/gateways/repositories/sign-up-invites.repository';
import { UsersRepository } from '@/domain/auth/application/gateways/repositories/user-repository';
import { CategoriesRepository } from '@/domain/product/application/gateways/repositories/categories-repository';
import { ProductsRepository } from '@/domain/product/application/gateways/repositories/products-repository';
import { Module } from '@nestjs/common';
import { InMemoryCategoriesRepository } from './in-memory/repositories/products/in-memory-categories.repository';
import { InMemoryProductsRepository } from './in-memory/repositories/products/in-memory-products.repository';
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
    {
      provide: CategoriesRepository,
      useClass: InMemoryCategoriesRepository,
    },
    {
      provide: ProductsRepository,
      useClass: InMemoryProductsRepository,
    },
    AuthMongooseConnectionFactory,
    MongoUserModelProvider,
    MongoConfirmationTokenModelProvider,
    MongoSignUpModelProvider,
  ],
  exports: [
    AUTH_MONGOOSE_CONNECTION_PROVIDER,
    UsersRepository,
    ConfirmationTokensRepository,
    SignUpInvitesRepository,

    ProductsRepository,
    CategoriesRepository,
  ],
})
export class DatabaseModule {}
