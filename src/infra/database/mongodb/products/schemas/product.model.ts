import { Provider } from '@nestjs/common';
import { Mongoose, Schema } from 'mongoose';
import { MONGOOSE_CONNECTION_PROVIDER } from '../../mongoose-connection.provider';
import { MongoAdministratorModel } from './administrator.model';
import { MongoCategoryModel } from './category.model';

export class MongoProductModel {
  static COLLECTION_NAME = 'products' as const;

  _id!: string;
  id!: string;
  name!: string;
  createdBy?: MongoAdministratorModel;
  createdById!: string;
  price!: number;
  description?: string;
  isShown?: boolean;
  subCategoryId?: string | null;
  subCategory?: MongoCategoryModel;
  image?: string;
  updatedById?: string;
  updatedBy?: MongoAdministratorModel;
  createdAt!: Date;
  updatedAt?: Date;
}

export const MongoProductSchema = new Schema<MongoProductModel>(
  {
    _id: Schema.Types.UUID,
    id: {
      type: String,
      required: true,
      unique: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: MongoAdministratorModel.COLLECTION_NAME,
    },
    createdById: {
      type: String,
      required: true,
    },
    name: { type: String, required: true },
    description: { type: String, required: false },
    image: { type: String, required: false },
    isShown: { type: Boolean, required: false, default: true },
    price: { type: Number, required: true },
    subCategory: {
      type: Schema.Types.ObjectId,
      ref: MongoCategoryModel.COLLECTION_NAME,
      required: false,
    },
    subCategoryId: { type: String, required: false },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: MongoAdministratorModel.COLLECTION_NAME,
      required: false,
    },
    updatedById: {
      type: String,
      required: false,
    },
  },
  {
    timestamps: true,
  },
);

export const MongoProductModelProvider: Provider = {
  provide: MongoProductModel.COLLECTION_NAME,
  inject: [MONGOOSE_CONNECTION_PROVIDER],
  useFactory: (mongoose: Mongoose) =>
    mongoose.model(MongoProductModel.COLLECTION_NAME, MongoProductSchema),
};
