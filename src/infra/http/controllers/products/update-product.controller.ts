import { Role } from '@/domain/auth/enterprise/entities/enums/role';
import { User } from '@/domain/auth/enterprise/entities/user';
import { File } from '@/domain/product/application/gateways/storage/file';
import { UpdateProductUseCase } from '@/domain/product/application/use-cases/update-product';
import { CreatedByProps } from '@/domain/product/enterprise/entities/created-by';
import { CurrentUser } from '@/infra/auth/current-user.decorator';
import { Roles } from '@/infra/auth/roles.decorator';
import { Logger } from '@/shared/logger';
import {
  Body,
  Controller,
  FileTypeValidator,
  HttpCode,
  MaxFileSizeValidator,
  Param,
  ParseFilePipe,
  Patch,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { z } from 'zod';
import { ZodValidationPipe } from '../../pipes/zod-validation.pipe';

const UpdateProductBodySchema = z.object({
  name: z
    .string({
      message: 'Nome do produto é obrigatório!',
    })
    .optional(),
  description: z
    .string({
      message: 'Descrição do produto deve ser uma string!',
    })
    .optional(),
  price: z
    .number({
      message: 'Preço do produto é obrigatório!',
      coerce: true,
    })
    .positive({
      message: 'Preço do produto deve ser positivo!',
    })
    .refine((value) => Number(value.toFixed(2)) === value, {
      message:
        'Preço do produto deve ser um número decimal com duas casas decimais!',
    })
    .optional(),
  isShown: z
    .preprocess((arg) => (arg as string).toLowerCase() === 'true', z.boolean())
    .optional(),
  subCategoryId: z
    .string({ message: 'ID da subcategoria deve ser uma string!' })
    .optional(),
});

export type UpdateProductBody = z.infer<typeof UpdateProductBodySchema>;

export type UpdateProductResponse = void;

@Controller('/admin/products')
export class UpdateProductController {
  constructor(
    private readonly updateProcutUseCase: UpdateProductUseCase,
    private readonly logger: Logger,
  ) {}

  @Roles(Role.MASTER, Role.ADMIN)
  @Patch('/:id')
  @UseInterceptors(FileInterceptor('image'))
  @HttpCode(201)
  async handle(
    @CurrentUser() currentUser: User,
    @Body(new ZodValidationPipe(UpdateProductBodySchema))
    body: UpdateProductBody,
    @Param('id') id: string,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({
            maxSize: 3 * 1024 * 1024,
            message: 'Imagem deve ter no máximo 3MB!',
          }),
          new FileTypeValidator({
            fileType: '.(png|jpg|jpeg)',
          }),
        ],
        fileIsRequired: false,
      }),
    )
    image?: Express.Multer.File,
  ): Promise<UpdateProductResponse> {
    try {
      const imageFile: File | undefined = image?.buffer && {
        body: image.buffer,
        name: image.originalname,
        type: image.mimetype,
      };

      const updatedBy: CreatedByProps = {
        email: currentUser.email.value,
        name: currentUser.name,
        id: currentUser.id,
      };

      this.logger.log(
        UpdateProductController.name,
        `User ${currentUser.id.toString()} - ${currentUser.name} Updating product ${id} with: ${JSON.stringify(body)} and image ${image?.filename}.`,
      );

      await this.updateProcutUseCase.execute({
        id,
        updatedBy,
        ...(imageFile && { image: imageFile }),
        ...body,
      });

      this.logger.log(
        UpdateProductController.name,
        `User ${currentUser.id.toString()} - ${currentUser.name} updated product ${id} with: ${JSON.stringify(body)}`,
      );
    } catch (error: any) {
      this.logger.error(
        UpdateProductController.name,
        `Error on updating product: ${JSON.stringify(body)}: ${error.message}`,
        error.stack,
      );

      throw error;
    }
  }
}
