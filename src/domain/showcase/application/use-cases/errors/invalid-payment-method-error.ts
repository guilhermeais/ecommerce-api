import { BaseError } from '@/core/errors/base-error';
import { PaymentType } from '@/domain/showcase/enterprise/entities/enums/payment-type';
import { HttpStatus } from '@nestjs/common';

export class InvalidPaymentMethodError extends BaseError {
  constructor(paymentMethod: PaymentType, message: string) {
    super({
      message: `O método de pagamento ${paymentMethod} é inválido. ${message}`,
      code: HttpStatus.BAD_REQUEST,
      isClientError: true,
    });
  }
}
