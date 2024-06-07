import { BaseError } from '@/core/errors/base-error';
import { HttpStatus } from '@nestjs/common';

export class ItemAlreadyPlacedError extends BaseError {
  constructor(productName: string, itemIndex: number) {
    super({
      message: `O produto ${productName} já foi adicionado no item ${itemIndex + 1}.`,
      code: HttpStatus.BAD_REQUEST,
      isClientError: true,
    });
  }
}
