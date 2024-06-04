import { PaginatedResponse } from '@/core/types/pagination';
import { GetShowcaseProductUseCase } from '@/domain/showcase/application/use-cases/get-showcase-product';
import { GetShowcaseProductsUseCase } from '@/domain/showcase/application/use-cases/get-showcase-products';
import { Public } from '@/infra/auth/public.decorator';
import { Logger } from '@/shared/logger';
import { Controller, Get, Param, Query } from '@nestjs/common';
import { z } from 'zod';
import { ZodValidationPipe } from '../../pipes/zod-validation.pipe';
import {
  ShowcaseProductHTTPResponse,
  ShowcaseProductPresenter,
} from './presenters/showcase-product-presenter';

const GetShowcaseProductsParamsSchema = z.object({
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

export type GetShowcaseProductsParams = z.infer<
  typeof GetShowcaseProductsParamsSchema
>;

export type GetShowcaseProductsResponse =
  PaginatedResponse<ShowcaseProductHTTPResponse>;

export type GetShowcaseProductResponse = ShowcaseProductHTTPResponse;

@Controller('/showcase/products')
export class ShowcaseProductsController {
  constructor(
    private readonly getShowcaseProducts: GetShowcaseProductsUseCase,
    private readonly getShowcaseProduct: GetShowcaseProductUseCase,
    private readonly logger: Logger,
  ) {}

  @Public()
  @Get()
  async list(
    @Query(new ZodValidationPipe(GetShowcaseProductsParamsSchema))
    query: GetShowcaseProductsParams,
  ): Promise<GetShowcaseProductsResponse> {
    try {
      this.logger.log(
        ShowcaseProductsController.name,
        `listing products with: ${JSON.stringify(query)}`,
      );

      const result = await this.getShowcaseProducts.execute(query);

      this.logger.log(
        ShowcaseProductsController.name,
        `found ${result.total} products with ${JSON.stringify(query, null, 2)}.`,
      );

      return {
        ...result,
        items: result.items.map(ShowcaseProductPresenter.toHTTP),
      };
    } catch (error: any) {
      this.logger.error(
        ShowcaseProductsController.name,
        `Error on listing products with ${JSON.stringify(query)}: ${error.message}`,
        error.stack,
      );

      throw error;
    }
  }

  @Public()
  @Get('/:id')
  async getById(
    @Param(
      'id',
      new ZodValidationPipe(
        z.string().uuid({
          message: 'ID do produto deve ser um UUID válido!',
        }),
      ),
    )
    id: string,
  ): Promise<GetShowcaseProductResponse> {
    try {
      this.logger.log(ShowcaseProductsController.name, `getting product ${id}`);

      const result = await this.getShowcaseProduct.execute({ id });

      this.logger.log(
        ShowcaseProductsController.name,
        `found product ${result.name} with id ${id}.`,
      );

      return ShowcaseProductPresenter.toHTTP(result);
    } catch (error: any) {
      this.logger.error(
        ShowcaseProductsController.name,
        `Error on getting product with id ${id}: ${error.message}`,
        error.stack,
      );

      throw error;
    }
  }
}
