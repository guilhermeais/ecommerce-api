import { Logger } from '@/shared/logger';
import { mock } from 'vitest-mock-extended';

export function makeFakeLogger(): Logger {
  return mock<Logger>();
}
