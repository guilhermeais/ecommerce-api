import { ConfirmationToken } from '@/domain/auth/enterprise/entities/confirmation-token';
import { User } from '@/domain/auth/enterprise/entities/user';

export enum Events {
  USER_CREATED = 'user.created',
  CONFIRMATION_TOKEN_CREATED = 'confirmationToken.created',
}

export type EventsMap = {
  [Events.USER_CREATED]: User;

  [Events.CONFIRMATION_TOKEN_CREATED]: ConfirmationToken;
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
