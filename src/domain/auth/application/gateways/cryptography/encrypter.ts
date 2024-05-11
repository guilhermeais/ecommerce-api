export abstract class Encrypter {
  abstract encrypt(payload: Record<string, unknown>): Promise<string>;
  abstract decode(token: string): Promise<Record<string, unknown>>;
}
