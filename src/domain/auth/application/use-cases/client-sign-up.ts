import { EventManager, Events } from '@/core/types/events';
import { UserPayload } from '@/infra/auth/jwt.strategy';
import { EnvService } from '@/infra/env/env.service';
import { Logger } from '@/shared/logger';
import { Address } from '@/shared/value-objects/address';
import { Injectable } from '@nestjs/common';
import { UseCase } from 'src/core/types/use-case';
import { Role } from '../../enterprise/entities/enums/role';
import { User } from '../../enterprise/entities/user';
import { CPF } from '../../enterprise/entities/value-objects/cpf';
import { Email } from '../../enterprise/entities/value-objects/email';
import { Password } from '../../enterprise/entities/value-objects/password';
import { Encrypter } from '../gateways/cryptography/encrypter';
import { Hasher } from '../gateways/cryptography/hasher';
import { UsersRepository } from '../gateways/repositories/user-repository';
import { EmailAlreadyInUseError } from './errors/email-already-in-use-error';
import { LoginResponse } from './login';

export type ClientSignUpRequest = {
  email: string;
  password: string;
  name: string;
  cpf: string;
  phone?: string;
  address?: {
    cep: string;
    address: string;
    number: string;
    state: string;
    city: string;
  };
};

export type ClientSignUpResponse = LoginResponse;

@Injectable()
export class ClientSignUpUseCase
  implements UseCase<ClientSignUpRequest, ClientSignUpResponse>
{
  constructor(
    private readonly userRepository: UsersRepository,
    private readonly hasher: Hasher,
    private readonly encrypter: Encrypter,
    private readonly eventManager: EventManager,
    private readonly logger: Logger,
    private readonly envService: EnvService,
  ) {}

  async execute(request: ClientSignUpRequest): Promise<ClientSignUpResponse> {
    this.logger.log(
      ClientSignUpUseCase.name,
      `Iniciando cadastro do cliente ${request.name} com o email ${request.email}: ${JSON.stringify(
        request,
        undefined,
        2,
      )}`,
    );
    const email = Email.create(request.email);

    const userWithSameEmail = await this.userRepository.findByEmail(email);

    if (userWithSameEmail) {
      this.logger.log(
        ClientSignUpUseCase.name,
        `O email ${request.email} já está em uso por outro usuário.`,
      );
      throw new EmailAlreadyInUseError(request.email);
    }

    const password = Password.create(request.password);
    const hashedPassword = await this.hasher.hash(password.value);

    const cpf = CPF.create(request.cpf);
    const address = request.address && Address.create(request.address);

    const user = User.create({
      name: request.name,
      address,
      cpf,
      email,
      password: hashedPassword,
      phone: request?.phone,
      role: Role.USER,
    });

    await this.userRepository.save(user);

    await this.eventManager.publish(Events.USER_CREATED, user);

    const authToken = await this.encrypter.encrypt<UserPayload>(
      {
        sub: user.id.toString(),
      },
      {
        expiresIn: this.envService.get('JWT_EXPIRES_IN'),
      },
    );

    this.logger.log(
      ClientSignUpUseCase.name,
      `Cliente ${request.name} - ${user.id} cadastrado com sucesso!`,
    );

    return { authToken, user };
  }
}
