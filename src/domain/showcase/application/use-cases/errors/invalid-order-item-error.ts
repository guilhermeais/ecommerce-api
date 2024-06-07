import { BaseError } from '@/core/errors/base-error';
import { HttpStatus } from '@nestjs/common';

export class InvalidOrderItemError extends BaseError {
  constructor(itemIndex: string | number, message: string) {
    super({
      message: `O item ${Number(itemIndex) + 1} do pedido é inválido. ${message}`,
      code: HttpStatus.BAD_REQUEST,
      isClientError: true,
    });
  }
}
