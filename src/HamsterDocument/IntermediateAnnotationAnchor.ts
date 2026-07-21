import {
  normalizePolygon,
  type Polygon
} from '../utils/polygon'

// 文本锚点：指向某个 IntermediateText 内的字符偏移
export interface IntermediateAnnotationTextPoint {
  // 所属页 id（EPUB 中即 spine item 映射的页）
  pageId: string
  // IntermediateText.id，id 稳定时优先按它匹配
  textId?: string
  // 字符偏移
  charIndex: number
  // 失锚回退链（可选）：id 匹配失败时按文本哈希与上下文重新定位
  textHash?: string
  contextBefore?: string
  contextAfter?: string
}

// 文本区间锚点：高亮、笔记、[1] 引用这类「选中一段文字」的标注
export interface IntermediateAnnotationTextAnchor {
  kind: 'text'
  start: IntermediateAnnotationTextPoint
  // start 与 end 相同（折叠）时表示光标或书签位置
  end: IntermediateAnnotationTextPoint
}

// 几何区域锚点：PDF 链接矩形、框选区域这类「页面上的一块区域」
export interface IntermediateAnnotationRegionAnchor {
  kind: 'region'
  pageId: string
  // 页内多边形区域；多个四边形表示跨行 quads
  polygons: Polygon[]
}

// 页面锚点：用于不依赖具体文本位置的整页书签或页面级笔记
export interface IntermediateAnnotationPageAnchor {
  kind: 'page'
  pageId: string
}

export type IntermediateAnnotationAnchor =
  | IntermediateAnnotationTextAnchor
  | IntermediateAnnotationRegionAnchor
  | IntermediateAnnotationPageAnchor

// EPUB 等源文档中的稳定位置；在中间态 id 失效时可用于重新定位
export interface IntermediateAnnotationSourceLocation {
  href: string
  fragment?: string
}

export function isTextAnchor(
  anchor: IntermediateAnnotationAnchor
): anchor is IntermediateAnnotationTextAnchor {
  return anchor.kind === 'text'
}

export function isRegionAnchor(
  anchor: IntermediateAnnotationAnchor
): anchor is IntermediateAnnotationRegionAnchor {
  return anchor.kind === 'region'
}

export function isPageAnchor(
  anchor: IntermediateAnnotationAnchor
): anchor is IntermediateAnnotationPageAnchor {
  return anchor.kind === 'page'
}

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
export function normalizeAnnotationAnchor(
  anchor: IntermediateAnnotationAnchor
): IntermediateAnnotationAnchor {
  if (!anchor || !['text', 'region', 'page'].includes(anchor.kind)) {
    throw new TypeError('标注锚点 kind 必须是 text、region 或 page')
  }
  switch (anchor.kind) {
    case 'text':
      return {
        kind: 'text',
        start: normalizeTextPoint(anchor.start),
        end: normalizeTextPoint(anchor.end)
      }
    case 'page':
      if (typeof anchor.pageId !== 'string' || anchor.pageId.length === 0) {
        throw new TypeError('标注锚点 pageId 必须是非空字符串')
      }
      return {
        kind: 'page',
        pageId: anchor.pageId
      }
    case 'region':
      if (typeof anchor.pageId !== 'string' || anchor.pageId.length === 0) {
        throw new TypeError('标注锚点 pageId 必须是非空字符串')
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
}

export function normalizeAnnotationSourceLocation(
  source: IntermediateAnnotationSourceLocation | undefined
): IntermediateAnnotationSourceLocation | undefined {
  if (source === undefined) return undefined
  if (typeof source !== 'object' || source === null) {
    throw new TypeError('标注源位置必须是对象')
  }
  if (typeof source.href !== 'string' || source.href.length === 0) {
    throw new TypeError('标注源位置 href 必须是非空字符串')
  }
  if (source.fragment !== undefined && typeof source.fragment !== 'string') {
    throw new TypeError('标注源位置 fragment 必须是字符串或 undefined')
  }
  return {
    href: source.href,
    fragment: source.fragment
  }
}
