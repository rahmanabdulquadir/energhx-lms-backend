import {
  IsArray,
  IsInt,
  ArrayMinSize,
  Min,
  Max,
  IsUUID,
  ValidateNested,
  IsNumber,
  IsString,
} from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';
import { Type } from 'class-transformer';

export class SingleQuizDto {
  @IsString()
  question: string;

  @IsArray({ message: 'Options must be an array' })
  @ArrayMinSize(4, {
    message: 'Options array must contain at least 4 elements.',
  })
  @IsString({ each: true, message: 'Each option must be a string' })
  options: string[];

  @IsInt({ message: 'Correct answer index must be a valid integer.' })
  @Min(1, { message: 'Correct answer index must be at least 1.' })
  @Max(4, { message: 'Correct answer index cannot be greater than 4.' })
  correctAnswer: number;
}

export class CreateQuizDto {
  @IsUUID('4', { message: 'Content ID must be a valid UUID (version 4).' })
  contentId: string;

  @IsArray({ message: 'Quizzes must be an array' })
  @ValidateNested({ each: true })
  @Type(() => SingleQuizDto)
  quizzesData: SingleQuizDto[];
}

export class UpdateQuizDto extends PartialType(CreateQuizDto) {
  @IsUUID('4', { message: 'ID must be a valid UUID (version 4).' })
  id: string;
}

export class AnswerSheetItem {
  @IsUUID('4', { message: 'Quiz ID must be a valid UUID (version 4).' })
  quizId: string;

  @IsInt({ message: 'Answer must be an integer.' })
  answer: number;
}

export class SubmitAnswerDto {
  @IsArray({ message: 'Answer sheet must be an array.' })
  @ValidateNested({ each: true })
  @Type(() => AnswerSheetItem)
  answerSheet: AnswerSheetItem[];

  @IsUUID('4', { message: 'Content ID must be a valid UUID (version 4).' })
  contentId: string;
}
