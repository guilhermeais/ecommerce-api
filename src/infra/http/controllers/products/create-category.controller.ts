import { Role } from '@/domain/auth/enterprise/entities/enums/role';
import { User } from '@/domain/auth/enterprise/entities/user';
import { CreateCategoryUseCase } from '@/domain/product/application/use-cases/create-category';
import { CurrentUser } from '@/infra/auth/current-user.decorator';
import { Roles } from '@/infra/auth/roles.decorator';
import { Logger } from '@/shared/logger';
import { Body, Controller, Param, Post } from '@nestjs/common';
import { z } from 'zod';
import { ZodValidationPipe } from '../../pipes/zod-validation.pipe';
import {
  CategoryHTTPResponse,
  CategoryPresenter,
} from './presenters/category-presenter';

const CreateCategoryBodySchema = z.object({
  name: z.string({
    message: 'Nome da categoria é obrigatória!',
  }),
  description: z
    .string({
      message: 'Descrição da categoria deve ser uma string!',
    })
    .optional(),
});

export type CreateCategoryBody = z.infer<typeof CreateCategoryBodySchema>;

export type CreateCategoryResponse = CategoryHTTPResponse;

@Controller('/admin/categories')
export class CreateCategoryController {
  constructor(
    private readonly createCategoryUseCase: CreateCategoryUseCase,
    private readonly logger: Logger,
  ) {}

  @Roles(Role.MASTER, Role.ADMIN)
  @Post()
  async createCategory(
    @CurrentUser() currentUser: User,
    @Body(new ZodValidationPipe(CreateCategoryBodySchema))
    body: CreateCategoryBody,
  ): Promise<CreateCategoryResponse> {
    try {
      this.logger.log(
        CreateCategoryController.name,
        `User ${currentUser.id.toString()} - ${currentUser.name} Creating category with: ${JSON.stringify(body)}.`,
      );

      const result = await this.createCategoryUseCase.execute(body);

      this.logger.log(
        CreateCategoryController.name,
        `User ${currentUser.id.toString()} - ${currentUser.name} Created category with: ${JSON.stringify(body)}`,
      );

      return CategoryPresenter.toHTTP(result);
    } catch (error: any) {
      this.logger.error(
        CreateCategoryController.name,
        `Error creating category with: ${JSON.stringify(body)}: ${error.message}`,
        error.stack,
      );

      throw error;
    }
  }

  @Roles(Role.MASTER, Role.ADMIN)
  @Post(':rootCategoryId/sub-category')
  async createSubCategory(
    @CurrentUser() currentUser: User,
    @Body(new ZodValidationPipe(CreateCategoryBodySchema))
    body: CreateCategoryBody,
    @Param('rootCategoryId') rootCategoryId: string,
  ): Promise<CreateCategoryResponse> {
    try {
      this.logger.log(
        CreateCategoryController.name,
        `User ${currentUser.id.toString()} - ${currentUser.name} Creating sub-category with: ${JSON.stringify(body)}.`,
      );

      const result = await this.createCategoryUseCase.execute({
        ...body,
        rootCategoryId,
      });

      this.logger.log(
        CreateCategoryController.name,
        `User ${currentUser.id.toString()} - ${currentUser.name} Created sub-category with: ${JSON.stringify(body)}`,
      );

      return CategoryPresenter.toHTTP(result);
    } catch (error: any) {
      this.logger.error(
        CreateCategoryController.name,
        `Error creating sub-category with: ${JSON.stringify(body)}: ${error.message}`,
        error.stack,
      );

      throw error;
    }
  }
}
