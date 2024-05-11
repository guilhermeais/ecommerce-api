import { Event } from '@/core/types/event';
import { User } from '@/domain/auth/enterprise/entities/user';

export enum UserEventsEnum {
  USER_CREATED = 'user.created',
}

export type UserEventsMap = {
  [UserEventsEnum.USER_CREATED]: User;
};

export abstract class UserEvents extends Event<UserEventsMap> {}
