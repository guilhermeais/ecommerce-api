import { ConfirmationToken } from '@/domain/auth/enterprise/entities/confirmation-token';
import { SignUpInvite } from '@/domain/auth/enterprise/entities/signup-invite';
import { User } from '@/domain/auth/enterprise/entities/user';
import { Product } from '@/domain/product/enterprise/entities/product';

export enum Events {
  USER_CREATED = 'user.created',
  CONFIRMATION_TOKEN_CREATED = 'confirmationToken.created',
  SIGN_UP_INVITE_CREATED = 'signUpInvite.created',
  PRODUCT_CREATED = 'product.created',
}

export type EventsMap = {
  [Events.USER_CREATED]: User;

  [Events.CONFIRMATION_TOKEN_CREATED]: ConfirmationToken;

  [Events.SIGN_UP_INVITE_CREATED]: SignUpInvite;

  [Events.PRODUCT_CREATED]: Product;
};

export abstract class EventManager {
  abstract publish: <K extends keyof EventsMap>(
    event: K,
    data: EventsMap[K],
  ) => Promise<void>;

  abstract subscribe: <K extends keyof EventsMap>(
    event: K,
    callback: (data: EventsMap[K]) => void,
  ) => void;

  abstract clearSubscriptions: () => void;
}
