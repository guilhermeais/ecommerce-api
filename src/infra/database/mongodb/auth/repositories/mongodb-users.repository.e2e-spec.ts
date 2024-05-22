import { UsersRepository } from '@/domain/auth/application/gateways/repositories/user-repository';
import { DatabaseModule } from '@/infra/database/database.module';
import { INestApplication } from '@nestjs/common';
import { Model } from 'mongoose';
import { makeUser } from 'test/auth/enterprise/entities/make-user';
import { makeTestingApp } from 'test/make-testing-app';
import { MongoUserModel } from '../schemas/user.model';
import { MongoDbUsersRepository } from './mongodb-users.repository';
import { Email } from '@/domain/auth/enterprise/entities/value-objects/email';
import { faker } from '@faker-js/faker';
import { UniqueEntityID } from '@/core/entities/unique-entity-id';

describe('MongoDbUsersRepository', () => {
  let app: INestApplication;
  let sut: MongoDbUsersRepository;
  let userModel: Model<MongoUserModel>;

  beforeAll(async () => {
    vi.useFakeTimers({
      now: new Date(),
    });

    const moduleRef = await makeTestingApp({
      providers: [DatabaseModule],
    }).compile();

    app = moduleRef.createNestApplication();
    sut = moduleRef.get(UsersRepository);
    userModel = moduleRef.get(MongoUserModel.COLLECTION_NAME);

    await app.init();
  });

  afterAll(async () => {
    vi.useRealTimers();
    await app.close();
  });

  describe('save()', () => {
    it('should save a unexisting user', async () => {
      const user = makeUser();

      await sut.save(user);

      const savedUser = await userModel.findById(user.id.toValue());

      expect(savedUser).not.toBeNull();
      expect(savedUser?.id).toEqual(user.id.toValue());
      expect(savedUser?.email).toEqual(user.email.value);
      expect(savedUser?.name).toEqual(user.name);
      expect(savedUser?.cpf).toEqual(user.cpf.value);
      expect(savedUser?.phone).toEqual(user.phone);

      expect(savedUser?.address?.address).toEqual(user.address?.address);
      expect(savedUser?.address?.cep).toEqual(user.address?.cep);
      expect(savedUser?.address?.city).toEqual(user.address?.city);
      expect(savedUser?.address?.number).toEqual(user.address?.number);
      expect(savedUser?.address?.number).toEqual(user.address?.number);

      expect(savedUser?.role).toEqual(user.role);
      expect(savedUser?.isConfirmed).toEqual(user.isConfirmed);
      expect(savedUser?.signUpInviteId).toEqual(user.signUpInviteId);
    });

    it('should update an existing user', async () => {
      const user = makeUser();
      await sut.save(user);

      expect(user.signUpInviteId).toBe(undefined);

      user.setSignUpInviteId(new UniqueEntityID());
      await sut.save(user);

      const savedUser = await userModel.findById(user.id.toValue());

      expect(savedUser).not.toBeNull();

      expect(savedUser?.signUpInviteId).toBeTypeOf('string');
    });
  });

  describe('findByEmail()', () => {
    it('should return null if any user is found', async () => {
      const email = Email.create(faker.internet.email());

      const user = await sut.findByEmail(email);

      expect(user).toBeNull();
    });

    it('should find the user by email', async () => {
      const user = makeUser();
      await sut.save(user);

      const foundUser = await sut.findByEmail(user.email);

      expect(foundUser).not.toBeNull();
      expect(foundUser!.id.toValue()).toEqual(user.id.toValue());
    });
  });

  describe('findById()', () => {
    it('should return null if any user is found', async () => {
      const user = await sut.findById(new UniqueEntityID());

      expect(user).toBeNull();
    });

    it('should find the user by id', async () => {
      const user = makeUser();
      await sut.save(user);

      const foundUser = await sut.findById(user.id);

      expect(foundUser).not.toBeNull();
      expect(foundUser!.id.toValue()).toEqual(user.id.toValue());
    });
  });
});
