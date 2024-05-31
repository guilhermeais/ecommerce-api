import { Role } from '@/domain/auth/enterprise/entities/enums/role';
import { User } from '@/domain/auth/enterprise/entities/user';
import { GetProductByIdUseCase } from '@/domain/product/application/use-cases/get-product-by-id';
import { CurrentUser } from '@/infra/auth/current-user.decorator';
import { Roles } from '@/infra/auth/roles.decorator';
import { Logger } from '@/shared/logger';
import { Controller, Get, Param } from '@nestjs/common';
import { z } from 'zod';
import { ZodValidationPipe } from '../../pipes/zod-validation.pipe';
import {
  ProductHTTPResponse,
  ProductPresenter,
} from './presenters/product-presenter';

export type ListProductsRespoinse = ProductHTTPResponse;

@Controller('/admin/products')
export class GetProductByIdController {
  constructor(
    private readonly getProductByIdUseCase: GetProductByIdUseCase,
    private readonly logger: Logger,
  ) {}

  @Roles(Role.MASTER, Role.ADMIN)
  @Get('/:id')
  async handle(
    @CurrentUser() currentUser: User,
    @Param(
      'id',
      new ZodValidationPipe(
        z.string().uuid({
          message: 'ID do produto deve ser um UUID válido!',
        }),
      ),
    )
    id: string,
  ): Promise<ListProductsRespoinse> {
    try {
      this.logger.log(
        GetProductByIdController.name,
        `User ${currentUser.id.toString()} - ${currentUser.name} getting the product with id: ${id}`,
      );

      const result = await this.getProductByIdUseCase.execute({
        id,
      });

      this.logger.log(
        GetProductByIdController.name,
        `User ${currentUser.id.toString()} - ${currentUser.name} found the product ${result.id.toString()} - ${result.name}.`,
      );

      return ProductPresenter.toHTTP(result);
    } catch (error: any) {
      this.logger.error(
        GetProductByIdController.name,
        `Error getting the product ${id}: ${error.message}`,
        error.stack,
      );

      throw error;
    }
  }
}
