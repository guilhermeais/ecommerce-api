import { ConfirmationTokensRepository } from '@/domain/auth/application/gateways/repositories/confirmation-tokens-repository';
import { SignUpInvitesRepository } from '@/domain/auth/application/gateways/repositories/sign-up-invites.repository';
import { UsersRepository } from '@/domain/auth/application/gateways/repositories/user-repository';
import { CategoriesRepository } from '@/domain/product/application/gateways/repositories/categories-repository';
import { ProductsRepository } from '@/domain/product/application/gateways/repositories/products-repository';
import { ShowcaseProductsRepository } from '@/domain/showcase/application/gateways/repositories/showcase-products-repository';
import { Module } from '@nestjs/common';
import { MongoDbConfirmationTokensRepository } from './mongodb/auth/repositories/mongodb-confirmation-tokens.repository';
import { MongoDbSignUpInvitesRepository } from './mongodb/auth/repositories/mongodb-signup-invites.repository';
import { MongoDbUsersRepository } from './mongodb/auth/repositories/mongodb-users.repository';
import { MongoConfirmationTokenModelProvider } from './mongodb/auth/schemas/confirmation-token.model';
import { MongoSignUpModelProvider } from './mongodb/auth/schemas/sign-up-invite.model';
import { MongoUserModelProvider } from './mongodb/auth/schemas/user.model';
import {
  MONGOOSE_CONNECTION_PROVIDER,
  MongooseConnectionFactory,
} from './mongodb/mongoose-connection.provider';
import { MongoDbCategoriesRepository } from './mongodb/products/repositories/mongodb-categories.repository';
import { MongoDbProductsRepository } from './mongodb/products/repositories/mongodb-products.repository';
import { MongoCategoryModelProvider } from './mongodb/products/schemas/category.model';
import { MongoProductModelProvider } from './mongodb/products/schemas/product.model';
import { MongoDbShowcaseProductsRepository } from './mongodb/showcase/repositories/mongodb-showcase-products.repository';

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
      useClass: MongoDbCategoriesRepository,
    },
    {
      provide: ProductsRepository,
      useClass: MongoDbProductsRepository,
    },
    {
      provide: ShowcaseProductsRepository,
      useClass: MongoDbShowcaseProductsRepository,
    },
    MongooseConnectionFactory,
    MongoUserModelProvider,
    MongoConfirmationTokenModelProvider,
    MongoSignUpModelProvider,
    MongoCategoryModelProvider,
    MongoProductModelProvider,
  ],
  exports: [
    MONGOOSE_CONNECTION_PROVIDER,
    UsersRepository,
    ConfirmationTokensRepository,
    SignUpInvitesRepository,

    ProductsRepository,
    CategoriesRepository,

    ShowcaseProductsRepository,
  ],
})
export class DatabaseModule {}
