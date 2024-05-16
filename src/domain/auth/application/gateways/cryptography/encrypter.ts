export type EncryptOptions = {
  expiresIn: number;
};

export abstract class Encrypter {
  abstract encrypt(
    payload: Record<string, unknown>,
    options?: EncryptOptions,
  ): Promise<string>;
  abstract decode<T = Record<string, unknown>>(token: string): Promise<T>;
}
