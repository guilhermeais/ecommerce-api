import EventEmitter from 'events';
import { Readable, Writable } from 'stream';

export class FakeChildProcess extends EventEmitter {
  stdin: Writable;
  stdout: Readable;
  stderr: Readable;

  constructor(args?: {
    stdin?: Writable;
    stdout?: Readable;
    stderr?: Readable;
  }) {
    super();
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this;
    this.stderr =
      args?.stderr ||
      new Readable({
        read() {
          this.push(null);
        },
      });

    this.stdin =
      args?.stdin ||
      new Writable({
        write(chunk, encoding, callback) {
          callback(null);
        },
        final(callback) {
          self.emit('close', 0);
          callback(null);
        },
      });

    this.stdout =
      args?.stdout ||
      new Readable({
        read() {
          this.push(null);
        },
      });

    this.stderr.once('end', () => {
      this.emit('close', 1);
    });

    this.stdout.once('end', () => {
      this.emit('close', 0);
    });
  }

  kill(exitCode: number, signal?: NodeJS.Signals | number): boolean {
    this.emit('close', exitCode, signal);
    return true;
  }
}
