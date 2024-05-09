import { Address, AddressProps } from './address';

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
});
