import { DefaultExceptionFilter } from '@/infra/http/filters/default-exception-filter.filter';

import { EventManager } from '@/core/types/events';
import { Role } from '@/domain/auth/enterprise/entities/enums/role';
import { OrdersRepository } from '@/domain/showcase/application/gateways/repositories/orders-repository';
import { InvalidOrderItemError } from '@/domain/showcase/application/use-cases/errors/invalid-order-item-error';
import { PaymentType } from '@/domain/showcase/enterprise/entities/enums/payment-type';
import { CryptographyModule } from '@/infra/cryptography/cryptography.module';
import { DatabaseModule } from '@/infra/database/database.module';
import { faker } from '@faker-js/faker';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { UserFactory } from 'test/auth/enterprise/entities/make-user';
import { makeTestingApp } from 'test/make-testing-app';
import { CategoryFactory } from 'test/products/enterprise/entities/make-category';
import { ProductFactory } from 'test/products/enterprise/entities/make-product';
import { makeAddress } from 'test/shared/value-objects/make-address';
import { makePayment } from 'test/showcase/enterprise/entities/make-payment';
import { CheckoutBody } from './checkout.controller';
import { InvalidPaymentMethodError } from '@/domain/showcase/application/use-cases/errors/invalid-payment-method-error';
import { UniqueEntityID } from '@/core/entities/unique-entity-id';

describe('CheckoutController (E2E)', () => {
  let app: INestApplication;
  let eventManager: EventManager;
  let userFactory: UserFactory;
  let productFactory: ProductFactory;
  let ordersRepository: OrdersRepository;

  beforeAll(async () => {
    const moduleRef = await makeTestingApp({
      imports: [DatabaseModule, CryptographyModule],
      providers: [UserFactory, CategoryFactory, ProductFactory],
    }).compile();

    app = moduleRef.createNestApplication();

    app.useGlobalFilters(new DefaultExceptionFilter());

    eventManager = moduleRef.get(EventManager);
    userFactory = moduleRef.get(UserFactory);
    productFactory = moduleRef.get(ProductFactory);
    ordersRepository = moduleRef.get(OrdersRepository);

    await app.init();
  });

  beforeEach(async () => {
    eventManager.clearSubscriptions();
  });

  async function makeCheckoutBodyRequest(
    modifications?: Partial<CheckoutBody>,
  ): Promise<CheckoutBody> {
    const cartItems = modifications?.cartItems ?? [];

    if (cartItems.length === 0) {
      const product = await productFactory.makeProduct({
        isShown: true,
      });
      cartItems.push({
        productId: product.id.toString(),
        quantity: 1,
      });
    }

    return {
      cartItems,
      deliveryAddress: makeAddress().toObject(),
      paymentMethod: PaymentType.PIX,
      paymentDetails: makePayment().details,
      ...modifications,
    };
  }

  describe('[POST] /checkout', () => {
    it('should place an order', async () => {
      const { accessToken, user } = await userFactory.makeUser({
        role: Role.USER,
      });

      const body = await makeCheckoutBodyRequest();

      const response = await request(app.getHttpServer())
        .post('/checkout')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(body);

      expect(response.status).toBe(201);
      expect(response.body.orderId).toBeDefined();
      expect(response.body.customer).toEqual({
        id: user.id.toString(),
        name: user.name,
        email: user.email.value,
      });

      expect(response.body.deliveryAddress).toEqual(body.deliveryAddress);
      expect(response.body.paymentMethod).toEqual(body.paymentMethod);
      expect(response.body.paymentDetails).toEqual(body.paymentDetails);
      expect(response.body.items).toEqual(
        expect.arrayContaining(
          body.cartItems.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            price: expect.any(Number),
            productImage: expect.any(String),
            productName: expect.any(String),
            total: expect.any(Number),
          })),
        ),
      );
      expect(response.body.totalAmount).toEqual(expect.any(Number));

      const storedOrder = await ordersRepository.findById(
        new UniqueEntityID(response.body.orderId),
      );

      expect(storedOrder).toBeDefined();
      expect(storedOrder!.customer.id).toEqual(user.id);
      expect(storedOrder!.deliveryAddress.toObject()).toEqual(
        body.deliveryAddress,
      );
      expect(storedOrder!.paymentMethod.method).toEqual(body.paymentMethod);
      expect(storedOrder!.paymentMethod.details).toEqual(body.paymentDetails);
      expect(storedOrder!.items.length).toBe(body.cartItems.length);
      expect(storedOrder!.total).toBe(response.body.totalAmount);
    });

    describe('Exceptions', () => {
      it('should not place an order with invalid product', async () => {
        const { accessToken } = await userFactory.makeUser({
          role: Role.USER,
        });
        const productId = faker.string.uuid();

        const body = await makeCheckoutBodyRequest({
          cartItems: [
            {
              productId,
              quantity: 10,
            },
          ],
        });

        const response = await request(app.getHttpServer())
          .post('/checkout')
          .set('Authorization', `Bearer ${accessToken}`)
          .send(body);

        const expectedError = new InvalidOrderItemError(
          0,
          `Produto com id ${productId} não encontrado.`,
        );
        expect(response.status).toBe(400);
        expect(response.body.error).toEqual(expectedError.name);
        expect(response.body.message).toEqual([expectedError.message]);
      });

      it('should not place an order with invalid qty', async () => {
        const { accessToken } = await userFactory.makeUser({
          role: Role.USER,
        });
        const product = await productFactory.makeProduct({
          isShown: true,
        });
        const productId = product.id.toString();

        const body = await makeCheckoutBodyRequest({
          cartItems: [
            {
              productId,
              quantity: -1,
            },
            {
              productId,
              quantity: 0,
            },
          ],
        });

        const response = await request(app.getHttpServer())
          .post('/checkout')
          .set('Authorization', `Bearer ${accessToken}`)
          .send(body);

        expect(response.status).toBe(400);
        expect(response.body.error).toEqual('BadRequestException');
        expect(response.body.message).toEqual([
          'Quantidade inválida. (Deve ser um número inteiro positivo)',
          'Quantidade inválida. (Deve ser um número inteiro positivo)',
        ]);
      });

      it('should not place an order with invalid payment type', async () => {
        const { accessToken } = await userFactory.makeUser({
          role: Role.USER,
        });

        const body = await makeCheckoutBodyRequest({
          paymentMethod: 'PAYPAL' as any,
        });

        const response = await request(app.getHttpServer())
          .post('/checkout')
          .set('Authorization', `Bearer ${accessToken}`)
          .send(body);

        expect(response.status).toBe(400);
        expect(response.body.error).toEqual('BadRequestException');
        expect(response.body.message).toEqual([
          'Método de pagamento inválido, deve ser pix, card ou boleto',
        ]);
      });

      it('should not place an order with invalid payment details', async () => {
        const { accessToken } = await userFactory.makeUser({
          role: Role.USER,
        });

        const body = await makeCheckoutBodyRequest({
          paymentMethod: PaymentType.CARD,
          paymentDetails: {
            boletoNumber: '123456789',
          },
        });

        const response = await request(app.getHttpServer())
          .post('/checkout')
          .set('Authorization', `Bearer ${accessToken}`)
          .send(body);

        expect(response.status).toBe(400);
        expect(response.body.error).toEqual(InvalidPaymentMethodError.name);
        expect(response.body.message).toEqual([
          'O método de pagamento card é inválido. Número do cartão inválido (cardNumber, expirityDate e cvv são obrigatórios).',
        ]);
      });
    });
  });
});
