import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsString, ValidateNested } from 'class-validator';

class UpdateAnswerDto {
  @IsString()
  questionId: string;

  @IsString()
  value: string;
}

export class UpdateResponseDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateAnswerDto)
  @ArrayMinSize(1)
  answers: UpdateAnswerDto[];
}