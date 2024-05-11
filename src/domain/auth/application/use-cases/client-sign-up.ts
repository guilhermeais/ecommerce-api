import { EventManager, Events } from '@/core/types/events';
import { Logger } from '@/shared/logger';
import { Injectable } from '@nestjs/common';
import { UseCase } from 'src/core/types/use-case';
import { Role } from '../../enterprise/entities/enums/role';
import { User } from '../../enterprise/entities/user';
import { Address } from '../../enterprise/entities/value-objects/address';
import { CPF } from '../../enterprise/entities/value-objects/cpf';
import { Email } from '../../enterprise/entities/value-objects/email';
import { Password } from '../../enterprise/entities/value-objects/password';
import { Encrypter } from '../gateways/cryptography/encrypter';
import { Hasher } from '../gateways/cryptography/hasher';
import { UserRepository } from '../gateways/repositories/user-repository';
import { EmailAlreadyInUseError } from './errors/email-already-in-use-error';

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

export type ClientSignUpResponse = {
  authToken: string;
  user: User;
};

@Injectable()
export class ClientSignUpUseCase
  implements UseCase<ClientSignUpRequest, ClientSignUpResponse>
{
  constructor(
    private readonly userRepository: UserRepository,
    private readonly hasher: Hasher,
    private readonly encrypter: Encrypter,
    private readonly eventManager: EventManager,
    private readonly logger: Logger,
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

    const authToken = await this.encrypter.encrypt({
      sub: user.id.toString(),
    });

    this.logger.log(
      ClientSignUpUseCase.name,
      `Cliente ${request.name} - ${user.id} cadastrado com sucesso!`,
    );

    return { authToken, user };
  }
}
