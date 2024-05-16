export enum EmailTemplate {
  AccountConfirmation = 'account-confirmation',
}

export type AccountConfirmationData = {
  name: string;
  confirmationId: string;
};

export type EmailTemplatesMap = {
  [EmailTemplate.AccountConfirmation]: AccountConfirmationData;
};
