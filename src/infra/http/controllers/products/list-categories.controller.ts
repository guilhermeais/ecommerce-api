import { PaginatedResponse } from '@/core/types/pagination';
import { Role } from '@/domain/auth/enterprise/entities/enums/role';
import { User } from '@/domain/auth/enterprise/entities/user';
import { ListCategoriesUseCase } from '@/domain/product/application/use-cases/list-categories';
import { CurrentUser } from '@/infra/auth/current-user.decorator';
import { Roles } from '@/infra/auth/roles.decorator';
import { Logger } from '@/shared/logger';
import { Controller, Get, Param, Query } from '@nestjs/common';
import { z } from 'zod';
import { ZodValidationPipe } from '../../pipes/zod-validation.pipe';
import {
  CategoryHTTPResponse,
  CategoryPresenter,
} from './presenters/category-presenter';

const ListCategoriesParamsSchema = z.object({
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
      message: 'Nome da categoria deve ser uma string!',
    })
    .optional(),
});

export type ListCategoriesParams = z.infer<typeof ListCategoriesParamsSchema>;

export type ListCategoriesResponse = PaginatedResponse<CategoryHTTPResponse>;

@Controller('/admin/categories')
export class ListCategoriesController {
  constructor(
    private readonly listCategoriesUseCase: ListCategoriesUseCase,
    private readonly logger: Logger,
  ) {}

  @Roles(Role.MASTER, Role.ADMIN)
  @Get()
  async listCategories(
    @CurrentUser() currentUser: User,
    @Query(new ZodValidationPipe(ListCategoriesParamsSchema))
    query: ListCategoriesParams,
  ): Promise<ListCategoriesResponse> {
    try {
      this.logger.log(
        ListCategoriesController.name,
        `User ${currentUser.id.toString()} - ${currentUser.name} listing categories with: ${JSON.stringify(query)}`,
      );

      const result = await this.listCategoriesUseCase.execute({
        ...query,
        rootCategoryId: null,
      });

      this.logger.log(
        ListCategoriesController.name,
        `User ${currentUser.id.toString()} - ${currentUser.name} found ${result.total} categories.`,
      );

      return {
        ...result,
        items: result.items.map(CategoryPresenter.toHTTP),
      };
    } catch (error: any) {
      this.logger.error(
        ListCategoriesController.name,
        `Error on listing categories with ${JSON.stringify(query)}: ${error.message}`,
        error.stack,
      );

      throw error;
    }
  }

  @Roles(Role.MASTER, Role.ADMIN)
  @Get('/:rootCategoryId/sub-category')
  async listSubCategories(
    @CurrentUser() currentUser: User,
    @Query(new ZodValidationPipe(ListCategoriesParamsSchema))
    query: ListCategoriesParams,
    @Param('rootCategoryId') rootCategoryId: string,
  ): Promise<ListCategoriesResponse> {
    try {
      this.logger.log(
        ListCategoriesController.name,
        `User ${currentUser.id.toString()} - ${currentUser.name} listing sub-categories of category ${rootCategoryId} with: ${JSON.stringify(query)}`,
      );

      const result = await this.listCategoriesUseCase.execute({
        ...query,
        rootCategoryId,
      });

      this.logger.log(
        ListCategoriesController.name,
        `User ${currentUser.id.toString()} - ${currentUser.name} found ${result.total} sub-categories for the category ${rootCategoryId}.`,
      );

      return {
        ...result,
        items: result.items.map(CategoryPresenter.toHTTP),
      };
    } catch (error: any) {
      this.logger.error(
        ListCategoriesController.name,
        `Error on listing sub-categories of ${rootCategoryId} with ${JSON.stringify(query)}: ${error.message}`,
        error.stack,
      );

      throw error;
    }
  }
}
