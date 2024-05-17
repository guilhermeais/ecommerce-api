export type EncryptOptions = {
  expiresIn: number;
};

export abstract class Encrypter {
  abstract encrypt<T = Record<string, unknown>>(
    payload: T,
    options?: EncryptOptions,
  ): Promise<string>;
  abstract decode<T = Record<string, unknown>>(token: string): Promise<T>;
}
