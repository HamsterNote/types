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

export class IntermediatePage implements IntermediatePageSerialized {
  public id: string
  public texts: IntermediateText[]
  public width: number
  public height: number
  public number: number
  public thumbnail: string | undefined
  static serialize(page: IntermediatePage): IntermediatePageSerialized {
    return {
      id: page.id,
      texts: page.texts.map(IntermediateText.serialize),
      width: page.width,
      height: page.height,
      number: page.number,
      thumbnail: page.thumbnail
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
    thumbnail
  }: Omit<IntermediatePageSerialized, 'texts'> & {
    texts: IntermediateText[]
  }) {
    this.id = id
    this.texts = texts
    this.width = width
    this.height = height
    this.number = number
    this.thumbnail = thumbnail
  }
}
