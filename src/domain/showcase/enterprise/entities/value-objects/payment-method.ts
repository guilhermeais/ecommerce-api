import { ValueObject } from '@/core/entities/value-object';
import { BadRequestError } from '@/core/errors/commom/bad-request.error';
import { InvalidPaymentMethodError } from '@/domain/showcase/application/use-cases/errors/invalid-payment-method-error';
import { PaymentType } from '../enums/payment-type';

export type PixPaymentDetails = {
  customerKey: string;
};

export type CardPaymentDetails = {
  cardNumber: string;
  expiryDate: string;
  cvv: string;
};

export type BoletoPaymentDetails = {
  boletoNumber: string;
  expirationDate?: Date;
};

type PaymentDetailsMap = {
  [PaymentType.PIX]: PixPaymentDetails;
  [PaymentType.CARD]: CardPaymentDetails;
  [PaymentType.BOLETO]: BoletoPaymentDetails;
};

type PaymentMethodProps<T extends PaymentType> = {
  method: T;
  details: PaymentDetailsMap[T];
};

export class PaymentMethod<T extends PaymentType = any> extends ValueObject<
  PaymentMethodProps<T>
> {
  constructor(props: PaymentMethodProps<T>) {
    super(props);
    if (!props) {
      throw new BadRequestError(
        `Pagamento inválido`,
        'Deve ser informado um método de pagamento.',
      );
    }

    if (PaymentMethod.isPix(this) && !this.details.customerKey) {
      throw new InvalidPaymentMethodError(
        this.method,
        'Chave inválida (customerKey é obrigatório).',
      );
    }

    if (
      PaymentMethod.isCard(this) &&
      !this.details.cardNumber &&
      !this.details.expiryDate &&
      !this.details.cvv
    ) {
      throw new InvalidPaymentMethodError(
        this.method,
        'Número do cartão inválido (cardNumber, expirityDate e cvv são obrigatórios).',
      );
    }

    if (PaymentMethod.isBoleto(this) && !this.details.boletoNumber) {
      throw new InvalidPaymentMethodError(
        this.method,
        'Código de barras inválido (boletoNumber é obrigatório).',
      );
    }
  }

  static isPix(
    payment: PaymentMethodProps<PaymentType>,
  ): payment is PaymentMethodProps<PaymentType.PIX> {
    return payment.method === PaymentType.PIX;
  }

  static isCard(
    payment: PaymentMethodProps<PaymentType>,
  ): payment is PaymentMethodProps<PaymentType.CARD> {
    return payment.method === PaymentType.CARD;
  }

  static isBoleto(
    payment: PaymentMethodProps<PaymentType>,
  ): payment is PaymentMethodProps<PaymentType.BOLETO> {
    return payment.method === PaymentType.BOLETO;
  }

  get method() {
    return this.props.method;
  }

  get details() {
    return this.props.details;
  }
}
