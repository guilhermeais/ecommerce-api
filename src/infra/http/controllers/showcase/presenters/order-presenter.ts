import { PaymentType } from '@/domain/showcase/enterprise/entities/enums/payment-type';
import { Order } from '@/domain/showcase/enterprise/entities/order';
import {
  BoletoPaymentDetails,
  CardPaymentDetails,
  PixPaymentDetails,
} from '@/domain/showcase/enterprise/entities/value-objects/payment-method';

export type OrderHTTPResponse = {
  orderId: string;
  totalAmount: number;
  paymentMethod: PaymentType;
  paymentDetails: PixPaymentDetails | CardPaymentDetails | BoletoPaymentDetails;
  items: {
    productId: string;
    productName: string;
    productImage?: string;
    price: number;
    quantity: number;
    total: number;
  }[];
  deliveryAddress: {
    cep: string;
    address: string;
    number?: string;
    state: string;
    city: string;
  };
  customer: {
    id: string;
    name: string;
    email: string;
  };
};

export class OrderPresenter {
  static toHTTP(order: Order): OrderHTTPResponse {
    return {
      orderId: order.id.toString(),
      items: order.items.map((item) => ({
        price: item.price,
        productId: item.product.id.toString(),
        productImage: item.product.image,
        productName: item.product.name,
        total: item.total,
        quantity: item.quantity,
      })),
      paymentMethod: order.paymentMethod.method,
      paymentDetails: order.paymentMethod.details,
      totalAmount: order.total,
      deliveryAddress: order.deliveryAddress.toObject(),
      customer: {
        id: order.customer.id.toString(),
        name: order.customer.name,
        email: order.customer.email,
      },
    };
  }
}
