import { Event } from '@/core/types/event';
import { User } from '@/domain/auth/enterprise/entities/user';

export type UserEventsMap = {
  'user.created': User;
};

export abstract class UserEvents implements Event<UserEventsMap> {
  abstract publish<K extends keyof UserEventsMap>(
    event: K,
    data: UserEventsMap[K],
  ): Promise<void>;

  abstract subscribe<K extends keyof UserEventsMap>(
    event: K,
    callback: (data: UserEventsMap[K]) => void,
  ): void;
}
