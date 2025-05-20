import { IsNotEmpty, IsString } from 'class-validator';

export class SeoDataDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  description: string;
} 