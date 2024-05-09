import { Encrypter } from '@/domain/auth/application/gateways/cryptography/encrypter';
import { Hasher } from '@/domain/auth/application/gateways/cryptography/hasher';
import { Module } from '@nestjs/common';
import { BcryptHasher } from './bcrpyt-hahser';
import { JwtEncrypter } from './jwt-encrypter';

@Module({
  providers: [
    { provide: Hasher, useClass: BcryptHasher },
    {
      provide: Encrypter,
      useClass: JwtEncrypter,
    },
  ],
  exports: [Encrypter, Hasher],
})
export class CryptographyModule {}
