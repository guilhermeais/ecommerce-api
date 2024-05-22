import { User } from '@/domain/auth/enterprise/entities/user';
import { MongoUserModel } from '../schemas/user.model';
import { CPF } from '@/domain/auth/enterprise/entities/value-objects/cpf';
import { Email } from '@/domain/auth/enterprise/entities/value-objects/email';
import { UniqueEntityID } from '@/core/entities/unique-entity-id';
import { Address } from '@/domain/auth/enterprise/entities/value-objects/address';

export class MongoDbUserMapper {
  static toPersistence(user: User): MongoUserModel {
    return {
      _id: user.id.toValue(),
      id: user.id.toValue(),
      cpf: user.cpf.value,
      email: user.email.value,
      name: user.name,
      password: user.password,
      role: user.role,
      address: user.address && user.address?.toObject(),
      isConfirmed: user.isConfirmed,
      phone: user.phone,
      signUpInviteId: user.signUpInviteId?.toValue(),
      createdAt: user.createdAt!,
      updatedAt: user.updatedAt,
    };
  }

  static toDomain(user: MongoUserModel): User {
    console.log(user);
    return User.restore(
      {
        cpf: CPF.restore(user.cpf),
        email: Email.restore(user.email),
        name: user.name,
        password: user.password,
        role: user.role,
        address: user.address && Address.create(user.address),
        isConfirmed: user.isConfirmed,
        phone: user.phone,
        signUpInviteId: user?.signUpInviteId
          ? new UniqueEntityID(user.signUpInviteId)
          : undefined,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      new UniqueEntityID(user.id),
    );
  }
}
