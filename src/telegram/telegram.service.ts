import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class TelegramService {
  private readonly logger = new Logger(TelegramService.name);

  constructor(private readonly configService: ConfigService) {}

  async sendMessage(message: string) {
    const token = this.configService.getOrThrow('TELEGRAM_BOT_TOKEN');
    const chatId = this.configService.getOrThrow('TELEGRAM_CHAT_ID');
    const url = `https://api.telegram.org/bot${token}/sendMessage`;
    const payload = {
      chat_id: chatId,
      text: message,
      parse_mode: 'Markdown',
    };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        this.logger.error(
          `Failed to send message: ${response.status} - ${errorText}`,
        );
        return null;
      }

      this.logger.log(`Message sent successfully to chat ID ${chatId}`);
      return await response.json(); // Return parsed JSON response
    } catch (error) {
      this.logger.error(`Error sending message: ${error.message}`);
      return null;
    }
  }
}
