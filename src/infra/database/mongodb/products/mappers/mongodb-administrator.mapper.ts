import { Administrator } from '@/domain/product/enterprise/entities/administrator';
import { MongoAdministratorModel } from '../schemas/administrator.model';
import { UniqueEntityID } from '@/core/entities/unique-entity-id';

export class MongoDbAdministratorMapper {
  static toDomain(administrator: MongoAdministratorModel): Administrator {
    return Administrator.restore(
      {
        email: administrator.email,
        name: administrator.name,
      },
      new UniqueEntityID(administrator.id),
    );
  }
}
