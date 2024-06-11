import { UniqueEntityID } from './unique-entity-id';
import { ValueObject } from './value-object';

export abstract class Entity<Props> {
  private _id: UniqueEntityID;
  protected _createdAt: Date;
  protected _updatedAt?: Date;
  protected props: Props;

  get id() {
    return this._id;
  }

  get createdAt() {
    return this._createdAt;
  }

  get updatedAt(): Date | undefined {
    return this._updatedAt;
  }

  set updatedAt(date: Date) {
    this._updatedAt = date;
  }

  protected constructor(
    props: Props,
    id?: UniqueEntityID,
    createdAt = new Date(),
    updatedAt?: Date,
  ) {
    this.props = props;
    this._id = id ?? new UniqueEntityID();

    this._createdAt = createdAt;
    this._updatedAt = updatedAt ?? createdAt;
  }

  public equals(entity: Entity<unknown>) {
    if (entity === this) {
      return true;
    }

    if (entity.id.equals(this.id)) {
      return true;
    }

    return false;
  }

  public toProps() {
    return structuredClone({
      ...this.props,
      id: this.id.toString(),
    });
  }

  public toObject() {
    const obj = structuredClone({
      ...this,
      id: this.id.toString(),
    });

    for (const prop in obj) {
      const _nonSerializable = prop.startsWith('_');

      if (_nonSerializable) {
        continue;
      }

      if (
        obj[prop] instanceof Entity ||
        obj[prop] instanceof ValueObject ||
        (obj[prop] && typeof obj[prop].toObject === 'function')
      ) {
        obj[prop] = obj[prop].toObject();
        continue;
      }

      if (obj[prop] && typeof obj[prop].toValue === 'function') {
        obj[prop] = obj[prop].toValue();
        continue;
      }
    }

    return obj;
  }
}
