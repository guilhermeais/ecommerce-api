import { SignUpInviteStatus } from '@/domain/auth/enterprise/entities/enums/signup-invite-status';
import { Provider } from '@nestjs/common';
import { Mongoose, Schema } from 'mongoose';
import { MONGOOSE_CONNECTION_PROVIDER } from '../../mongoose-connection.provider';
import { MongoUserModel } from './user.model';

export class MongoSignUpInviteModel {
  static COLLECTION_NAME = 'sign-up-invites' as const;

  _id!: string;
  id!: string;
  guestEmail!: string;
  guestName!: string;
  sentBy!: MongoUserModel;
  sentById!: string;
  expiresIn?: number;
  status!: SignUpInviteStatus;
  createdAt!: Date;
  updatedAt?: Date;
}

export const MongoSignUpInviteSchema = new Schema<MongoSignUpInviteModel>(
  {
    _id: Schema.Types.UUID,
    id: {
      type: String,
      required: true,
      unique: true,
    },
    guestEmail: { type: String, required: true },
    guestName: { type: String, required: true },
    expiresIn: { type: Number, required: false },
    sentBy: {
      type: Schema.Types.ObjectId,
      ref: MongoUserModel.COLLECTION_NAME,
      virtual: true,
    },
    sentById: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(SignUpInviteStatus),
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

export const MongoSignUpModelProvider: Provider = {
  provide: MongoSignUpInviteModel.COLLECTION_NAME,
  inject: [MONGOOSE_CONNECTION_PROVIDER],
  useFactory: (mongoose: Mongoose) =>
    mongoose.model(
      MongoSignUpInviteModel.COLLECTION_NAME,
      MongoSignUpInviteSchema,
    ),
};
