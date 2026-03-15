import { Type } from 'class-transformer';
import {
  IsArray,
  IsIn,
  IsNotEmpty,
  IsString,
  ValidateNested,
  ArrayMinSize,
  IsNumber,
  IsOptional,
} from 'class-validator';

class CreateQuestionDto {
  @IsString()
  @IsNotEmpty()
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
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsArray()
  @ArrayMinSize(1)
  @IsIn(['STUDENT', 'TEACHER', 'ADMIN'], { each: true })
  targetRoles: string[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateQuestionDto)
  @ArrayMinSize(1)
  questions: CreateQuestionDto[];
}
