import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { User } from '@prisma/client';
import { Response } from 'express';
import { UserService } from 'src/user/user.service';
import { MailsService } from 'src/mails/mails.service';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { randomStringGenerator } from '@nestjs/common/utils/random-string-generator.util';

interface TokenConfig {
  secret: string;
  expirationMs: string;
}

@Injectable()
export class AuthService {
  private readonly accessTokenConfig: TokenConfig;
  private readonly refreshTokenConfig: TokenConfig;
  private readonly saltRounds: number;
  private readonly isProduction: boolean;

  constructor(
    private readonly userService: UserService,
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
    private readonly mailsService: MailsService,
  ) {
    // Initialize configuration on service creation
    this.accessTokenConfig = {
      secret: this.configService.getOrThrow('JWT_ACCESS_TOKEN_SECRET'),
      expirationMs: this.configService.getOrThrow(
        'JWT_ACCESS_TOKEN_EXPIRATION_MS',
      ),
    };
    this.refreshTokenConfig = {
      secret: this.configService.getOrThrow('JWT_REFRESH_TOKEN_SECRET'),
      expirationMs: this.configService.getOrThrow(
        'JWT_REFRESH_TOKEN_EXPIRATION_MS',
      ),
    };
    this.saltRounds = parseInt(
      this.configService.get('BCRYPT_SALT_ROUNDS', '10'),
      10,
    );
    this.isProduction = this.configService.get('NODE_ENV') === 'production';
  }

  private calculateExpiration(expirationMs: string): Date {
    return new Date(Date.now() + parseInt(expirationMs, 10));
  }

  private async generateToken(
    userId: string,
    config: TokenConfig,
  ): Promise<string> {
    return this.jwtService.sign(
      { userId },
      {
        secret: config.secret,
        expiresIn: `${config.expirationMs}ms`,
      },
    );
  }

  private async setAuthCookies(
    response: Response,
    accessToken: string,
    refreshToken: string,
  ): Promise<void> {
    const cookieOptions = {
      httpOnly: true,
      secure: this.isProduction,
    };

    response.cookie('Authentication', accessToken, {
      ...cookieOptions,
      expires: this.calculateExpiration(this.accessTokenConfig.expirationMs),
    });

    response.cookie('Refresh', refreshToken, {
      ...cookieOptions,
      expires: this.calculateExpiration(this.refreshTokenConfig.expirationMs),
    });
  }

  async login(
    user: User,
    response: Response,
    redirect: boolean,
  ): Promise<void> {
    const [accessToken, refreshToken] = await Promise.all([
      this.generateToken(user.id, this.accessTokenConfig),
      this.generateToken(user.id, this.refreshTokenConfig),
    ]);

    const hashedRefreshToken = await bcrypt.hash(refreshToken, this.saltRounds);

    await Promise.all([
      this.userService.updateUser({ id: user.id }, { hashedRefreshToken }),
      this.setAuthCookies(response, accessToken, refreshToken),
    ]);

    if (redirect) {
      const redirectUrl = `https://nexamanga.online/api/auth/google/callback/?accessToken=${accessToken}&refreshToken=${refreshToken}`;
      response.redirect(redirectUrl);
    }
  }

  async verifyUser(email: string, password: string): Promise<User> {
    const user = await this.userService.getUser({ email });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    if (user.status !== 'active') {
      throw new UnauthorizedException('Please verify your account');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid Password');
    }

    return user;
  }

  async verifyUserRefreshToken(
    refreshToken: string,
    userId: string,
  ): Promise<User> {
    try {
      const user = await this.userService.getUser({ id: userId });
      const isTokenValid = await bcrypt.compare(
        refreshToken,
        user.hashedRefreshToken,
      );

      if (!isTokenValid) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      return user;
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async confirmEmail(hash: string): Promise<void> {
    const user = await this.userService.getUser({
      hashedVerificationToken: hash,
    });

    if (!user) {
      throw new UnauthorizedException('Invalid verification token');
    }

    await this.userService.updateUser(
      { id: user.id },
      { status: 'active', hashedVerificationToken: null },
    );
  }

  async forgotPassword(email: string): Promise<void> {
    if (!email) {
      throw new BadRequestException('Email is required');
    }

    const user = await this.userService.getUser({ email });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const forgotPasswordToken = crypto
      .createHash('sha256')
      .update(randomStringGenerator())
      .digest('hex');

    await Promise.all([
      this.mailsService.forgotPassword({
        to: email,
        data: {
          hash: forgotPasswordToken,
          user: user.name,
        },
      }),
      this.userService.updateUser({ id: user.id }, { forgotPasswordToken }),
    ]);
  }

  async resetPassword(
    forgotPasswordToken: string,
    password: string,
  ): Promise<void> {
    const user =
      await this.userService.getUserByResetPasswordToken(forgotPasswordToken);

    if (!user) {
      throw new UnauthorizedException('Invalid forgot password token');
    }

    const hashedPassword = await bcrypt.hash(password, this.saltRounds);
    await this.userService.updateUser(
      { id: user.id },
      { password: hashedPassword, forgotPasswordToken: null },
    );
  }

  async logout(user: User, response: Response): Promise<boolean> {
    await this.userService.updateUser(
      { id: user.id },
      { hashedRefreshToken: null },
    );

    response.clearCookie('Authentication');
    response.clearCookie('Refresh');

    return true;
  }
}
