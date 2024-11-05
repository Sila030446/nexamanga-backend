/* eslint-disable @typescript-eslint/no-unused-vars */
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
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
  ) {}

  // Calculate the expiration date based on milliseconds
  private calculateExpiration(expirationMs: string): Date {
    const expirationDate = new Date();
    expirationDate.setMilliseconds(
      expirationDate.getMilliseconds() + parseInt(expirationMs, 10),
    );
    return expirationDate;
  }

  async login(
    user: User,
    response: Response,
    redirect: boolean,
  ): Promise<void> {
    // Calculate expiration dates for access and refresh tokens
    const accessTokenExpiration = this.calculateExpiration(
      this.configService.getOrThrow<string>('JWT_ACCESS_TOKEN_EXPIRATION_MS'),
    );

    const refreshTokenExpiration = this.calculateExpiration(
      this.configService.getOrThrow<string>('JWT_REFRESH_TOKEN_EXPIRATION_MS'),
    );

    const tokenPayload = { userId: user.id };
    // Create access and refresh tokens
    const accessToken = this.jwtService.sign(tokenPayload, {
      secret: this.configService.getOrThrow('JWT_ACCESS_TOKEN_SECRET'),
      expiresIn: `${this.configService.getOrThrow('JWT_ACCESS_TOKEN_EXPIRATION_MS')}ms`,
    });

    const refreshToken = this.jwtService.sign(tokenPayload, {
      secret: this.configService.getOrThrow('JWT_REFRESH_TOKEN_SECRET'),
      expiresIn: `${this.configService.getOrThrow('JWT_REFRESH_TOKEN_EXPIRATION_MS')}ms`,
    });

    // Hash the refresh token before storing
    const hashedRefreshToken = await bcrypt.hash(
      refreshToken,
      parseInt(
        this.configService.get('BCRYPT_SALT_ROUNDS', { infer: true }) || '10',
        10,
      ),
    );

    // Update the user with the hashed refresh token
    await this.userService.updateUser({ id: user.id }, { hashedRefreshToken });

    // Set cookies for access and refresh tokens
    response.cookie('Authentication', accessToken, {
      httpOnly: true,
      secure: this.configService.get('NODE_ENV') === 'production',
      expires: accessTokenExpiration,
    });

    response.cookie('Refresh', refreshToken, {
      httpOnly: true,
      secure: this.configService.get('NODE_ENV') === 'production',
      expires: refreshTokenExpiration,
    });

    // Redirect if necessary
    if (redirect) {
      response.redirect(
        `${this.configService.getOrThrow('AUTH_UI_REDIRECT')}/api/auth/google/callback/?accessToken=${accessToken}&refreshToken=${refreshToken}`,
      );
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
    const authenticated = await bcrypt.compare(password, user.password);
    if (!authenticated) {
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
      const authenticated = await bcrypt.compare(
        refreshToken,
        user.hashedRefreshToken,
      );
      if (!authenticated) {
        throw new UnauthorizedException('Invalid refresh token');
      }
      return user;
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async confirmEmail(hash: string) {
    const user = await this.userService.getUser({
      hashedVerificationToken: hash,
    })
    if (!user) {
      throw new UnauthorizedException('Invalid verification token');
    }
    await this.userService.updateUser(
      { id: user.id },
      { status: 'active', hashedVerificationToken: null },
    );
  }

  async logout(data: User, response: Response): Promise<boolean> {
    const user = await this.userService.getUser({ id: data.id });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Clear the hashed refresh token on logout
    await this.userService.updateUser(
      { id: user.id },
      { hashedRefreshToken: null },
    );
    response.clearCookie('Authentication');
    response.clearCookie('Refresh');
    return true;
  }
}
