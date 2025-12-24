export interface InitUploadDto {
  originalFilename: string

  size: number // bytes, max 1GB
}
