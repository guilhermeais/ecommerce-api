export class MongoDbCostumerModel {
  static COLLECTION_NAME = 'users' as const;

  _id!: string;
  id!: string;
  name!: string;
  email!: string;
}
