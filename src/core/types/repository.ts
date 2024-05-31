import { Entity } from '../entities/entity';
import { UniqueEntityID } from '../entities/unique-entity-id';
import { PaginatedRequest, PaginatedResponse } from './pagination';

export interface Repository<TEntity = Entity<any>> {
  save(entity: TEntity): Promise<void>;
  findById(id: UniqueEntityID): Promise<TEntity | null>;
  list?(request: PaginatedRequest): Promise<PaginatedResponse<TEntity>>;
  delete?(id: UniqueEntityID): Promise<void>;
  exists?(id: UniqueEntityID): Promise<boolean>;

  clear(): Promise<void>;
}
