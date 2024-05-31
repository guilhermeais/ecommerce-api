import { Role } from '@/domain/auth/enterprise/entities/enums/role';
import { User } from '@/domain/auth/enterprise/entities/user';
import { UpdateCategoryUseCase } from '@/domain/product/application/use-cases/update-category';
import { CurrentUser } from '@/infra/auth/current-user.decorator';
import { Roles } from '@/infra/auth/roles.decorator';
import { Logger } from '@/shared/logger';
import { Body, Controller, HttpCode, Param, Patch } from '@nestjs/common';
import { z } from 'zod';
import { ZodValidationPipe } from '../../pipes/zod-validation.pipe';

const UpdateCategoryBodySchema = z.object({
  name: z
    .string({
      message: 'Nome da categoria é obrigatório!',
    })
    .optional(),
  description: z
    .string({
      message: 'Descrição da categoria deve ser uma string!',
    })
    .optional(),
});

export type UpdateCategoryBody = z.infer<typeof UpdateCategoryBodySchema>;

export type UpdateCategoryResponse = void;

@Controller('/admin/categories')
export class UpdateCategoryController {
  constructor(
    private readonly updateCategoryUseCase: UpdateCategoryUseCase,
    private readonly logger: Logger,
  ) {}

  @Roles(Role.MASTER, Role.ADMIN)
  @Patch('/:categoryId')
  @HttpCode(204)
  async handle(
    @CurrentUser() currentUser: User,
    @Body(new ZodValidationPipe(UpdateCategoryBodySchema))
    body: UpdateCategoryBody,
    @Param('categoryId') categoryId: string,
  ): Promise<UpdateCategoryResponse> {
    try {
      this.logger.log(
        UpdateCategoryController.name,
        `User ${currentUser.id.toString()} - ${currentUser.name} Updating category ${categoryId} with: ${JSON.stringify(body)}.`,
      );

      await this.updateCategoryUseCase.execute({
        id: categoryId,
        ...body,
      });

      this.logger.log(
        UpdateCategoryController.name,
        `User ${currentUser.id.toString()} - ${currentUser.name} Updated category ${categoryId} with: ${JSON.stringify(body)}`,
      );
    } catch (error: any) {
      this.logger.error(
        UpdateCategoryController.name,
        `Error updating category ${categoryId} with: ${JSON.stringify(body)}: ${error.message}`,
        error.stack,
      );

      throw error;
    }
  }
}
