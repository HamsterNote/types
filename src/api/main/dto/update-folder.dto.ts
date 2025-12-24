export interface UpdateFolderDto {
  name?: string

  tags?: string

  color?: string

  sortOptions?: Record<string, object> | null

  order?: number

  // 允许移动到另一个父级
  parentUuid?: string | null
}
