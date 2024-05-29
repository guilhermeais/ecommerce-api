import { PaginatedResponse } from '@/core/types/pagination';
import { Role } from '@/domain/auth/enterprise/entities/enums/role';
import { User } from '@/domain/auth/enterprise/entities/user';
import { ListProductsUseCase } from '@/domain/product/application/use-cases/list-products';
import { CurrentUser } from '@/infra/auth/current-user.decorator';
import { Roles } from '@/infra/auth/roles.decorator';
import { Logger } from '@/shared/logger';
import { Controller, Get, Query } from '@nestjs/common';
import { z } from 'zod';
import { ZodValidationPipe } from '../../pipes/zod-validation.pipe';
import {
  ProductHTTPResponse,
  ProductPresenter,
} from './presenters/product-presenter';

const ListProductsParamsSchema = z.object({
  limit: z
    .number({
      coerce: true,
    })
    .default(10),
  page: z
    .number({
      coerce: true,
    })
    .default(1),
  name: z
    .string({
      message: 'Nome do produto deve ser uma string!',
    })
    .optional(),
  subCategoryId: z
    .string({
      message: 'ID da subcategoria deve ser uma string!',
    })
    .optional(),
  categoryId: z
    .string({
      message: 'ID da categoria deve ser uma string!',
    })
    .optional(),
});

export type ListProductsParams = z.infer<typeof ListProductsParamsSchema>;

export type ListProductsRespoinse = PaginatedResponse<ProductHTTPResponse>;

@Controller('/admin/products')
export class ListProductsController {
  constructor(
    private readonly listProductsUseCase: ListProductsUseCase,
    private readonly logger: Logger,
  ) {}

  @Roles(Role.MASTER, Role.ADMIN)
  @Get()
  async handle(
    @CurrentUser() currentUser: User,
    @Query(new ZodValidationPipe(ListProductsParamsSchema))
    query: ListProductsParams,
  ): Promise<ListProductsRespoinse> {
    try {
      this.logger.log(
        ListProductsController.name,
        `User ${currentUser.id.toString()} - ${currentUser.name} listing products with: ${JSON.stringify(query)}`,
      );

      const result = await this.listProductsUseCase.execute(query);

      this.logger.log(
        ListProductsController.name,
        `User ${currentUser.id.toString()} - ${currentUser.name} found ${result.total} products.`,
      );

      return {
        ...result,
        items: result.items.map(ProductPresenter.toHTTP),
      };
    } catch (error: any) {
      this.logger.error(
        ListProductsController.name,
        `Error on listing products with ${JSON.stringify(query)}: ${error.message}`,
        error.stack,
      );

      throw error;
    }
  }
}
