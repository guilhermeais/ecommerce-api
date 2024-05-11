import { User } from '@/domain/auth/enterprise/entities/user';

export type UserHTTPResponse = {
  id: string;
  email: string;
  name: string;
  cpf: string;
  phone?: string;
  address?: {
    cep: string;
    address: string;
    number?: string;
    state: string;
    city: string;
  };
  isConfirmed?: boolean;
};

export class UserPresenter {
  static toHTTP(user: User): UserHTTPResponse {
    return {
      id: user.id.toString(),
      email: user.email.value,
      name: user.name,
      cpf: user.cpf.value,
      phone: user?.phone,
      address: user?.address && {
        cep: user.address.cep,
        address: user.address.address,
        number: user.address.number,
        state: user.address.state,
        city: user.address.city,
      },
      isConfirmed: user.isConfirmed,
    };
  }
}
