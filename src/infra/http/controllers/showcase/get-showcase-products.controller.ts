import { PaginatedResponse } from '@/core/types/pagination';
import { GetShowcaseProductsUseCase } from '@/domain/showcase/application/use-cases/get-showcase-products';
import { Public } from '@/infra/auth/public.decorator';
import { Logger } from '@/shared/logger';
import { Controller, Get, Query } from '@nestjs/common';
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

@Controller('/showcase/products')
export class GetShowcaseProductsController {
  constructor(
    private readonly getShowcaseProducts: GetShowcaseProductsUseCase,
    private readonly logger: Logger,
  ) {}

  @Public()
  @Get()
  async handle(
    @Query(new ZodValidationPipe(GetShowcaseProductsParamsSchema))
    query: GetShowcaseProductsParams,
  ): Promise<GetShowcaseProductsResponse> {
    try {
      this.logger.log(
        GetShowcaseProductsController.name,
        `listing products with: ${JSON.stringify(query)}`,
      );

      const result = await this.getShowcaseProducts.execute(query);

      this.logger.log(
        GetShowcaseProductsController.name,
        `found ${result.total} products with ${JSON.stringify(query, null, 2)}.`,
      );

      return {
        ...result,
        items: result.items.map(ShowcaseProductPresenter.toHTTP),
      };
    } catch (error: any) {
      this.logger.error(
        GetShowcaseProductsController.name,
        `Error on listing products with ${JSON.stringify(query)}: ${error.message}`,
        error.stack,
      );

      throw error;
    }
  }
}
