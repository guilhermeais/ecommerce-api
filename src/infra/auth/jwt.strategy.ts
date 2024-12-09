import { GetUserUseCase } from '@/domain/auth/application/use-cases/get-user';
import { Logger } from '@/shared/logger';
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';
import { ParamsDictionary } from 'express-serve-static-core';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ParsedQs } from 'qs';
import { z } from 'zod';
import { EnvService } from '../env/env.service';

const tokenPayloadSchema = z.object({
  sub: z.string().uuid(),
});

export type UserPayload = z.infer<typeof tokenPayloadSchema> & {
  iat?: number;
  exp?: number;
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    config: EnvService,
    private readonly getUser: GetUserUseCase,
    private readonly logger: Logger,
  ) {
    const publicKey = config.get('JWT_PUBLIC_KEY');

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: Buffer.from(publicKey, 'base64'),
      algorithms: ['RS256'],
    });
  }

  async validate(payload: UserPayload) {
    try {
      this.logger.log(JwtStrategy.name, `Validating user ${JSON.stringify(payload, null, 2)}`);
    const { sub } = tokenPayloadSchema.parse(payload);

    this.logger.log(JwtStrategy.name, `Getting user ${sub}`);

    const user = await this.getUser.execute({ userId: sub });

    this.logger.log(
      JwtStrategy.name,
      `User ${user.id.toString()} - ${user.name} found`,
    );

    return user;
    } catch (error: any) {
      this.logger.error(JwtStrategy.name, `Error validatin the user ${JSON.stringify(payload, null, 2)}: ${error.message}`, error.stack)
      throw error
    }
  }

  authenticate(
    req: Request<ParamsDictionary, any, any, ParsedQs, Record<string, any>>,
    options?: any,
  ): void {
    this.logger.log(JwtStrategy.name, `Authenticating user...`);
    super.authenticate(req, options);
  }
}
