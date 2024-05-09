import { Hasher } from '@/domain/auth/application/gateways/cryptography/hasher';

export class FakeHasher implements Hasher {
  async hash(value: string): Promise<string> {
    return `${value}-hashed`;
  }

  async compare(plainText: string, hashedText: string): Promise<boolean> {
    return `${plainText}-hashed` === hashedText;
  }
}
