import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class RegisterDto {
  @IsString()
  @IsNotEmpty({ message: 'กรุณาระบุชื่อผู้ใช้งาน' })
  name: string;

  @IsEmail()
  @IsNotEmpty({ message: 'กรุณาระบุอีเมล' })
  email: string;

  @IsString()
  @MinLength(6, { message: 'รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร' })
  password: string;
}
