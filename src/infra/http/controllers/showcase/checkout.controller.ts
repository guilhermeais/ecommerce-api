import { Role } from '@/domain/auth/enterprise/entities/enums/role';
import { User } from '@/domain/auth/enterprise/entities/user';
import { CheckoutUseCase } from '@/domain/showcase/application/use-cases/checkout';
import { PaymentType } from '@/domain/showcase/enterprise/entities/enums/payment-type';
import { CurrentUser } from '@/infra/auth/current-user.decorator';
import { Roles } from '@/infra/auth/roles.decorator';
import { Logger } from '@/shared/logger';
import { Body, Controller, Post, UseInterceptors } from '@nestjs/common';
import { z } from 'zod';
import { TelemetryInterceptor } from '../../interceptors/telemetry.interceptor';
import { ZodValidationPipe } from '../../pipes/zod-validation.pipe';
import {
  OrderHTTPResponse,
  OrderPresenter,
} from './presenters/order-presenter';

const CheckoutBodySchema = z.object({
  cartItems: z.array(
    z.object({
      productId: z.string().uuid({
        message: 'Id do produto inválido. (Deve ser um UUID)',
      }),
      quantity: z
        .number({
          coerce: true,
        })
        .int()
        .positive({
          message: 'Quantidade inválida. (Deve ser um número inteiro positivo)',
        }),
    }),
  ),
  paymentMethod: z.enum(Object.values(PaymentType) as any, {
    message: `Método de pagamento inválido, deve ser ${new Intl.ListFormat('pt-BR', { style: 'long', type: 'disjunction' }).format(Object.values(PaymentType))}`,
  }),
  paymentDetails: z.object({
    customerKey: z.string().optional(),
    cardNumber: z.string().optional(),
    expiryDate: z.string().optional(),
    cvv: z.string().optional(),
    boletoNumber: z.string().optional(),
    expirationDate: z.string().optional(),
  }),
  deliveryAddress: z.object({
    cep: z.string({
      message: 'CEP é obrigatório!',
    }),
    address: z.string({
      message: 'Endereço é obrigatório!',
    }),
    number: z.string().optional(),
    state: z.string({
      message: 'Estado é obrigatório!',
    }),
    city: z.string({
      message: 'Cidade é obrigatória!',
    }),
  }),
});

export type CheckoutBody = z.infer<typeof CheckoutBodySchema>;

export type CheckoutResponse = OrderHTTPResponse;

@UseInterceptors(TelemetryInterceptor)
@Controller('/checkout')
export class CheckoutController {
  constructor(
    private readonly checkoutUseCase: CheckoutUseCase,
    private readonly logger: Logger,
  ) {}

  @Roles(Role.USER)
  @Post()
  async handle(
    @CurrentUser() currentUser: User,
    @Body(new ZodValidationPipe(CheckoutBodySchema))
    body: CheckoutBody,
  ): Promise<CheckoutResponse> {
    try {
      this.logger.log(
        CheckoutController.name,
        `User ${currentUser.id.toString()} - ${currentUser.name} Checkout with: ${JSON.stringify(body)}.`,
      );

      const order = await this.checkoutUseCase.execute({
        items: body.cartItems,
        deliveryAddress: body.deliveryAddress,
        customer: {
          email: currentUser.email.value,
          id: currentUser.id.toString(),
          name: currentUser.name,
        },
        paymentMethod: body.paymentMethod,
        paymentDetails: body.paymentDetails as any,
      });

      this.logger.log(
        CheckoutController.name,
        `Order created: ${order.id.toString()} for the user ${currentUser.id.toString()} - ${currentUser.name}.`,
      );

      const result = OrderPresenter.toHTTP(order);

      return result;
    } catch (error: any) {
      this.logger.error(
        CheckoutController.name,
        `Error on checkout of the user ${currentUser.id.toString()} - ${currentUser.name} with ${JSON.stringify(body)}: ${error.message}`,
        error.stack,
      );

      throw error;
    }
  }
}
