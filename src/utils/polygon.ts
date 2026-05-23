/**
 * 多边形验证工具函数
 * 用于验证和解析四边形多边形的顶点坐标
 */

// 多边形点类型，表示 [x, y] 坐标
export type PolygonPoint = [number, number]

// 四边形多边形类型，包含 4 个点的元组
export type Polygon = [
  PolygonPoint,
  PolygonPoint,
  PolygonPoint,
  PolygonPoint
]

/**
 * 检查值是否为有限数值
 * @param value - 待检查的值
 * @returns 是否为有限数值
 */
export function isFiniteCoordinate(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

/**
 * 解析多边形顶点
 * @param point - 待解析的点数据
 * @param index - 点在多边形中的索引
 * @returns 解析后的 PolygonPoint
 * @throws TypeError 如果数据格式不正确
 */
export function parsePolygonPoint(
  point: unknown,
  index: number
): PolygonPoint {
  if (!Array.isArray(point) || point.length !== 2) {
    throw new TypeError(`polygon[${index}] 必须是 [number, number]`)
  }
  const [x, y] = point
  if (!isFiniteCoordinate(x) || !isFiniteCoordinate(y)) {
    throw new TypeError(`polygon[${index}] 必须包含两个有限数值坐标`)
  }
  return [x, y]
}

/**
 * 解析并验证四边形多边形
 * @param polygon - 待解析的多边形数据
 * @returns 解析后的 Polygon
 * @throws TypeError 如果数据格式不正确
 */
export function normalizePolygon(polygon: unknown): Polygon {
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
