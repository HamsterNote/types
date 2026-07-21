import {
  IntermediateText,
  type IntermediateTextSerialized
} from './IntermediateText'

export enum IntermediateOutlineDestType {
  TEXT = 'text',
  PAGE = 'page',
  POSITION = 'position',
  URL = 'url'
}

export type IntermediateOutlineDest =
  | IntermediateOutlineDestPage
  | IntermediateOutlineDestText
  | IntermediateOutlineDestPosition
  | IntermediateOutlineDestUrl

export interface IntermediateOutlineDestUrl {
  targetType: IntermediateOutlineDestType.URL
  url: string
  unsafeUrl: string | undefined
  newWindow: boolean
  items?: IntermediateOutlineDest[]
}

export interface IntermediateOutlineDestPage {
  targetType: IntermediateOutlineDestType.PAGE
  pageId: string
  items?: IntermediateOutlineDest[]
}

export interface IntermediateOutlineDestText {
  targetType: IntermediateOutlineDestType.TEXT
  textId: string
  items?: IntermediateOutlineDest[]
}

export interface IntermediateOutlineDestPosition {
  targetType: IntermediateOutlineDestType.POSITION
  items?: IntermediateOutlineDest[]
}

/**
 * 校验并复制目录/链接跳转目标。
 *
 * 这些数据通常来自 JSON 或 JavaScript，运行时未必遵守 TypeScript 联合类型；
 * 因此在进入中间态模型时需要按 targetType 逐项解析，并递归处理子目标。
 */
export function normalizeOutlineDest(
  dest: IntermediateOutlineDest
): IntermediateOutlineDest {
  if (typeof dest !== 'object' || dest === null) {
    throw new TypeError('跳转目标必须是对象')
  }

  const normalizeItems = (
    items: IntermediateOutlineDest[] | undefined
  ): IntermediateOutlineDest[] | undefined => {
    if (items === undefined) {
      return undefined
    }
    if (!Array.isArray(items)) {
      throw new TypeError('跳转目标 items 必须是数组')
    }
    return items.map(normalizeOutlineDest)
  }

  const items = normalizeItems(dest.items)
  switch (dest.targetType) {
    case IntermediateOutlineDestType.PAGE:
      if (typeof dest.pageId !== 'string' || dest.pageId.length === 0) {
        throw new TypeError('page 跳转目标必须包含非空 pageId')
      }
      return {
        targetType: IntermediateOutlineDestType.PAGE,
        pageId: dest.pageId,
        ...(items === undefined ? {} : { items })
      }
    case IntermediateOutlineDestType.TEXT:
      if (typeof dest.textId !== 'string' || dest.textId.length === 0) {
        throw new TypeError('text 跳转目标必须包含非空 textId')
      }
      return {
        targetType: IntermediateOutlineDestType.TEXT,
        textId: dest.textId,
        ...(items === undefined ? {} : { items })
      }
    case IntermediateOutlineDestType.POSITION:
      return {
        targetType: IntermediateOutlineDestType.POSITION,
        ...(items === undefined ? {} : { items })
      }
    case IntermediateOutlineDestType.URL:
      if (typeof dest.url !== 'string' || dest.url.length === 0) {
        throw new TypeError('url 跳转目标必须包含非空 url')
      }
      if (
        dest.unsafeUrl !== undefined &&
        typeof dest.unsafeUrl !== 'string'
      ) {
        throw new TypeError('url 跳转目标 unsafeUrl 必须是字符串或 undefined')
      }
      if (typeof dest.newWindow !== 'boolean') {
        throw new TypeError('url 跳转目标 newWindow 必须是布尔值')
      }
      return {
        targetType: IntermediateOutlineDestType.URL,
        url: dest.url,
        unsafeUrl: dest.unsafeUrl,
        newWindow: dest.newWindow,
        ...(items === undefined ? {} : { items })
      }
    default:
      throw new TypeError(
        '跳转目标 targetType 必须是 text、page、position 或 url'
      )
  }
}

export interface IntermediateOutlineSerialized extends IntermediateTextSerialized {
  dest: IntermediateOutlineDest
}

export class IntermediateOutline
  extends IntermediateText
  implements IntermediateOutlineSerialized
{
  public dest: IntermediateOutlineDest
  static serialize(
    outline: IntermediateOutline
  ): IntermediateOutlineSerialized {
    return {
      ...IntermediateText.serialize(outline),
      dest: normalizeOutlineDest(outline.dest)
    }
  }
  static parse(data: IntermediateOutlineSerialized): IntermediateOutline {
    return new IntermediateOutline(data)
  }
  constructor(data: IntermediateOutlineSerialized) {
    const { dest, ...textData } = data
    super(textData)
    this.dest = normalizeOutlineDest(dest)
  }
}
