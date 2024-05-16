import { BaseError } from '@/core/errors/base-error';
import { HttpStatus } from '@nestjs/common';

export class InvalidEmailTemplateError extends BaseError {
  constructor(templateName: string) {
    super({
      message: `O template ${templateName} não foi implementado!`,
      isClientError: false,
      code: HttpStatus.NOT_IMPLEMENTED,
    });
  }
}
