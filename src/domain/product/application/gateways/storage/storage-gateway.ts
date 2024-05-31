import { File } from './file';

export type UploadParams = File;
export type UploadResponse = {
  url: string;
};

export abstract class StorageGateway {
  abstract upload(file: File): Promise<UploadResponse>;
  abstract delete(url: string): Promise<void>;
}
