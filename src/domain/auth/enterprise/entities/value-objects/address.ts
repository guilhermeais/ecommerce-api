import { ValueObject } from '@/core/entities/value-object';
import { InvalidAddressError } from './errors/invalid-address-error';

export type AddressProps = {
  cep: string;
  address: string;
  number?: string;
  state: string;
  city: string;
};

export class Address extends ValueObject<AddressProps> {
  public static create(unsafeAddress: AddressProps): Address {
    const addressProps: AddressProps = {
      cep: unsafeAddress.cep,
      address: unsafeAddress.address,
      number: unsafeAddress.number,
      state: unsafeAddress.state,
      city: unsafeAddress.city,
    };
    const { missingProperties } = Address.isValid(addressProps);

    if (missingProperties.length) {
      throw new InvalidAddressError({ missingProperties });
    }

    return new Address(addressProps);
  }

  private static isValid(address: AddressProps): {
    missingProperties: string[];
  } {
    const requiredProperties = ['cep', 'address', 'state', 'city'];
    const missingProperties = requiredProperties.filter(
      (property) => !address[property],
    );

    return {
      missingProperties,
    };
  }

  get cep() {
    return this.props.cep;
  }

  get address() {
    return this.props.address;
  }

  get number() {
    return this.props.number;
  }

  get state() {
    return this.props.state;
  }

  get city() {
    return this.props.city;
  }
}
