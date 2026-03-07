import { IsNotEmpty, IsString, MaxLength } from 'class-validator'

export class CreateTextMemoryDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(10000)
  content!: string
}
