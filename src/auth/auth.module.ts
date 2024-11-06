import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UserModule } from 'src/user/user.module';
import { JwtModule } from '@nestjs/jwt';
import { LocalStrategy } from './strategies/local.strategry';
import { JwtRefreshStrategy } from './strategies/jwt-refresh.strategy';
import { JwtStrategy } from './strategies/jwt.strategy';
import { GoogleStrategy } from './strategies/google.strategy';
import { MailsModule } from 'src/mails/mails.module';

@Module({
  imports: [UserModule, JwtModule, MailsModule],
  controllers: [AuthController],
  providers: [
    AuthService,
    LocalStrategy,
    JwtRefreshStrategy,
    JwtStrategy,
    GoogleStrategy,
  ],
})
export class AuthModule {}
