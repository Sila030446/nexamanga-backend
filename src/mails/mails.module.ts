import { Module } from '@nestjs/common';
import { MailsService } from './mails.service';
import { MailerModule } from 'src/mailer/mailer.module';

@Module({
  imports: [MailerModule],
  providers: [MailsService],
  exports: [MailsService],
})
export class MailsModule {}
