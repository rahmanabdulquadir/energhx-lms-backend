import { IsString, IsUUID } from 'class-validator';

export class CreateBasicContentDto {
  @IsString()
  title: string;

  @IsString()
  video: string;

  @IsUUID()
  courseId: string;
}
