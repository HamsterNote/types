// IntermediateImage - 中间态图片表示

// 图片裁切区域（矩形）
export interface IntermediateImageClip {
  x: number
  y: number
  width: number
  height: number
}

// 图片多边形点类型，同 IntermediateTextPolygonPoint
export type IntermediateImagePolygonPoint = [number, number]

// 图片多边形类型，包含 4 个点的元组
export type IntermediateImagePolygon = [
  IntermediateImagePolygonPoint,
  IntermediateImagePolygonPoint,
  IntermediateImagePolygonPoint,
  IntermediateImagePolygonPoint
]

function isFiniteCoordinate(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

function parsePolygonPoint(
  point: unknown,
  index: number
): IntermediateImagePolygonPoint {
  if (!Array.isArray(point) || point.length !== 2) {
    throw new TypeError(`polygon[${index}] 必须是 [number, number]`)
  }
  const [x, y] = point
  if (!isFiniteCoordinate(x) || !isFiniteCoordinate(y)) {
    throw new TypeError(`polygon[${index}] 必须包含两个有限数值坐标`)
  }
  return [x, y]
}

function normalizePolygon(polygon: unknown): IntermediateImagePolygon {
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

export interface IntermediateImageSerialized {
  id: string
  // 图片源，可以是 URL 或 base64
  src: string
  // 图片的四边形顶点坐标
  polygon: IntermediateImagePolygon
  // 透明度，0-1 之间，1 表示完全不透明，默认 1
  opacity: number
  // 裁切路径，定义从原图中裁切的区域
  clip?: IntermediateImageClip
}

export class IntermediateImage implements IntermediateImageSerialized {
  public id: string
  public src: string
  public polygon: IntermediateImagePolygon
  public opacity: number
  public clip?: IntermediateImageClip

  static serialize(image: IntermediateImage): IntermediateImageSerialized {
    return {
      id: image.id,
      src: image.src,
      polygon: normalizePolygon(image.polygon),
      opacity: image.opacity,
      clip: image.clip
    }
  }

  static parse(data: IntermediateImageSerialized): IntermediateImage {
    return new IntermediateImage(data)
  }

  constructor({
    id,
    src,
    polygon,
    opacity = 1,
    clip
  }: IntermediateImageSerialized) {
    this.id = id
    this.src = src
    this.polygon = normalizePolygon(polygon)
    this.opacity = opacity
    this.clip = clip
  }
}
