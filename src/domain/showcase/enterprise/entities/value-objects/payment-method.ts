import { ValueObject } from '@/core/entities/value-object';
import { BadRequestError } from '@/core/errors/commom/bad-request.error';
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
  barcode: string;
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
