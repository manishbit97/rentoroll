import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, Length, MinLength } from 'class-validator';

export class ResetPasswordDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: '123456' })
  @IsString()
  @Length(6, 6, { message: 'OTP must be 6 digits' })
  otp: string;

  @ApiProperty({ example: 'newpassword123' })
  @IsString()
  @MinLength(6, { message: 'Password must be at least 6 characters' })
  new_password: string;
}
