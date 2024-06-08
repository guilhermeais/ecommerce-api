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

export type AllPaymentMethods =
  | PaymentType.PIX
  | PaymentType.CARD
  | PaymentType.BOLETO;

export type PaymentDetailsMap = {
  [PaymentType.PIX]: PixPaymentDetails;
  [PaymentType.CARD]: CardPaymentDetails;
  [PaymentType.BOLETO]: BoletoPaymentDetails;
};

export type PaymentMethodProps<T extends PaymentType = AllPaymentMethods> = {
  method: T;
  details: PaymentDetailsMap[T];
};

export class PaymentMethod<T extends PaymentType = any> extends ValueObject<
  PaymentMethodProps<T>
> {
  static restore(props: PaymentMethodProps<PaymentType>) {
    return PaymentMethod.create(props);
  }
  static create<T extends PaymentType = any>(
    props: PaymentMethodProps<T>,
  ): PaymentMethod<T> {
    const instance = new PaymentMethod<T>(props);
    if (!props) {
      throw new BadRequestError(
        `Pagamento inválido`,
        'Deve ser informado um método de pagamento.',
      );
    }

    if (PaymentMethod.isPix(instance) && !instance.details.customerKey) {
      throw new InvalidPaymentMethodError(
        instance.method,
        'Chave inválida (customerKey é obrigatório).',
      );
    }

    if (
      PaymentMethod.isCard(instance) &&
      !instance.details.cardNumber &&
      !instance.details.expiryDate &&
      !instance.details.cvv
    ) {
      throw new InvalidPaymentMethodError(
        instance.method,
        'Número do cartão inválido (cardNumber, expirityDate e cvv são obrigatórios).',
      );
    }

    if (PaymentMethod.isBoleto(instance) && !instance.details.boletoNumber) {
      throw new InvalidPaymentMethodError(
        instance.method,
        'Código de barras inválido (boletoNumber é obrigatório).',
      );
    }

    return instance;
  }

  private constructor(props: PaymentMethodProps<T>) {
    super(props);
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
