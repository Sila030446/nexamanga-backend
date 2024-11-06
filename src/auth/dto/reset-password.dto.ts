import { IsString } from 'class-validator';

export class ResetPasswordDto {
  @IsString()
  hash: string;

  @IsString()
  password: string;
}
