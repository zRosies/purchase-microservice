import { Injectable } from '@nestjs/common';
import { EmailProvider, SendEmailData } from './providers';

@Injectable()
export class ConsoleEmailProvider implements EmailProvider {
  send(data: SendEmailData): Promise<void> {
    console.log('----------------------------------------');
    console.log(`[EMAIL] To:      ${data.to}`);
    console.log(`[EMAIL] Subject: ${data.subject}`);
    console.log('[EMAIL] Body:');
    console.log(data.body);
    console.log('----------------------------------------');
    return Promise.resolve();
  }
}
