import { PaymentType } from '@/domain/showcase/enterprise/entities/enums/payment-type';
import {
  PaymentMethod,
  PaymentMethodProps,
} from '@/domain/showcase/enterprise/entities/value-objects/payment-method';
import { cpf } from 'cpf-cnpj-validator';

export function makePayment(modifications?: PaymentMethodProps): PaymentMethod {
  return PaymentMethod.create({
    method: PaymentType.PIX,
    details: {
      customerKey: cpf.generate(),
    },
    ...modifications,
  });
}
