import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { DatabaseModule } from 'src/database/database.module';
import { JwtStrategy } from 'src/auth/strategies/jwt.strategy';
import { MailsModule } from 'src/mails/mails.module';
import { TelegramModule } from 'src/telegram/telegram.module';

@Module({
  imports: [DatabaseModule, MailsModule, TelegramModule],
  controllers: [UserController],
  providers: [UserService, JwtStrategy],
  exports: [UserService],
})
export class UserModule {}
