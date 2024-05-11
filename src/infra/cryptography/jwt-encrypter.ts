import {
  EncryptOptions,
  Encrypter,
} from '@/domain/auth/application/gateways/cryptography/encrypter';
import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { EnvService } from '../env/env.service';

@Injectable()
export class JwtEncrypter implements Encrypter {
  constructor(
    private jwtService: JwtService,
    private readonly env: EnvService,
  ) {}

  async encrypt(
    payload: Record<string, unknown>,
    options?: EncryptOptions,
  ): Promise<string> {
    return await this.jwtService.signAsync(payload, {
      expiresIn: options?.expiresIn,
    });
  }

  async decode(token: string): Promise<Record<string, unknown>> {
    const publicKey = this.env.get('JWT_PUBLIC_KEY');

    return await this.jwtService.verifyAsync(token, {
      algorithms: ['RS256'],
      publicKey: Buffer.from(publicKey, 'base64'),
    });
  }
}
