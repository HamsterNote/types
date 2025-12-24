export interface ParseDocumentParamsDto {
  uuid: string;
}

export interface ParsedTextItem {
  id: string;
  content: string;
  pageId: string;
  pageNumber: number;
}

export interface ParseDocumentResult {
  docId: string;
  title: string;
  items: ParsedTextItem[];
}
