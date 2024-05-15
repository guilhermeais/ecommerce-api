export enum EmailTemplate {
  AccountConfirmation = 'account-confirmation',
}

export type AccountConfirmationData = {
  name: string;
  token: string;
  confirmationUrl: string;
};

export type EmailTemplatesMap = {
  [EmailTemplate.AccountConfirmation]: AccountConfirmationData;
};
