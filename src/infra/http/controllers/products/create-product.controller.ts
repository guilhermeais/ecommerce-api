import { Role } from '@/domain/auth/enterprise/entities/enums/role';
import { User } from '@/domain/auth/enterprise/entities/user';
import { File } from '@/domain/product/application/gateways/storage/file';
import { CreateProductUseCase } from '@/domain/product/application/use-cases/create-product';
import { CreatedByProps } from '@/domain/product/enterprise/entities/created-by';
import { CurrentUser } from '@/infra/auth/current-user.decorator';
import { Roles } from '@/infra/auth/roles.decorator';
import { Logger } from '@/shared/logger';
import {
  Body,
  Controller,
  FileTypeValidator,
  MaxFileSizeValidator,
  ParseFilePipe,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import 'multer';
import { z } from 'zod';
import { ZodValidationPipe } from '../../pipes/zod-validation.pipe';
import {
  ProductHTTPResponse,
  ProductPresenter,
} from './presenters/product-presenter';

const CreateProductBodySchema = z.object({
  name: z.string({
    message: 'Nome do produto é obrigatório!',
  }),
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
    }),
  isShown: z
    .preprocess((arg) => (arg as string).toLowerCase() === 'true', z.boolean())
    .optional(),
  subCategoryId: z
    .string({
      message: 'ID da subcategoria deve ser uma string!',
    })
    .optional(),
});

export type CreateProductBody = z.infer<typeof CreateProductBodySchema>;

export type CreateProductResponse = ProductHTTPResponse;

@Controller('/admin/products')
export class CreateProductController {
  constructor(
    private readonly createProcutUseCase: CreateProductUseCase,
    private readonly logger: Logger,
  ) {}

  @Roles(Role.MASTER, Role.ADMIN)
  @Post()
  @UseInterceptors(FileInterceptor('image'))
  async handle(
    @CurrentUser() currentUser: User,
    @Body(new ZodValidationPipe(CreateProductBodySchema))
    body: CreateProductBody,
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
  ): Promise<CreateProductResponse> {
    try {
      const imageFile: File | undefined = image?.buffer && {
        body: image.buffer,
        name: image.originalname,
        type: image.mimetype,
      };

      const createdBy: CreatedByProps = {
        email: currentUser.email.value,
        name: currentUser.name,
        id: currentUser.id,
      };

      this.logger.log(
        CreateProductController.name,
        `User ${currentUser.id.toString()} - ${currentUser.name} Creating product with: ${JSON.stringify(body)} and image ${image?.filename}.`,
      );

      const result = await this.createProcutUseCase.execute({
        createdBy,
        image: imageFile,
        ...body,
      });

      this.logger.log(
        CreateProductController.name,
        `User ${currentUser.id.toString()} - ${currentUser.name} Created product with: ${JSON.stringify(body)}`,
      );

      return ProductPresenter.toHTTP(result);
    } catch (error: any) {
      this.logger.error(
        CreateProductController.name,
        `Error creating product: ${JSON.stringify(body)}: ${error.message}`,
        error.stack,
      );

      throw error;
    }
  }
}
