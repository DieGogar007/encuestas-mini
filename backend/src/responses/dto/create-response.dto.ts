import { Type } from 'class-transformer';
import { IsArray, IsString, ValidateNested, ArrayMinSize } from 'class-validator';

class AnswerDto {
  @IsString()
  questionId: string;

  @IsString()
  value: string;
}

export class CreateResponseDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AnswerDto)
  @ArrayMinSize(1)
  answers: AnswerDto[];
}
