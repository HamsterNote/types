import {
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min
} from 'class-validator'
import { Type } from 'class-transformer'

export class SearchMemoryDto {
  /** 搜索关键词 */
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  keyword!: string

  /** 记忆类型 */
  @IsOptional()
  @IsIn(['text', 'image'])
  type?: 'text' | 'image'

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number
}
