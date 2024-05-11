import { PipeTransform, BadRequestException } from '@nestjs/common';
import { ZodError, ZodSchema } from 'zod';
import { fromZodError } from 'zod-validation-error';

export class ZodValidationPipe implements PipeTransform {
  constructor(private schema: ZodSchema) {}

  transform(value: unknown) {
    try {
      return this.schema.parse(value);
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = fromZodError(error);
        const messages = errors.details.map((detail) => detail.message);
        throw new BadRequestException({
          message: messages,
          statusCode: 400,
        });
      }

      throw new BadRequestException('Validation failed');
    }
  }
}
