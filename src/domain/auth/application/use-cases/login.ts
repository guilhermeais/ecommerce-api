import { UseCase } from '@/core/types/use-case';
import { UserPayload } from '@/infra/auth/jwt.strategy';
import { Logger } from '@/shared/logger';
import { User } from '../../enterprise/entities/user';
import { Email } from '../../enterprise/entities/value-objects/email';
import { Encrypter } from '../gateways/cryptography/encrypter';
import { Hasher } from '../gateways/cryptography/hasher';
import { UsersRepository } from '../gateways/repositories/user-repository';
import { InvalidLoginRequestError } from './errors/invalid-login-request-error';
import { Injectable } from '@nestjs/common';

export type LoginRequest = {
  email: string;
  password: string;
};

export type LoginResponse = {
  authToken: string;
  user: User;
};

@Injectable()
export class LoginUseCase implements UseCase<LoginRequest, LoginResponse> {
  constructor(
    private readonly userRepository: UsersRepository,
    private readonly hasher: Hasher,
    private readonly encrypter: Encrypter,
    private readonly logger: Logger,
  ) {}

  async execute(request: LoginRequest): Promise<LoginResponse> {
    this.logger.log(LoginUseCase.name, `Login with email: ${request.email}`);
    const email = Email.create(request.email);
    const { password } = request;

    const user = await this.userRepository.findByEmail(email);

    if (!user) {
      this.logger.log(
        LoginUseCase.name,
        `User not found with email: ${request.email}`,
      );
      throw new InvalidLoginRequestError();
    }

    this.logger.log(
      LoginUseCase.name,
      `User found with email: ${request.email}: ${user?.id.toString()}`,
    );
    const passwordMatch = await this.hasher.compare(password, user.password);

    if (!passwordMatch) {
      this.logger.log(
        LoginUseCase.name,
        `Invalid password for user with email: ${request.email}`,
      );
      throw new InvalidLoginRequestError();
    }

    const authToken = await this.encrypter.encrypt<UserPayload>({
      sub: user.id.toString(),
    });

    return {
      authToken,
      user,
    };
  }
}
