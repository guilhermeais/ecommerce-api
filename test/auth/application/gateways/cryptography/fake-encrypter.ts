import {
  EncryptOptions,
  Encrypter,
} from '@/domain/auth/application/gateways/cryptography/encrypter';

export class FakeEncrypter implements Encrypter {
  async decode<T = Record<string, unknown>>(token: string): Promise<T> {
    return JSON.parse(token);
  }
  async encrypt<T = Record<string, unknown>>(
    payload: T,
    options?: EncryptOptions,
  ): Promise<string> {
    const clonedPayload = structuredClone(payload);

    if (options?.expiresIn) {
      clonedPayload['expiresIn'] = options.expiresIn;
    }

    return JSON.stringify(clonedPayload);
  }
}
