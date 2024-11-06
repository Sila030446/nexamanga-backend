import { IsEmail, IsString, MinLength } from 'class-validator';

export class CreateUserRequest {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsString()
  name: string;
}
