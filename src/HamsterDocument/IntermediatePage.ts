import {
  IntermediateImage,
  type IntermediateImageSerialized
} from './IntermediateImage'
import {
  IntermediateParagraph,
  type IntermediateParagraphSerialized
} from './IntermediateParagraph'
import {
  IntermediateText,
  type IntermediateTextSerialized
} from './IntermediateText'

// 内容元素类型：可以是文本或图片
export type IntermediateContent = IntermediateText | IntermediateImage
export type IntermediateContentSerialized =
  | IntermediateTextSerialized
  | IntermediateImageSerialized

// 向后兼容的序列化接口，支持旧格式（texts）和新格式（content）
export interface IntermediatePageSerialized {
  id: string
  // 页面内容，包括文本和图片（新格式）
  content?: IntermediateContentSerialized[]
  // 向后兼容：旧格式使用 texts 字段
  texts?: IntermediateTextSerialized[]
  paragraphs?: IntermediateParagraphSerialized[]
  width: number
  height: number
  number: number
  // 缩略图，使用 IntermediateImage 表示
  thumbnail?: IntermediateImageSerialized
  // 是否使用文档流排版（而非绝对定位），缺省时使用定位排版
  useFlowLayout?: boolean
}

// 定义内容获取函数的返回类型别名
type ContentGetterReturnType =
  | Promise<IntermediateContent[] | IntermediateContentSerialized[]>
  | IntermediateContent[]
  | IntermediateContentSerialized[]

/**
 * 判断序列化数据是否为图片类型
 * 使用更可靠的判断方式：检查 src 字段是否存在且为字符串
 */
function isImageSerialized(
  item: IntermediateContentSerialized
): item is IntermediateImageSerialized {
  return (
    'src' in item &&
    typeof (item as IntermediateImageSerialized).src === 'string'
  )
}


function parseContentItem(
  item: IntermediateContent | IntermediateContentSerialized
): IntermediateContent {
  if (item instanceof IntermediateText || item instanceof IntermediateImage) {
    return item
  }
  // 使用更可靠的类型判断：检查 src 字段是否存在且为字符串
  if (isImageSerialized(item)) {
    return IntermediateImage.parse(item)
  }
  return IntermediateText.parse(item as IntermediateTextSerialized)
}

function serializeContentItem(
  item: IntermediateContent
): IntermediateContentSerialized {
  if (item instanceof IntermediateImage) {
    return IntermediateImage.serialize(item)
  }
  return IntermediateText.serialize(item)
}

export class IntermediatePage {
  public id: string
  public content: IntermediateContent[]
  public paragraphs: IntermediateParagraph[]
  public width: number
  public height: number
  public number: number
  public useFlowLayout?: boolean
  private _thumbnail?: IntermediateImage
  private _getThumbnailFn?: (scale: number) => Promise<IntermediateImage | undefined>
  private _getContentFn?: () => ContentGetterReturnType
  // 标记内容是否已经完成加载，便于上层做懒加载策略
  private contentLoaded: boolean
  static serialize(page: IntermediatePage): IntermediatePageSerialized {
    return {
      id: page.id,
      content: page.content.map(serializeContentItem),
      paragraphs: page.paragraphs.map(IntermediateParagraph.serialize),
      width: page.width,
      height: page.height,
      number: page.number,
      useFlowLayout: page.useFlowLayout,
      thumbnail: page._thumbnail
        ? IntermediateImage.serialize(page._thumbnail)
        : undefined
    }
  }
  static parse(data: IntermediatePageSerialized): IntermediatePage {
    return new IntermediatePage(data)
  }
  constructor({
    content,
    texts,
    paragraphs = [],
    width,
    height,
    number,
    id,
    thumbnail,
    useFlowLayout,
    getThumbnailFn,
    getContentFn
  }: Omit<IntermediatePageSerialized, 'content' | 'texts' | 'paragraphs'> & {
    content?: IntermediateContent[] | IntermediateContentSerialized[]
    texts?: IntermediateText[] | IntermediateTextSerialized[]
    paragraphs?: IntermediateParagraph[] | IntermediateParagraphSerialized[]
  } & {
    getThumbnailFn?: (scale: number) => Promise<IntermediateImage | undefined>
    getContentFn?: () => ContentGetterReturnType
  }) {
    this.id = id
    // 向后兼容：优先使用 content，如果不存在则使用 texts
    const rawContent = content ?? texts ?? []
    this.content = (
      rawContent as (IntermediateContent | IntermediateContentSerialized)[]
    ).map(parseContentItem)
    this.paragraphs = (
      paragraphs as (IntermediateParagraph | IntermediateParagraphSerialized)[]
    ).map((paragraph) =>
      paragraph instanceof IntermediateParagraph
        ? paragraph
        : IntermediateParagraph.parse(paragraph)
    )
    this.width = width
    this.height = height
    this.number = number
    this.useFlowLayout = useFlowLayout
    this._thumbnail = thumbnail
      ? thumbnail instanceof IntermediateImage
        ? thumbnail
        : IntermediateImage.parse(thumbnail)
      : undefined
    if (getThumbnailFn) this._getThumbnailFn = getThumbnailFn
    if (getContentFn) this._getContentFn = getContentFn
    this.contentLoaded = !getContentFn
  }
  // 获取缩略图，按需渲染
  async getThumbnail(scale = 1): Promise<IntermediateImage | undefined> {
    if (this._getThumbnailFn) return this._getThumbnailFn(scale)
    return this._thumbnail
  }
  // 获取内容，按需获取
  async getContent(): Promise<IntermediateContent[]> {
    if (this._getContentFn) {
      const data = await this._getContentFn()
      const mapped = (
        data as (IntermediateContent | IntermediateContentSerialized)[]
      ).map(parseContentItem)
      this.content = mapped
      this.contentLoaded = true
      // 懒加载完成后去掉取数函数，避免重复请求
      this._getContentFn = undefined
    }
    return this.content
  }
  // 判断内容是否已加载（便于调用方做缓存判断）
  get hasLoadedContent(): boolean {
    return this.contentLoaded
  }
  // 提供一个方法以注入按需生成缩略图的函数
  setGetThumbnail(fn: (scale: number) => Promise<IntermediateImage | undefined>) {
    this._getThumbnailFn = fn
  }
  // 提供一个方法以注入按需获取内容的函数
  setGetContent(fn: () => ContentGetterReturnType) {
    this._getContentFn = fn
  }
}
