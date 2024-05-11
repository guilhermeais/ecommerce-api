import { Event } from '@/core/types/event';
import { ConfirmationToken } from '@/domain/auth/enterprise/entities/confirmation-token';

export enum ConfirmationTokenEventsEnum {
  CONFIRMATION_TOKEN_CREATED = 'confirmationToken.created',
}

export type ConfirmationTokenEventsMap = {
  [ConfirmationTokenEventsEnum.CONFIRMATION_TOKEN_CREATED]: ConfirmationToken;
};

export abstract class ConfirmationTokenEvents extends Event<ConfirmationTokenEventsMap> {}
