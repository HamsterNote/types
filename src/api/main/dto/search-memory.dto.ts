import { IsIn, IsNotEmpty, IsNumber, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class SearchMemoryDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  keyword!: string;

  @IsOptional()
  @IsIn(['text', 'image'])
  type?: 'text' | 'image';

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number;
}
