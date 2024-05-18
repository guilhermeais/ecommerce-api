export enum EmailTemplate {
  AccountConfirmation = 'account-confirmation',
  SignUpInvite = 'sign-up-invite',
}

export type AccountConfirmationData = {
  name: string;
  confirmationId: string;
};

export type SignUpInviteData = {
  sentByName: string;
  inviteId: string;
  guestName: string;
};

export type EmailTemplatesMap = {
  [EmailTemplate.AccountConfirmation]: AccountConfirmationData;
  [EmailTemplate.SignUpInvite]: SignUpInviteData;
};
