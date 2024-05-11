import {
  EncryptOptions,
  Encrypter,
} from '@/domain/auth/application/gateways/cryptography/encrypter';

export class FakeEncrypter implements Encrypter {
  async decode(token: string): Promise<Record<string, unknown>> {
    return JSON.parse(token);
  }
  async encrypt(
    payload: Record<string, unknown>,
    options?: EncryptOptions,
  ): Promise<string> {
    const clonedPayload = structuredClone(payload);

    if (options?.expiresIn) {
      clonedPayload['expiresIn'] = options.expiresIn;
    }

    return JSON.stringify(clonedPayload);
  }
}
