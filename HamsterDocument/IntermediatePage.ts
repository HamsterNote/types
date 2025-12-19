import {
  IntermediateText,
  IntermediateTextSerialized
} from '@typesCommon/HamsterDocument/IntermediateText'

export interface IntermediatePageSerialized {
  id: string
  texts: IntermediateTextSerialized[]
  width: number
  height: number
  number: number
  // 缩略图，背景图
  thumbnail: string | undefined
}

export class IntermediatePage {
  public id: string
  public texts: IntermediateText[]
  public width: number
  public height: number
  public number: number
  private _thumbnail?: string
  private _getThumbnailFn?: (scale: number) => Promise<string | undefined>
  private _getTextsFn?: () =>
    | Promise<IntermediateText[] | IntermediateTextSerialized[]>
    | IntermediateText[]
    | IntermediateTextSerialized[]
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
    getTextsFn?: () =>
      | Promise<IntermediateText[] | IntermediateTextSerialized[]>
      | IntermediateText[]
      | IntermediateTextSerialized[]
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
    }
    return this.texts
  }
  // 提供一个方法以注入按需生成缩略图的函数
  setGetThumbnail(fn: (scale: number) => Promise<string | undefined>) {
    this._getThumbnailFn = fn
  }
  // 提供一个方法以注入按需获取文本的函数
  setGetTexts(
    fn: () =>
      | Promise<IntermediateText[] | IntermediateTextSerialized[]>
      | IntermediateText[]
      | IntermediateTextSerialized[]
  ) {
    this._getTextsFn = fn
  }
}
