import { UniqueEntityID } from '@/core/entities/unique-entity-id';
import { UsersRepository } from '@/domain/auth/application/gateways/repositories/user-repository';
import { User } from '@/domain/auth/enterprise/entities/user';
import { Email } from '@/domain/auth/enterprise/entities/value-objects/email';
import { MongoUserModel } from '../schemas/user.model';
import { Inject, Injectable } from '@nestjs/common';
import { EnvService } from '@/infra/env/env.service';
import { Model } from 'mongoose';
import { Logger } from '@/shared/logger';
import { MongoDbUserMapper } from '../mappers/mongodb-user.mapper';

@Injectable()
export class MongoDbUsersRepository implements UsersRepository {
  constructor(
    @Inject(MongoUserModel.COLLECTION_NAME)
    private readonly userModel: Model<MongoUserModel>,
    private readonly env: EnvService,
    private readonly logger: Logger,
  ) {}

  async save(user: User): Promise<void> {
    try {
      this.logger.log(
        MongoDbUsersRepository.name,
        `Saving user ${user.id.toValue()}...`,
      );

      const parsedUser = MongoDbUserMapper.toPersistence(user);

      const exists = await this.userModel.exists({ _id: user.id.toValue() });

      if (exists) {
        await this.userModel.updateOne({ _id: user.id.toValue() }, parsedUser);
      } else {
        await this.userModel.create(parsedUser);
      }

      this.logger.log(
        MongoDbUsersRepository.name,
        `User ${user.id.toValue()} saved successfully`,
      );
    } catch (error: any) {
      this.logger.error(
        MongoDbUsersRepository.name,
        `Error saving user ${user.id.toValue()}: ${error.message}`,
        error.stack,
      );

      throw error;
    }
  }

  async findByEmail(email: Email): Promise<User | null> {
    try {
      this.logger.log(
        MongoDbUsersRepository.name,
        `Finding user by email ${email.value}...`,
      );

      const user = await this.userModel.findOne({ email: email.value }).exec();

      if (!user) {
        this.logger.log(
          MongoDbUsersRepository.name,
          `User with email ${email.value} not found`,
        );
        return null;
      }

      this.logger.log(
        MongoDbUsersRepository.name,
        `User with email ${email.value} found`,
      );

      return MongoDbUserMapper.toDomain(user.toJSON());
    } catch (error: any) {
      this.logger.error(
        MongoDbUsersRepository.name,
        `Error finding user by email ${email.value}: ${error.message}`,
        error.stack,
      );

      throw error;
    }
  }

  async findById(id: UniqueEntityID): Promise<User | null> {
    try {
      this.logger.log(
        MongoDbUsersRepository.name,
        `Finding user by id ${id.toValue()}...`,
      );

      const user = await this.userModel.findOne({
        _id: id.toValue()
      }).exec();

      if (!user) {
        this.logger.log(
          MongoDbUsersRepository.name,
          `User with id ${id.toValue()} not found`,
        );
        return null;
      }

      this.logger.log(
        MongoDbUsersRepository.name,
        `User with id ${id.toValue()} found`,
      );

      return MongoDbUserMapper.toDomain(user.toJSON());
    } catch (error: any) {
      this.logger.error(
        MongoDbUsersRepository.name,
        `Error finding user by id ${id.toValue()}: ${error.message}`,
        error.stack,
      );

      throw error;
    }
  }

  async clear(): Promise<void> {
    const isTesting = this.env.get('IS_TESTING');
    if (isTesting) {
      await this.userModel.deleteMany({}).exec();
      return;
    }

    throw new Error('You can only clear the database in testing environment');
  }
}
