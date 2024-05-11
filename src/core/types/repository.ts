import { Entity } from '../entities/entity';

export interface Repository<T = Entity<any>> {
  save(entity: T): Promise<void>;

  clear(): Promise<void>;
}
