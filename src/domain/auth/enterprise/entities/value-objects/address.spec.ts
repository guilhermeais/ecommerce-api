import { Address, AddressProps } from './address';
import { InvalidAddressError } from './errors/invalid-address-error';

describe('Address', () => {
  it.each([
    {
      address: {
        address: 'Rua dos Bobos',
        cep: '12345678',
        city: 'São Paulo',
        number: '0',
        state: 'SP',
      },
      comparedAddress: {
        address: 'Rua dos Bobos',
        cep: '12345678',
        city: 'São Paulo',
        number: '0',
        state: 'SP',
      },
      isEqual: true,
    },
    {
      address: {
        address: 'Rua dos Bobos',
        cep: '12345678',
        city: 'São Paulo',
        number: '1',
        state: 'SP',
      },
      comparedAddress: {
        address: 'Rua dos Bobos',
        cep: '12345678',
        city: 'São Paulo',
        number: '0',
        state: 'SP',
      },
      isEqual: false,
    },
  ] as {
    address: AddressProps;
    comparedAddress: AddressProps;
    isEqual: boolean;
  }[])(
    'should return $isEqual when comparing address $address with $comparedAddress',
    ({ address, comparedAddress, isEqual }) => {
      const firstAddress = Address.create(address);
      const secondAddress = Address.create(comparedAddress);

      expect(firstAddress.equals(secondAddress)).toBe(isEqual);
    },
  );

  it.each([
    {
      address: {
        address: 'Rua dos Bobos',
        cep: '12345678',
        city: 'São Paulo',
        number: '0',
      },
      missingProperties: ['state'],
    },
    {
      address: {},
      missingProperties: ['cep', 'address', 'state', 'city'],
    },
  ] as {
    address: Partial<AddressProps>;
    missingProperties: string[];
  }[])(
    'should throw $error.name with missing properties $error.missingProperties when creating address with missing properties $address',
    ({ address, missingProperties }) => {
      try {
        Address.create(address as any);
      } catch (error: any) {
        expect(error).toBeInstanceOf(InvalidAddressError);
        expect(error.missingProperties).toEqual(missingProperties);
      }
    },
  );
});
