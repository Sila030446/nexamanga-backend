import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { promises as fsPromises } from 'fs';
import Handlebars from 'handlebars';

@Injectable()
export class MailerService implements OnModuleInit {
  private readonly transporter: nodemailer.Transporter;
  private readonly logger = new Logger(MailerService.name);

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.MAILER_HOST,
      port: Number(process.env.MAILER_PORT),
      ignoreTLS: process.env.MAILER_IGNORE_TLS === 'true', 
      secure: process.env.MAILER_SECURE === 'true', 
      requireTLS: process.env.MAILER_REQUIRE_TLS === 'true', 
      auth: {
        user: process.env.MAILER_USER,
        pass: process.env.MAILER_PASSWORD,
      },
      debug: true,
    });
  }

  async onModuleInit() {
    try {
      await this.transporter.verify();
      this.logger.log('MailerService connected to SMTP server successfully');
    } catch (error) {
      this.logger.error('Failed to connect to SMTP server', error.stack);
    }
  }

  async sendMail({
    templatePath,
    context,
    ...mailOptions
  }: nodemailer.SendMailOptions & {
    templatePath?: string;
    context?: Record<string, unknown>;
  }): Promise<void> {
    let html: string | undefined;

    if (templatePath) {
      try {
        const template = await fsPromises.readFile(templatePath, 'utf-8');
        html = Handlebars.compile(template, { strict: true })(context || {});
        this.logger.log(`Email template loaded from ${templatePath}`);
      } catch (error) {
        this.logger.error(`Failed to read template file at ${templatePath}`, error.stack);
        throw new Error('Template file could not be read');
      }
    }

    try {
      await this.transporter.sendMail({
        ...mailOptions,
        from: mailOptions.from
          ? mailOptions.from
          : `"${process.env.MAILER_DEFAULT_NAME || 'Default Name'}" <${process.env.MAILER_DEFAULT_EMAIL || 'default@example.com'}>`,
        html: mailOptions.html || html,
      });
      this.logger.log(`Email sent to ${mailOptions.to}`);
    } catch (error) {
      this.logger.error(`Failed to send email to ${mailOptions.to}`, error.stack);
      throw new Error('Failed to send email');
    }
  }
}
