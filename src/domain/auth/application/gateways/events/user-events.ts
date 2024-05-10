import { Event } from '@/core/types/event';
import { User } from '@/domain/auth/enterprise/entities/user';

export enum UserEventsEnum {
  USER_CREATED = 'user.created',
}

export type UserEventsMap = {
  [UserEventsEnum.USER_CREATED]: User;
};

export abstract class UserEvents implements Event<UserEventsMap> {
  abstract clearSubscriptions: () => void;
  abstract publish<K extends keyof UserEventsMap>(
    event: K,
    data: UserEventsMap[K],
  ): Promise<void>;

  abstract subscribe<K extends keyof UserEventsMap>(
    event: K,
    callback: (data: UserEventsMap[K]) => void,
  ): void;
}
