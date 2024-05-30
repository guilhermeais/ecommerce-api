import { Provider } from '@nestjs/common';
import { Mongoose, Schema } from 'mongoose';
import { MONGOOSE_CONNECTION_PROVIDER } from '../../mongoose-connection.provider';

export class MongoCategoryModel {
  static COLLECTION_NAME = 'categories' as const;

  _id!: string;
  id!: string;
  name!: string;
  description?: string;
  rootCategory?: MongoCategoryModel;
  rootCategoryId?: string;
  createdAt!: Date;
  updatedAt?: Date;
}

export const MongoCategorySchema = new Schema<MongoCategoryModel>(
  {
    _id: Schema.Types.UUID,
    id: {
      type: String,
      required: true,
      unique: true,
    },
    name: { type: String, required: true },
    description: { type: String, required: false },
    rootCategory: {
      type: Schema.Types.ObjectId,
      ref: MongoCategoryModel.COLLECTION_NAME,
      required: false,
      virtual: true,
    },
    rootCategoryId: { type: String, required: false },
  },
  {
    timestamps: true,
  },
);

export const MongoCategoryModelProvider: Provider = {
  provide: MongoCategoryModel.COLLECTION_NAME,
  inject: [MONGOOSE_CONNECTION_PROVIDER],
  useFactory: (mongoose: Mongoose) =>
    mongoose.model(MongoCategoryModel.COLLECTION_NAME, MongoCategorySchema),
};
