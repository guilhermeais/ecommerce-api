import { ClientSignUpUseCase } from '@/domain/auth/application/use-cases/client-sign-up';
import { ConfirmAccountUseCase } from '@/domain/auth/application/use-cases/confirm-account';
import { CreateSignUpInviteUseCase } from '@/domain/auth/application/use-cases/create-signup-invite';
import { FinishSignUpInviteUseCase } from '@/domain/auth/application/use-cases/finish-sign-up-invite';
import { ListSignUpInvitesUseCase } from '@/domain/auth/application/use-cases/list-signup-invites';
import { LoginUseCase } from '@/domain/auth/application/use-cases/login';
import { CreateCategoryUseCase } from '@/domain/product/application/use-cases/create-category';
import { CreateProductUseCase } from '@/domain/product/application/use-cases/create-product';
import { DeleteCategoryUseCase } from '@/domain/product/application/use-cases/delete-category';
import { GetProductByIdUseCase } from '@/domain/product/application/use-cases/get-product-by-id';
import { ListCategoriesUseCase } from '@/domain/product/application/use-cases/list-categories';
import { ListProductsUseCase } from '@/domain/product/application/use-cases/list-products';
import { UpdateCategoryUseCase } from '@/domain/product/application/use-cases/update-category';
import { UpdateProductUseCase } from '@/domain/product/application/use-cases/update-product';
import { CheckoutUseCase } from '@/domain/showcase/application/use-cases/checkout';
import { GetCustomerOrders } from '@/domain/showcase/application/use-cases/get-customer-orders';
import { GetShowcaseCategoriesUseCase } from '@/domain/showcase/application/use-cases/get-showcase-categories';
import { GetShowcaseProductUseCase } from '@/domain/showcase/application/use-cases/get-showcase-product';
import { GetShowcaseProductsUseCase } from '@/domain/showcase/application/use-cases/get-showcase-products';
import { GetSimilarProductsUseCase } from '@/domain/showcase/application/use-cases/get-similar-products';
import { CryptographyModule } from '@/infra/cryptography/cryptography.module';
import { DatabaseModule } from '@/infra/database/database.module';
import { EventsModule } from '@/infra/events/events.module';
import { Module } from '@nestjs/common';
import { MachineLearningModule } from '../machine-learning/machine-learning.module';
import { StorageModule } from '../storage/storage.module';
import { ClientSignUpController } from './controllers/auth/client-sign-up.controller';
import { ConfirmAccountController } from './controllers/auth/confirm-account.controller';
import { CreateSignUpInviteController } from './controllers/auth/create-sign-up-invite.controller';
import { FinishSignUpInviteController } from './controllers/auth/finish-sign-up-invite.controller';
import { GetLoggedUserController } from './controllers/auth/get-logged-user.controller';
import { ListSignUpInvitesController } from './controllers/auth/list-sign-up-invites.controller';
import { LoginController } from './controllers/auth/login.controller';
import { CreateCategoryController } from './controllers/products/create-category.controller';
import { CreateProductController } from './controllers/products/create-product.controller';
import { DeleteCategoryController } from './controllers/products/delete-category.controller';
import { GetProductByIdController } from './controllers/products/get-product-by-id.controller';
import { ListCategoriesController } from './controllers/products/list-categories.controller';
import { ListProductsController } from './controllers/products/list-products.controller';
import { UpdateCategoryController } from './controllers/products/update-category.controller';
import { UpdateProductController } from './controllers/products/update-product.controller';
import { CheckoutController } from './controllers/showcase/checkout.controller';
import { GetCustomerOrdersController } from './controllers/showcase/get-customer-orders.controller';
import { ShowcaseCategoriesController } from './controllers/showcase/showcase-categories.controller';
import { ShowcaseProductsController } from './controllers/showcase/showcase-products.controller';

@Module({
  imports: [
    EventsModule,
    DatabaseModule,
    CryptographyModule,
    StorageModule,
    MachineLearningModule,
  ],
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
    ListProductsController,
    GetProductByIdController,
    CreateCategoryController,
    ListCategoriesController,
    UpdateCategoryController,
    DeleteCategoryController,

    ShowcaseProductsController,
    ShowcaseCategoriesController,
    CheckoutController,
    GetCustomerOrdersController,
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
    ListProductsUseCase,
    GetProductByIdUseCase,
    CreateCategoryUseCase,
    ListCategoriesUseCase,
    UpdateCategoryUseCase,
    DeleteCategoryUseCase,

    GetShowcaseProductsUseCase,
    GetShowcaseProductUseCase,
    GetShowcaseCategoriesUseCase,
    GetSimilarProductsUseCase,
    CheckoutUseCase,
    GetCustomerOrders,
  ],
})
export class HttpModule {}
