// IntermediateAnnotation - 通用标注中间态
// 通过「锚点（在哪里）+ 类型（是什么）+ 载荷（颜色/笔记/跳转目标等）」的组合，
// 同时覆盖高亮、笔记、链接（如 [1] 引用、可点击目录）、书签等场景

import {
  type IntermediateAnnotationAnchor,
  type IntermediateAnnotationPageAnchor,
  type IntermediateAnnotationRegionAnchor,
  type IntermediateAnnotationSourceLocation,
  type IntermediateAnnotationTextAnchor,
  type IntermediateAnnotationTextPoint,
  isPageAnchor,
  isRegionAnchor,
  isTextAnchor,
  normalizeAnnotationAnchor,
  normalizeAnnotationSourceLocation
} from './IntermediateAnnotationAnchor'
import type { IntermediateOutlineDest } from './IntermediateOutline'

export {
  type IntermediateAnnotationAnchor,
  type IntermediateAnnotationPageAnchor,
  type IntermediateAnnotationRegionAnchor,
  type IntermediateAnnotationSourceLocation,
  type IntermediateAnnotationTextAnchor,
  type IntermediateAnnotationTextPoint,
  isPageAnchor,
  isRegionAnchor,
  isTextAnchor
}

// 标注类型枚举
export enum IntermediateAnnotationType {
  // 高亮
  HIGHLIGHT = 'highlight',
  // 下划线
  UNDERLINE = 'underline',
  // 波浪线
  SQUIGGLY = 'squiggly',
  // 删除线
  STRIKEOUT = 'strikeout',
  // 笔记/评论
  NOTE = 'note',
  // 链接：页内引用（如 [1]）、可点击目录、外部 URL 跳转
  LINK = 'link',
  // 书签（折叠 text 锚点表示，start == end）
  BOOKMARK = 'bookmark'
}

interface IntermediateAnnotationCommonSerialized {
  id: string
  anchor: IntermediateAnnotationAnchor
  // 摘录原文快照（标注时的文本，便于展示与失锚排查）
  text?: string
  // 颜色，格式同 IntermediateText.color
  color?: string
  // EPUB CFI 原样透传（可选，面向 epub 生态互通）
  cfiRange?: string
  // 源文档位置；EPUB 通常使用 spine item href 与可选 fragment
  source?: IntermediateAnnotationSourceLocation
  // 标注作者
  author?: string
  // 创建时间，ISO 8601 字符串
  createdAt?: string
  // 最后修改时间，ISO 8601 字符串
  updatedAt?: string
}

export type IntermediateAnnotationSerialized =
  | (IntermediateAnnotationCommonSerialized & {
      type: Exclude<
        IntermediateAnnotationType,
        IntermediateAnnotationType.NOTE | IntermediateAnnotationType.LINK
      >
      note?: string
      dest?: IntermediateOutlineDest
    })
  | (IntermediateAnnotationCommonSerialized & {
      type: IntermediateAnnotationType.NOTE
      // NOTE 类型必须携带用户笔记内容
      note: string
      dest?: IntermediateOutlineDest
    })
  | (IntermediateAnnotationCommonSerialized & {
      type: IntermediateAnnotationType.LINK
      note?: string
      // LINK 类型必须携带跳转目标
      dest: IntermediateOutlineDest
    })

function normalizeAnnotationType(
  type: IntermediateAnnotationType
): IntermediateAnnotationType {
  switch (type) {
    case IntermediateAnnotationType.HIGHLIGHT:
    case IntermediateAnnotationType.UNDERLINE:
    case IntermediateAnnotationType.SQUIGGLY:
    case IntermediateAnnotationType.STRIKEOUT:
    case IntermediateAnnotationType.NOTE:
    case IntermediateAnnotationType.LINK:
    case IntermediateAnnotationType.BOOKMARK:
      return type
    default:
      throw new TypeError(
        '标注类型必须是 highlight、underline、squiggly、strikeout、note、link 或 bookmark'
      )
  }
}

export class IntermediateAnnotation {
  public id: string
  public type: IntermediateAnnotationType
  public anchor: IntermediateAnnotationAnchor
  public text?: string
  public note?: string
  public color?: string
  public dest?: IntermediateOutlineDest
  public cfiRange?: string
  public source?: IntermediateAnnotationSourceLocation
  public author?: string
  public createdAt?: string
  public updatedAt?: string

  static serialize(
    annotation: IntermediateAnnotation
  ): IntermediateAnnotationSerialized {
    const type = normalizeAnnotationType(annotation.type)
    const anchor = normalizeAnnotationAnchor(annotation.anchor)
    const source = normalizeAnnotationSourceLocation(annotation.source)
    switch (type) {
      case IntermediateAnnotationType.NOTE:
        if (typeof annotation.note !== 'string') {
          throw new TypeError('NOTE 类型标注必须包含 note')
        }
        return {
          id: annotation.id,
          type: IntermediateAnnotationType.NOTE,
          anchor,
          text: annotation.text,
          note: annotation.note,
          color: annotation.color,
          dest: annotation.dest,
          cfiRange: annotation.cfiRange,
          source,
          author: annotation.author,
          createdAt: annotation.createdAt,
          updatedAt: annotation.updatedAt
        }
      case IntermediateAnnotationType.LINK:
        if (!annotation.dest) {
          throw new TypeError('LINK 类型标注必须包含 dest')
        }
        return {
          id: annotation.id,
          type: IntermediateAnnotationType.LINK,
          anchor,
          text: annotation.text,
          note: annotation.note,
          color: annotation.color,
          dest: annotation.dest,
          cfiRange: annotation.cfiRange,
          source,
          author: annotation.author,
          createdAt: annotation.createdAt,
          updatedAt: annotation.updatedAt
        }
      case IntermediateAnnotationType.HIGHLIGHT:
      case IntermediateAnnotationType.UNDERLINE:
      case IntermediateAnnotationType.SQUIGGLY:
      case IntermediateAnnotationType.STRIKEOUT:
      case IntermediateAnnotationType.BOOKMARK:
        return {
          id: annotation.id,
          type,
          anchor,
          text: annotation.text,
          note: annotation.note,
          color: annotation.color,
          dest: annotation.dest,
          cfiRange: annotation.cfiRange,
          source,
          author: annotation.author,
          createdAt: annotation.createdAt,
          updatedAt: annotation.updatedAt
        }
    }
  }

  static parse(data: IntermediateAnnotationSerialized): IntermediateAnnotation {
    return new IntermediateAnnotation(data)
  }

  constructor({
    id,
    type,
    anchor,
    text,
    note,
    color,
    dest,
    cfiRange,
    source,
    author,
    createdAt,
    updatedAt
  }: IntermediateAnnotationSerialized) {
    this.id = id
    this.type = normalizeAnnotationType(type)
    // 构造时即归一化锚点，保证实例内数据始终合法
    this.anchor = normalizeAnnotationAnchor(anchor)
    if (
      this.type === IntermediateAnnotationType.NOTE &&
      typeof note !== 'string'
    ) {
      throw new TypeError('NOTE 类型标注必须包含 note')
    }
    if (this.type === IntermediateAnnotationType.LINK && !dest) {
      throw new TypeError('LINK 类型标注必须包含 dest')
    }
    this.text = text
    this.note = note
    this.color = color
    this.dest = dest
    this.cfiRange = cfiRange
    this.source = normalizeAnnotationSourceLocation(source)
    this.author = author
    this.createdAt = createdAt
    this.updatedAt = updatedAt
  }
}
