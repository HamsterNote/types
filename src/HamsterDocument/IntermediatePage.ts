import {
  IntermediateText,
  IntermediateTextSerialized
} from './IntermediateText'

export interface IntermediatePageSerialized {
  id: string
  texts: IntermediateTextSerialized[]
  width: number
  height: number
  number: number
  // 缩略图，背景图
  thumbnail: string | undefined
}

// 定义文本获取函数的返回类型别名
type TextsGetterReturnType =
  | Promise<IntermediateText[] | IntermediateTextSerialized[]>
  | IntermediateText[]
  | IntermediateTextSerialized[]

export class IntermediatePage {
  public id: string
  public texts: IntermediateText[]
  public width: number
  public height: number
  public number: number
  private _thumbnail?: string
  private _getThumbnailFn?: (scale: number) => Promise<string | undefined>
  private _getTextsFn?: () => TextsGetterReturnType
  // 标记文本是否已经完成加载，便于上层做懒加载策略
  private textsLoaded: boolean
  static serialize(page: IntermediatePage): IntermediatePageSerialized {
    return {
      id: page.id,
      texts: page.texts.map(IntermediateText.serialize),
      width: page.width,
      height: page.height,
      number: page.number,
      // 序列化时仅保留已有的静态缩略图（如果存在）
      thumbnail: page._thumbnail
    }
  }
  static parse(data: IntermediatePageSerialized): IntermediatePage {
    return new IntermediatePage(data)
  }
  constructor({
    texts,
    width,
    height,
    number,
    id,
    thumbnail,
    getThumbnailFn,
    getTextsFn
  }: Omit<IntermediatePageSerialized, 'texts'> & {
    texts: IntermediateText[] | IntermediateTextSerialized[]
  } & {
    getThumbnailFn?: (scale: number) => Promise<string | undefined>
    getTextsFn?: () => TextsGetterReturnType
  }) {
    this.id = id
    this.texts = (
      texts as (IntermediateText | IntermediateTextSerialized)[]
    ).map((t) => (t instanceof IntermediateText ? t : new IntermediateText(t)))
    this.width = width
    this.height = height
    this.number = number
    this._thumbnail = thumbnail
    if (getThumbnailFn) this._getThumbnailFn = getThumbnailFn
    if (getTextsFn) this._getTextsFn = getTextsFn
    this.textsLoaded = !getTextsFn
  }
  // 获取缩略图，按需渲染
  async getThumbnail(scale = 1): Promise<string | undefined> {
    if (this._getThumbnailFn) return this._getThumbnailFn(scale)
    return this._thumbnail
  }
  // 获取文本，按需获取
  async getTexts(): Promise<IntermediateText[]> {
    if (this._getTextsFn) {
      const data = await this._getTextsFn()
      const mapped = (
        data as (IntermediateText | IntermediateTextSerialized)[]
      ).map((t) =>
        t instanceof IntermediateText ? t : new IntermediateText(t)
      )
      this.texts = mapped
      this.textsLoaded = true
      // 懒加载完成后去掉取数函数，避免重复请求
      this._getTextsFn = undefined
    }
    return this.texts
  }
  // 判断文本是否已加载（便于调用方做缓存判断）
  get hasLoadedTexts(): boolean {
    return this.textsLoaded
  }
  // 提供一个方法以注入按需生成缩略图的函数
  setGetThumbnail(fn: (scale: number) => Promise<string | undefined>) {
    this._getThumbnailFn = fn
  }
  // 提供一个方法以注入按需获取文本的函数
  setGetTexts(fn: () => TextsGetterReturnType) {
    this._getTextsFn = fn
  }
}
