import { IsUUID } from 'class-validator';

export class IdDto {
  @IsUUID('4', { message: 'ID must be a valid UUID (version 4).' })
  id: string;
}
