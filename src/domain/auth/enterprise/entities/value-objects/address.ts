import { ValueObject } from '@/core/entities/value-object';

export type AddressProps = {
  cep: string;
  address: string;
  number: string;
  state: string;
  city: string;
};

export class Address extends ValueObject<AddressProps> {
  private constructor(props: {
    cep: string;
    address: string;
    number: string;
    state: string;
    city: string;
  }) {
    super(props);
  }

  public static create(address: {
    cep: string;
    address: string;
    number: string;
    state: string;
    city: string;
  }): Address {
    return new Address(address);
  }
}
