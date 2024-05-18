import { Entity } from '../entities/entity';
import { UniqueEntityID } from '../entities/unique-entity-id';

export interface Repository<T = Entity<any>> {
  save(entity: T): Promise<void>;
  findById(id: UniqueEntityID): Promise<T | null>;

  clear(): Promise<void>;
}
