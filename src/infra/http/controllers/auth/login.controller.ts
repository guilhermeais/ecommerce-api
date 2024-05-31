import { LoginUseCase } from '@/domain/auth/application/use-cases/login';
import { Public } from '@/infra/auth/public.decorator';
import { Logger } from '@/shared/logger';
import { Body, Controller, Post } from '@nestjs/common';
import { z } from 'zod';
import { ZodValidationPipe } from '../../pipes/zod-validation.pipe';
import { UserHTTPResponse, UserPresenter } from './presenters/user-presenter';

const LoginBodySchema = z.object({
  email: z.string({
    message: 'Email é obrigatório!',
  }),
  password: z.string({
    message: 'Senha é obrigatória!',
  }),
});

export type LoginBodyRequest = z.infer<typeof LoginBodySchema>;

export type LoginResponse = {
  authToken: string;
  user: UserHTTPResponse;
};

@Controller('login')
export class LoginController {
  constructor(
    private readonly login: LoginUseCase,
    private readonly logger: Logger,
  ) {}

  @Public()
  @Post()
  async handle(
    @Body(new ZodValidationPipe(LoginBodySchema))
    body: LoginBodyRequest,
  ): Promise<LoginResponse> {
    try {
      this.logger.log(LoginController.name, `Called with email: ${body.email}`);

      const { authToken, user } = await this.login.execute(body);

      this.logger.log(
        LoginController.name,
        `Client ${user.name} signed up with email ${user.email}`,
      );

      return {
        authToken,
        user: UserPresenter.toHTTP(user),
      };
    } catch (error: any) {
      this.logger.error(
        LoginController.name,
        `Error: ${JSON.stringify(error)}`,
        error.stack,
      );

      throw error;
    }
  }
}
