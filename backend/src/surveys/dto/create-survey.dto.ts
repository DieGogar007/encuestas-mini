import { Type } from 'class-transformer';
import {
  IsArray,
  IsIn,
  IsString,
  ValidateNested,
  ArrayMinSize,
  IsNumber,
  IsOptional,
} from 'class-validator';

class CreateQuestionDto {
  @IsString()
  text: string;

  @IsIn(['MULTIPLE_CHOICE', 'OPEN_TEXT'])
  type: 'MULTIPLE_CHOICE' | 'OPEN_TEXT';

  @IsArray()
  options: string[];

  @IsNumber()
  @IsOptional()
  order?: number;
}

export class CreateSurveyDto {
  @IsString()
  title: string;

  @IsString()
  description: string;

  @IsArray()
  @ArrayMinSize(1)
  targetRoles: string[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateQuestionDto)
  @ArrayMinSize(1)
  questions: CreateQuestionDto[];
}
