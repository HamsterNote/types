// IntermediateAnnotation - 通用标注中间态
// 通过「锚点（在哪里）+ 类型（是什么）+ 载荷（颜色/笔记/跳转目标等）」的组合，
// 同时覆盖高亮、笔记、链接（如 [1] 引用、可点击目录）、书签等场景

import {
  normalizePolygon,
  type Polygon
} from '../utils/polygon'
import type { IntermediateOutlineDest } from './IntermediateOutline'

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

// 文本锚点：指向某个 IntermediateText 内的字符偏移
export interface IntermediateAnnotationTextPoint {
  // 所属页 id（EPUB 中即 spine item 映射的页）
  pageId: string
  // IntermediateText.id，id 稳定时优先按它匹配
  textId?: string
  // 字符偏移
  charIndex: number
  // 失锚回退链（可选）：id 匹配失败时按 文本哈希 + 上下文 重新定位
  textHash?: string
  contextBefore?: string
  contextAfter?: string
}

// 文本区间锚点：高亮、笔记、[1] 引用这类「选中一段文字」的标注
export interface IntermediateAnnotationTextAnchor {
  kind: 'text'
  start: IntermediateAnnotationTextPoint
  // start 与 end 相同（折叠）时表示光标/书签位置
  end: IntermediateAnnotationTextPoint
}

// 几何区域锚点：PDF 链接矩形、框选区域这类「页面上的一块区域」
export interface IntermediateAnnotationRegionAnchor {
  kind: 'region'
  pageId: string
  // 页内多边形区域；多个四边形表示跨行 quads
  polygons: Polygon[]
}

export type IntermediateAnnotationAnchor =
  | IntermediateAnnotationTextAnchor
  | IntermediateAnnotationRegionAnchor

// 判断锚点是否为文本区间锚点
export function isTextAnchor(
  anchor: IntermediateAnnotationAnchor
): anchor is IntermediateAnnotationTextAnchor {
  return anchor.kind === 'text'
}

// 判断锚点是否为几何区域锚点
export function isRegionAnchor(
  anchor: IntermediateAnnotationAnchor
): anchor is IntermediateAnnotationRegionAnchor {
  return anchor.kind === 'region'
}

export interface IntermediateAnnotationSerialized {
  id: string
  type: IntermediateAnnotationType
  anchor: IntermediateAnnotationAnchor
  // 摘录原文快照（标注时的文本，便于展示与失锚排查）
  text?: string
  // 用户笔记内容
  note?: string
  // 颜色，格式同 IntermediateText.color
  color?: string
  // LINK 类型的跳转目标，复用大纲 dest（page/text/position/url）
  dest?: IntermediateOutlineDest
  // EPUB CFI 原样透传（可选，面向 epub 生态互通）
  cfiRange?: string
  // 标注作者
  author?: string
  // 创建时间，ISO 8601 字符串
  createdAt?: string
  // 最后修改时间，ISO 8601 字符串
  updatedAt?: string
}

// 校验并拷贝文本锚点，拒绝缺 pageId 或 charIndex 非法的输入
function normalizeTextPoint(
  point: IntermediateAnnotationTextPoint
): IntermediateAnnotationTextPoint {
  if (!point || typeof point.pageId !== 'string' || point.pageId.length === 0) {
    throw new TypeError('标注锚点 pageId 必须是非空字符串')
  }
  if (typeof point.charIndex !== 'number' || !Number.isFinite(point.charIndex) || point.charIndex < 0) {
    throw new TypeError('标注锚点 charIndex 必须是大于等于 0 的有限数值')
  }
  return {
    pageId: point.pageId,
    textId: point.textId,
    charIndex: point.charIndex,
    textHash: point.textHash,
    contextBefore: point.contextBefore,
    contextAfter: point.contextAfter
  }
}

// 校验并归一化锚点，polygon 校验复用 normalizePolygon 的错误信息
function normalizeAnchor(
  anchor: IntermediateAnnotationAnchor
): IntermediateAnnotationAnchor {
  if (!anchor || (anchor.kind !== 'text' && anchor.kind !== 'region')) {
    throw new TypeError('标注锚点 kind 必须是 text 或 region')
  }
  if (anchor.kind === 'text') {
    return {
      kind: 'text',
      start: normalizeTextPoint(anchor.start),
      end: normalizeTextPoint(anchor.end)
    }
  }
  if (!Array.isArray(anchor.polygons) || anchor.polygons.length === 0) {
    throw new TypeError('标注区域锚点 polygons 必须包含至少一个多边形')
  }
  return {
    kind: 'region',
    pageId: anchor.pageId,
    polygons: anchor.polygons.map((polygon) => normalizePolygon(polygon))
  }
}

export class IntermediateAnnotation
  implements IntermediateAnnotationSerialized
{
  public id: string
  public type: IntermediateAnnotationType
  public anchor: IntermediateAnnotationAnchor
  public text?: string
  public note?: string
  public color?: string
  public dest?: IntermediateOutlineDest
  public cfiRange?: string
  public author?: string
  public createdAt?: string
  public updatedAt?: string

  static serialize(
    annotation: IntermediateAnnotation
  ): IntermediateAnnotationSerialized {
    return {
      id: annotation.id,
      type: annotation.type,
      anchor: normalizeAnchor(annotation.anchor),
      text: annotation.text,
      note: annotation.note,
      color: annotation.color,
      dest: annotation.dest,
      cfiRange: annotation.cfiRange,
      author: annotation.author,
      createdAt: annotation.createdAt,
      updatedAt: annotation.updatedAt
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
    author,
    createdAt,
    updatedAt
  }: IntermediateAnnotationSerialized) {
    this.id = id
    this.type = type
    // 构造时即归一化锚点，保证实例内数据始终合法
    this.anchor = normalizeAnchor(anchor)
    this.text = text
    this.note = note
    this.color = color
    this.dest = dest
    this.cfiRange = cfiRange
    this.author = author
    this.createdAt = createdAt
    this.updatedAt = updatedAt
  }
}
