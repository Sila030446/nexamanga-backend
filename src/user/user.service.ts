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

@Injectable()
export class UserService {
  constructor(private readonly prisma: DatabaseService) {}

  async create(data: CreateUserRequest) {
    try {
      const { email, password, name } = data;
      const hashedPassword = await bcrypt.hash(password, 10);

      return await this.prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          name,
        },
        select: {
          id: true,
          email: true,
          name: true,
        },
      });
    } catch (error) {
      if (error.code === 'P2002') {
        throw new UnprocessableEntityException('Email already exists.');
      }
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
      },
    });
  }
}
