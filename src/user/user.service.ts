/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';
import { CreateUserRequest } from './dto/create-user.dto';
import { Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { randomStringGenerator } from '@nestjs/common/utils/random-string-generator.util';
import { MailsService } from 'src/mails/mails.service';
import { TelegramService } from 'src/telegram/telegram.service';
import { formatDateToThaiTime } from 'src/utils/dateTime-convert';

@Injectable()
export class UserService {
  constructor(
    private readonly prisma: DatabaseService,
    private readonly mails: MailsService,
    private readonly sendMessage: TelegramService,
  ) {}

  async create(data: CreateUserRequest) {
    try {
      const { email, password, name } = data;
      const user = await this.prisma.user.findUnique({
        where: {
          email,
        },
      });
      if (user) {
        throw new UnprocessableEntityException('User already exists');
      }
      const hashedPassword = await bcrypt.hash(password, 10);
      const hashedVerificationToken = crypto
        .createHash('sha256')
        .update(randomStringGenerator())
        .digest('hex');
      await this.mails.confirmEmail({
        to: email,
        data: {
          hash: hashedVerificationToken,
          user: name,
        },
      });
      const formattedDate = formatDateToThaiTime(new Date());
      await this.sendMessage.sendMessage(
        `มีผู้ใช้งานใหม่: ${email} \n\n ${formattedDate}`,
      );
      return await this.prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          name,
          hashedVerificationToken,
        },
        select: {
          id: true,
          email: true,
          name: true,
        },
      });
    } catch (error) {
      throw error;
    }
  }

  async getUser(query: Prisma.UserWhereUniqueInput) {
    const user = await this.prisma.user.findUnique({ where: query });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  getProfile(userId: string) {
    return this.prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        name: true,
        email: true,
        image: true,
        role: true,
      },
    });
  }

  async getUsers() {
    return this.prisma.user.findMany();
  }

  async updateUser(
    query: Prisma.UserWhereUniqueInput,
    data: Prisma.UserUpdateInput,
  ) {
    return await this.prisma.user.update({
      where: query,
      data: {
        ...data,
      },
    });
  }

  async getOrCreateUser(data: any) {
    const user = await this.prisma.user.findUnique({
      where: { email: data.email },
    });
    if (user) {
      return user;
    }
    return await this.prisma.user.create({
      data: {
        email: data.email,
        name: data.name,
        password: data.password,
        googleId: data.googleId,
        image: data.image,
        status: 'active',
      },
    });
  }

  async getUserByResetPasswordToken(token: string) {
    const user = await this.prisma.user.findUnique({
      where: {
        forgotPasswordToken: token,
      },
    });
    if (!user) {
      throw new BadRequestException('Invalid token');
    }
    return user;
  }
}
