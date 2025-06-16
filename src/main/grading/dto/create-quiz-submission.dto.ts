import { IsString, IsInt, IsBoolean } from 'class-validator';

export class CreateQuizSubmissionDto {
  @IsString()
  userId: string;

  @IsString()
  quizInstanceId: string;

  @IsInt()
  correctAnswers: number;

  @IsInt()
  incorrectAnswers: number;

  @IsBoolean()
  isCompleted: boolean;
}
