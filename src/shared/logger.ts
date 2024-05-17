export abstract class Logger {
  abstract log(context: string, message: string): void;
  abstract error(context: string, message: string, trace?: string): void;
  abstract warn(context: string, message: string): void;
  abstract debug(context: string, message: string): void;
}
