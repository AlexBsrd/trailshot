import { IsString, IsOptional, IsBoolean, IsInt, Min } from 'class-validator';

export class CreateEventDto {
  @IsString()
  name: string;

  @IsString()
  date: string;

  @IsString()
  location: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsInt()
  @Min(0)
  priceSingle: number;

  @IsInt()
  @Min(0)
  pricePack: number;

  @IsOptional()
  @IsBoolean()
  isFree?: boolean;
}
