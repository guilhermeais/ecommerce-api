import { GetShowcaseCategoriesUseCase } from '@/domain/showcase/application/use-cases/get-showcase-categories';
import { Public } from '@/infra/auth/public.decorator';
import { Logger } from '@/shared/logger';
import { Controller, Get, Query } from '@nestjs/common';
import { z } from 'zod';
import { ZodValidationPipe } from '../../pipes/zod-validation.pipe';
import {
  ShowcaseCategoryHTTPResponse,
  ShowcaseCategoryPresenter,
} from './presenters/showcase-category-presenter';

const GetShowcaseCategoriesParamsSchema = z.object({
  limit: z
    .number({
      coerce: true,
    })
    .default(-1),
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
});

export type GetShowcaseCategoriesParams = z.infer<
  typeof GetShowcaseCategoriesParamsSchema
>;

export type GetShowcaseCategoriesResponse = {
  items: ShowcaseCategoryHTTPResponse[];
};

export type GetShowcaseCategoryResponse = ShowcaseCategoryHTTPResponse;

@Controller('/showcase/categories')
export class ShowcaseCategoriesController {
  constructor(
    private readonly getShowcaseCategories: GetShowcaseCategoriesUseCase,
    private readonly logger: Logger,
  ) {}

  @Public()
  @Get()
  async list(
    @Query(new ZodValidationPipe(GetShowcaseCategoriesParamsSchema))
    query: GetShowcaseCategoriesParams,
  ): Promise<GetShowcaseCategoriesResponse> {
    try {
      this.logger.log(
        ShowcaseCategoriesController.name,
        `listing categories with: ${JSON.stringify(query)}`,
      );

      const result = await this.getShowcaseCategories.execute({
        ...query,
      });

      this.logger.log(
        ShowcaseCategoriesController.name,
        `found ${result.total} categories with ${JSON.stringify(query, null, 2)}.`,
      );

      return {
        ...result,
        items: result.items.map(ShowcaseCategoryPresenter.toHTTP),
      };
    } catch (error: any) {
      this.logger.error(
        ShowcaseCategoriesController.name,
        `Error on listing categories with ${JSON.stringify(query)}: ${error.message}`,
        error.stack,
      );

      throw error;
    }
  }
}
