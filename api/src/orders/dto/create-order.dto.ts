import { IsString, IsArray, IsBoolean, IsEmail, IsUUID } from 'class-validator';

export class CreateOrderDto {
  @IsUUID()
  eventId: string;

  @IsEmail()
  email: string;

  @IsArray()
  @IsUUID('4', { each: true })
  photoIds: string[];

  @IsBoolean()
  isPack: boolean;
}
