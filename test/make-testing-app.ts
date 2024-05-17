import { EmailSender } from '@/domain/notifications/application/gateways/notifications/email-sender';
import { AppModule } from '@/infra/app.module';
import { FakeEmailSender } from '@/infra/notifications/fake-email-sender';
import { ModuleMetadata } from '@nestjs/common';
import { Test, TestingModuleBuilder } from '@nestjs/testing';

export function makeTestingApp(
  modifications?: Partial<ModuleMetadata>,
): TestingModuleBuilder {
  return Test.createTestingModule({
    ...modifications,
    imports: [AppModule, ...(modifications?.imports ?? [])],
  })
    .overrideProvider(EmailSender)
    .useClass(FakeEmailSender);
}