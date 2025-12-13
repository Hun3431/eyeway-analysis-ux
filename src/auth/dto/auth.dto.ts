import { IsEmail, IsString, MinLength, IsOptional, IsInt, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SignUpDto {
  @ApiProperty({
    description: '사용자 이메일',
    example: 'user@eyeway.com',
    required: true,
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: '비밀번호 (최소 6자)',
    example: 'password123',
    minLength: 6,
    required: true,
  })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({
    description: '사용자 이름',
    example: '홍길동',
    required: true,
  })
  @IsString()
  name: string;

  @ApiProperty({
    description: '나이 (선택)',
    example: 25,
    required: false,
    minimum: 0,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  age?: number;
}

export class LoginDto {
  @ApiProperty({
    description: '로그인 이메일',
    example: 'user@eyeway.com',
    required: true,
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: '비밀번호',
    example: 'password123',
    required: true,
  })
  @IsString()
  password: string;
}
