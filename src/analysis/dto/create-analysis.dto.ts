import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateAnalysisDto {
  @ApiProperty({
    description: '사용자가 웹페이지/앱을 통해 달성하고자 하는 목표나 의도',
    example: '사용자가 3단계 이내로 회원가입을 완료할 수 있도록 하고 싶습니다',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  userIntent: string;

  // 파일은 multer를 통해 처리되므로 DTO에 포함하지 않음
}
