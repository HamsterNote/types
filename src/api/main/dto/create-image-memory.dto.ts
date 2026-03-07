import { IsNotEmpty, IsString, MaxLength } from 'class-validator'

export class CreateImageMemoryDto {
  /** 图片 URL */
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  imageUrl!: string
}
