import { IsNotEmpty, IsString, MaxLength } from 'class-validator'

export class CreateImageMemoryDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  imageUrl!: string
}
