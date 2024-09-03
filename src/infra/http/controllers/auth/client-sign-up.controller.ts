import { ClientSignUpUseCase } from '@/domain/auth/application/use-cases/client-sign-up';
import { Public } from '@/infra/auth/public.decorator';
import { Logger } from '@/shared/logger';
import { Body, Controller, Post, UseInterceptors } from '@nestjs/common';
import { z } from 'zod';
import { ZodValidationPipe } from '../../pipes/zod-validation.pipe';
import { UserPresenter } from './presenters/user-presenter';
import { LoginResponse } from './login.controller';
import { TelemetryInterceptor } from '../../interceptors/telemetry.interceptor';

const AddressSchema = z.object({
  cep: z.string({
    message: 'CEP é obrigatório!',
  }),
  address: z.string({
    message: 'Endereço é obrigatório!',
  }),
  number: z.string({
    message: 'Número é obrigatório!',
  }),
  state: z.string({
    message: 'Estado é obrigatório!',
  }),
  city: z.string({
    message: 'Cidade é obrigatória!',
  }),
});

const SignUpBodySchema = z.object({
  email: z.string({
    message: 'Email é obrigatório!',
  }),
  password: z.string({
    message: 'Senha é obrigatória!',
  }),
  name: z.string({
    message: 'Nome é obrigatório!',
  }),
  cpf: z.string({
    message: 'CPF é obrigatório!',
  }),
  phone: z
    .string({
      message: 'Telefone deve ser uma string!',
    })
    .optional(),
  address: z.optional(AddressSchema),
});

export type SignUpBody = z.infer<typeof SignUpBodySchema>;

export type SignUpResponse = LoginResponse;

@UseInterceptors(TelemetryInterceptor)
@Controller('sign-up')
export class ClientSignUpController {
  constructor(
    private readonly clientSignUpUseCase: ClientSignUpUseCase,
    private readonly logger: Logger,
  ) {}

  @Public()
  @Post()
  async handle(
    @Body(new ZodValidationPipe(SignUpBodySchema))
    body: SignUpBody,
  ): Promise<SignUpResponse> {
    try {
      this.logger.log(
        ClientSignUpController.name,
        `Called with body: ${JSON.stringify({
          ...body,
          password: '*****',
        })}`,
      );

      const { authToken, user } = await this.clientSignUpUseCase.execute(body);

      this.logger.log(
        ClientSignUpController.name,
        `Client ${user.name} signed up with email ${user.email}`,
      );

      return {
        authToken,
        user: UserPresenter.toHTTP(user),
      };
    } catch (error: any) {
      this.logger.error(
        ClientSignUpController.name,
        `Error: ${JSON.stringify(error)}`,
        error.stack,
      );

      throw error;
    }
  }
}
