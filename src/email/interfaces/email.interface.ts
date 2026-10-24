export interface BaseEmailData {
  to: string
  subject: string
}

export interface ForgotPasswordEmailData extends BaseEmailData {
  type: 'forgot-password'
  resetLink: string
}

export interface WelcomeEmailData extends BaseEmailData {
  type: 'welcome'
  firstname: string
}

export interface InvitationEmailData extends BaseEmailData {
  type: 'invitation'
  inviteLink: string
}

export type EmailData = ForgotPasswordEmailData | WelcomeEmailData | InvitationEmailData
