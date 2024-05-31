import { Role } from '@/domain/auth/enterprise/entities/enums/role';
import { User } from '@/domain/auth/enterprise/entities/user';
import { DeleteCategoryUseCase } from '@/domain/product/application/use-cases/delete-category';
import { CurrentUser } from '@/infra/auth/current-user.decorator';
import { Roles } from '@/infra/auth/roles.decorator';
import { Logger } from '@/shared/logger';
import { Controller, Delete, HttpCode, Param } from '@nestjs/common';

export type DeleteCategoryBody = undefined;

export type DeleteCategoryResponse = void;

@Controller('/admin/categories')
export class DeleteCategoryController {
  constructor(
    private readonly deleteCategoryUseCase: DeleteCategoryUseCase,
    private readonly logger: Logger,
  ) {}

  @Roles(Role.MASTER, Role.ADMIN)
  @Delete('/:categoryId')
  @HttpCode(204)
  async handle(
    @CurrentUser() currentUser: User,
    @Param('categoryId') categoryId: string,
  ): Promise<DeleteCategoryResponse> {
    try {
      this.logger.log(
        DeleteCategoryController.name,
        `User ${currentUser.id.toString()} - ${currentUser.name} Deleting category ${categoryId}.`,
      );

      await this.deleteCategoryUseCase.execute({
        id: categoryId,
      });

      this.logger.log(
        DeleteCategoryController.name,
        `User ${currentUser.id.toString()} - ${currentUser.name} Deleted category ${categoryId}`,
      );
    } catch (error: any) {
      this.logger.error(
        DeleteCategoryController.name,
        `Error deleting category ${categoryId}: ${error.message}`,
        error.stack,
      );

      throw error;
    }
  }
}
