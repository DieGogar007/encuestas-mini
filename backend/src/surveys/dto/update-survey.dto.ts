import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

class UpsertQuestionDto {
  @IsOptional()
  @IsString()
  id?: string;

  @IsString()
  @IsNotEmpty()
  text: string;

  @IsIn(['MULTIPLE_CHOICE', 'OPEN_TEXT'])
  type: 'MULTIPLE_CHOICE' | 'OPEN_TEXT';

  @IsArray()
  options: string[];

  @IsOptional()
  @IsNumber()
  order?: number;
}

export class UpdateSurveyDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  title?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  description?: string;

  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @IsIn(['STUDENT', 'TEACHER', 'ADMIN'], { each: true })
  targetRoles?: string[];

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => UpsertQuestionDto)
  questions?: UpsertQuestionDto[];
}

export class CreateQuestionDto {
  @IsString()
  text: string;

  @IsIn(['MULTIPLE_CHOICE', 'OPEN_TEXT'])
  type: 'MULTIPLE_CHOICE' | 'OPEN_TEXT';

  @IsArray()
  options: string[];

  @IsOptional()
  @IsNumber()
  order?: number;
}

export class UpdateQuestionDto {
  @IsOptional()
  @IsString()
  text?: string;

  @IsOptional()
  @IsIn(['MULTIPLE_CHOICE', 'OPEN_TEXT'])
  type?: 'MULTIPLE_CHOICE' | 'OPEN_TEXT';

  @IsOptional()
  @IsArray()
  options?: string[];

  @IsOptional()
  @IsNumber()
  order?: number;
}