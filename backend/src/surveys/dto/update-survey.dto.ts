import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsIn,
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
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsArray()
  targetRoles?: string[];

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsArray()
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