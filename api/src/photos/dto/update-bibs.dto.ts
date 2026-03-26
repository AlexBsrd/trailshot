import { IsArray, IsString } from 'class-validator';

export class UpdateBibsDto {
  @IsArray()
  @IsString({ each: true })
  bibs: string[];
}
