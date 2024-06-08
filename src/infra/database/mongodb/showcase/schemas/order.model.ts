import { PaymentMethodProps } from '@/domain/showcase/enterprise/entities/value-objects/payment-method';
import { Provider } from '@nestjs/common';
import { Mongoose, Schema } from 'mongoose';
import { MongoAddressModel } from '../../auth/schemas/confirmation-token.model';
import { MONGOOSE_CONNECTION_PROVIDER } from '../../mongoose-connection.provider';
import { MongoDbCostumerModel } from './customer.model';

export class MongoOrderItemModel {
  productId!: string;
  quantity!: number;
  price!: number;
}

export class MongoOrderModel {
  static COLLECTION_NAME = 'orders' as const;

  _id!: string;
  id!: string;
  customerId!: string;
  customer?: MongoDbCostumerModel;
  paymentMethod!: PaymentMethodProps;
  deliveryAddress!: MongoAddressModel;
  items!: MongoOrderItemModel[];
  createdAt!: Date;
  updatedAt?: Date;
}

export const MongoOrderSchema = new Schema<MongoOrderModel>(
  {
    _id: Schema.Types.UUID,
    id: {
      type: String,
      required: true,
      unique: true,
    },
    customerId: { type: String, required: true },
    customer: {
      ref: MongoDbCostumerModel.COLLECTION_NAME,
      type: {
        name: { type: String },
        email: { type: String },
      },
      refPath: 'customerId',
    },
    paymentMethod: {
      type: {
        method: { type: String, required: true },
        details: { type: Schema.Types.Mixed, required: true },
      },
      required: true,
    },
    deliveryAddress: {
      type: {
        cep: { type: String, required: true },
        address: { type: String, required: true },
        number: { type: String },
        state: { type: String, required: true },
        city: { type: String, required: true },
      },
      required: true,
    },
    items: {
      type: [
        {
          productId: { type: String, required: true },
          quantity: { type: Number, required: true },
          price: { type: Number, required: true },
        },
      ],
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

export const MongoOrderModelProvider: Provider = {
  provide: MongoOrderModel.COLLECTION_NAME,
  inject: [MONGOOSE_CONNECTION_PROVIDER],
  useFactory: (mongoose: Mongoose) =>
    mongoose.model(MongoOrderModel.COLLECTION_NAME, MongoOrderSchema),
};
