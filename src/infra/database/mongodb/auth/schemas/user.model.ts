import { Role } from '@/domain/auth/enterprise/entities/enums/role';
import { Provider } from '@nestjs/common';
import { Mongoose, Schema } from 'mongoose';
import { AUTH_MONGOOSE_CONNECTION_PROVIDER } from '../auth-mongoose-connection.provider';

export class MongoAddressModel {
  cep!: string;
  address!: string;
  number?: string;
  state!: string;
  city!: string;
}

export class MongoUserModel {
  static COLLECTION_NAME = 'users' as const;

  _id!: string;
  id!: string;
  email!: string;
  password!: string;
  cpf!: string;
  address?: MongoAddressModel;
  name!: string;
  phone?: string;
  role!: Role;
  isConfirmed?: boolean;
  signUpInviteId?: string;
  createdAt!: Date;
  updatedAt?: Date;
}

export const MongoUserSchema = new Schema<MongoUserModel>(
  {
    _id: Schema.Types.UUID,
    id: {
      type: String,
      required: true,
      unique: true,
    },
    email: { type: String, required: true },
    password: { type: String, required: true },
    address: {
      type: {
        cep: { type: String },
        address: { type: String },
        number: { type: String },
        state: { type: String },
        city: { type: String },
      },
      required: false,
    },
    cpf: { type: String, required: true },
    isConfirmed: { type: Boolean, required: false, default: false },
    name: { type: String, required: true },
    phone: { type: String, required: false },
    role: { type: String, required: true, enum: Object.values(Role) },
    signUpInviteId: { type: String, required: false },
  },
  {
    timestamps: true,
  },
);

export const MongoUserModelProvider: Provider = {
  provide: MongoUserModel.COLLECTION_NAME,
  inject: [AUTH_MONGOOSE_CONNECTION_PROVIDER],
  useFactory: (mongoose: Mongoose) =>
    mongoose.model(MongoUserModel.COLLECTION_NAME, MongoUserSchema),
};
