// IntermediateImage - 中间态图片表示

import {
  normalizePolygon,
  type Polygon
} from '../utils/polygon'


// 图片裁切区域（矩形）
export interface IntermediateImageClip {
  x: number
  y: number
  width: number
  height: number
}

// 图片多边形类型，复用公共类型定义
export type IntermediateImagePolygon = Polygon

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
