export enum TextDir {
  TTB = 'ttb',
  LTR = 'ltr',
  RTL = 'rtl'
}

export type IntermediateTextPolygonPoint = [number, number]

export type IntermediateTextPolygon = [
  IntermediateTextPolygonPoint,
  IntermediateTextPolygonPoint,
  IntermediateTextPolygonPoint,
  IntermediateTextPolygonPoint
]

function isFiniteCoordinate(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

function parsePolygonPoint(
  point: unknown,
  index: number
): IntermediateTextPolygonPoint {
  if (!Array.isArray(point) || point.length !== 2) {
    throw new TypeError(`polygon[${index}] 必须是 [number, number]`)
  }
  const [x, y] = point
  if (!isFiniteCoordinate(x) || !isFiniteCoordinate(y)) {
    throw new TypeError(`polygon[${index}] 必须包含两个有限数值坐标`)
  }
  return [x, y]
}

function normalizePolygon(polygon: unknown): IntermediateTextPolygon {
  if (!Array.isArray(polygon) || polygon.length !== 4) {
    throw new TypeError('polygon 必须包含且仅包含 4 个点')
  }
  return [
    parsePolygonPoint(polygon[0], 0),
    parsePolygonPoint(polygon[1], 1),
    parsePolygonPoint(polygon[2], 2),
    parsePolygonPoint(polygon[3], 3)
  ]
}

export interface IntermediateTextSerialized {
  id: string
  // 文字内容
  content: string
  // 字体大小，大于等于 1 的按 px 计算，小于 1 的按 em  计算
  fontSize: number
  // 字体，字体具体需要用户下载，这里只定义字体名称
  fontFamily: string
  // 字重，默认 500
  fontWeight: number
  // 是否斜体
  italic: boolean
  // 字体颜色
  color: string
  // 文本区域的四边形顶点，polygon[0] -> polygon[1] 表示文本方向
  polygon: IntermediateTextPolygon
  // 行高
  lineHeight: number
  // 字体 baseline
  ascent: number
  // 字体 descent
  descent: number
  // 垂直文字
  vertical?: boolean
  // 文字方向
  dir: TextDir
  // 倾斜
  skew: number
  // 是否是行末
  isEOL: boolean
}

export class IntermediateText implements IntermediateTextSerialized {
  public id: string
  public content: string
  public fontSize: number
  public fontFamily: string
  public fontWeight: number
  public italic: boolean
  public color: string
  public polygon: IntermediateTextPolygon
  public lineHeight: number
  public ascent: number
  public descent: number
  public vertical?: boolean
  public dir: TextDir
  public skew: number
  public isEOL: boolean
  static serialize(text: IntermediateText): IntermediateTextSerialized {
    return {
      id: text.id,
      content: text.content,
      fontSize: text.fontSize,
      fontFamily: text.fontFamily,
      fontWeight: text.fontWeight,
      italic: text.italic,
      color: text.color,
      polygon: normalizePolygon(text.polygon),
      lineHeight: text.lineHeight,
      ascent: text.ascent,
      descent: text.descent,
      vertical: text.vertical,
      dir: text.dir,
      skew: text.skew,
      isEOL: text.isEOL
    }
  }
  static parse(data: IntermediateTextSerialized): IntermediateText {
    return new IntermediateText(data)
  }
  constructor({
    id,
    content,
    fontSize,
    fontFamily,
    fontWeight,
    italic,
    color,
    polygon,
    lineHeight,
    ascent,
    descent,
    vertical,
    dir,
    skew,
    isEOL
  }: IntermediateTextSerialized) {
    this.id = id
    this.content = content
    this.fontSize = fontSize
    this.fontFamily = fontFamily
    this.fontWeight = fontWeight
    this.italic = italic
    this.color = color
    this.polygon = normalizePolygon(polygon)
    this.lineHeight = lineHeight
    this.ascent = ascent
    this.descent = descent
    this.vertical = vertical
    this.dir = dir
    this.skew = skew
    this.isEOL = isEOL
  }
}

export enum TextMarkedContentType {
  BEGIN_MARKED_CONTENT = 'beginMarkedContent',
  BEGIN_MARKED_CONTENT_PROPS = 'beginMarkedContentProps',
  END_MARKED_CONTENT = 'endMarkedContent'
}

export class IntermediateTextMarkedContent extends IntermediateText {
  // 这两个值参见 pdfjs 的 TextMarkedContent 类型
  constructor(
    data: IntermediateTextSerialized,
    protected type: TextMarkedContentType,
    protected markedContentId: string
  ) {
    super(data)
  }
}
