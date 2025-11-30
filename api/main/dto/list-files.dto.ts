export type UploadStatus = 'uploading' | 'completed' | 'failed';

export interface ListFilesQueryDto {
	// 父级文件夹 uuid；不传表示不按层级过滤，传空/"null"/空字符串表示顶层
	parentUuid?: string;

	// 过滤上传状态（uploading/completed/failed）
	status?: UploadStatus;

	// 分页参数
	page?: number;

	pageSize?: number;
}
