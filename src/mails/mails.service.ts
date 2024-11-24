import { Injectable } from '@nestjs/common';
import * as path from 'path';
import { MailerService } from 'src/mailer/mailer.service';
import { MailData } from './types/mails.type';

@Injectable()
export class MailsService {
  constructor(private readonly mailerService: MailerService) {}
  async confirmEmail(
    mailData: MailData<{ hash: string; user: string }>,
  ): Promise<void> {
    const frontendUrl = process.env.AUTH_UI_REDIRECT;
    if (!frontendUrl) {
      throw new Error('ตัวแปรสภาพแวดล้อม FRONTEND_URL ไม่ได้ถูกกำหนด');
    }

    try {
      await this.mailerService.sendMail({
        to: mailData.to,
        subject: 'Email Confirmation',
        text: `${frontendUrl}/confirm-email/${mailData.data.hash}`,
        templatePath: path.join(
          process.env.NODE_ENV === 'production' ? 'dist' : '',
          'src',
          'mails',
          'templates',
          'confirm.hbs',
        ),
        context: {
          username: mailData.data.user,
          confirmationLink: `${frontendUrl}/confirm-email/${mailData.data.hash}`,
        },
      });
    } catch (error) {
      console.error('ไม่สามารถส่งอีเมลยืนยันถึง:', error);
      throw new Error('ไม่สามารถส่งอีเมลยืนยันได้ กรุณาลองใหม่ในภายหลัง');
    }
  }

  async forgotPassword(
    mailData: MailData<{ hash: string; user: string }>,
  ): Promise<void> {
    const frontendUrl = process.env.AUTH_UI_REDIRECT;
    if (!frontendUrl) {
      throw new Error('ตัวแปรสภาพแวดล้อม FRONTEND_URL ไม่ได้ถูกกำหนด');
    }

    try {
      await this.mailerService.sendMail({
        to: mailData.to,
        subject: 'Password Reset',
        text: `${frontendUrl}/reset-password/${mailData.data.hash}`,
        templatePath: path.join(
          process.env.NODE_ENV === 'production' ? 'dist' : '',
          'src',
          'mails',
          'templates',
          'reset-password.hbs',
        ),
        context: {
          username: mailData.data.user,
          resetLink: `${frontendUrl}/reset-password/${mailData.data.hash}`,
        },
      });
    } catch (error) {
      console.error('ไม่สามารถส่งอีเมลยืนยันถึง:', error);
      throw new Error('ไม่สามารถส่งอีเมลยืนยันได้ กรุณาลองใหม่ในภายหลัง');
    }
  }
}
