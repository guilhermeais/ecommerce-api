export type EncryptOptions = {
  expiresIn: number;
};

export abstract class Encrypter {
  abstract encrypt(
    payload: Record<string, unknown>,
    options?: EncryptOptions,
  ): Promise<string>;
  abstract decode(token: string): Promise<Record<string, unknown>>;
}
