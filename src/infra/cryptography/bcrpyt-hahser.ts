import { Hasher } from '@/domain/auth/application/gateways/cryptography/hasher';
import { hash, compare } from 'bcrypt';

export class BcryptHasher implements Hasher {
  private HASH_SALT_LENGTH = 8;

  hash(plain: string): Promise<string> {
    return hash(plain, this.HASH_SALT_LENGTH);
  }

  compare(plain: string, hash: string): Promise<boolean> {
    return compare(plain, hash);
  }
}
