export interface CreateFolderDto {
  name: string;

  // 父文件夹 uuid，可选；不传表示顶层
  parentUuid?: string;

  // 预留：标签与颜色
  tags?: string;

  color?: string;

  // 排序方式 JSON（预留）
  sortOptions?: Record<string, any>;

  // 排序权重（默认 0）
  order?: number;
}
