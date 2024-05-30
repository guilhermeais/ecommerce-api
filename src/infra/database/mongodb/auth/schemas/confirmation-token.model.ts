import { Provider } from '@nestjs/common';
import { Mongoose, Schema } from 'mongoose';
import { MONGOOSE_CONNECTION_PROVIDER } from '../../mongoose-connection.provider';

export class MongoAddressModel {
  cep!: string;
  address!: string;
  number?: string;
  state!: string;
  city!: string;
}

export class MongoConfirmationTokenModel {
  static COLLECTION_NAME = 'confirmation-tokens' as const;

  _id!: string;
  id!: string;
  userId!: string;
  expiresIn?: number;
  email!: string;
  userName!: string;
  used?: boolean;
  createdAt!: Date;
  updatedAt?: Date;
}

export const MongoConfirmationTokenSchema =
  new Schema<MongoConfirmationTokenModel>(
    {
      _id: Schema.Types.UUID,
      id: {
        type: String,
        required: true,
        unique: true,
      },
      userId: { type: String, required: true },
      expiresIn: { type: Number, required: false },
      email: { type: String, required: true },
      userName: { type: String, required: true },
      used: { type: Boolean, required: true },
    },
    {
      timestamps: true,
    },
  );

export const MongoConfirmationTokenModelProvider: Provider = {
  provide: MongoConfirmationTokenModel.COLLECTION_NAME,
  inject: [MONGOOSE_CONNECTION_PROVIDER],
  useFactory: (mongoose: Mongoose) =>
    mongoose.model(
      MongoConfirmationTokenModel.COLLECTION_NAME,
      MongoConfirmationTokenSchema,
    ),
};
