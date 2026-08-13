export interface SendEmailData {
  to: string;
  subject: string;
  body: string;
}

export interface EmailProvider {
  send(data: SendEmailData): Promise<void>;
}