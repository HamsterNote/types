export const IntermediateTextAlign = {
  START: 'start',
  END: 'end',
  LEFT: 'left',
  RIGHT: 'right',
  CENTER: 'center',
  JUSTIFY: 'justify'
} as const

export type IntermediateTextAlign =
  typeof IntermediateTextAlign[keyof typeof IntermediateTextAlign]

export interface IntermediateParagraphSerialized {
  id: string
  x: number
  y: number
  width: number
  height: number
  textIds: string[]
  // 段落级语义对齐；x/y/width/height 仍描述布局容器几何位置
  textAlign?: IntermediateTextAlign
}

function normalizeTextAlign(
  textAlign: IntermediateTextAlign | undefined
): IntermediateTextAlign | undefined {
  switch (textAlign) {
    case undefined:
    case IntermediateTextAlign.START:
    case IntermediateTextAlign.END:
    case IntermediateTextAlign.LEFT:
    case IntermediateTextAlign.RIGHT:
    case IntermediateTextAlign.CENTER:
    case IntermediateTextAlign.JUSTIFY:
      return textAlign
    default:
      throw new TypeError(
        'textAlign 必须是 start、end、left、right、center、justify 或 undefined'
      )
  }
}

export class IntermediateParagraph implements IntermediateParagraphSerialized {
  public id: string
  public x: number
  public y: number
  public width: number
  public height: number
  public textIds: string[]
  public textAlign?: IntermediateTextAlign

  static serialize(
    paragraph: IntermediateParagraph
  ): IntermediateParagraphSerialized {
    return {
      id: paragraph.id,
      x: paragraph.x,
      y: paragraph.y,
      width: paragraph.width,
      height: paragraph.height,
      textIds: [...paragraph.textIds],
      textAlign: normalizeTextAlign(paragraph.textAlign)
    }
  }

  static parse(
    data: IntermediateParagraphSerialized
  ): IntermediateParagraph {
    return new IntermediateParagraph(data)
  }

  constructor({
    id,
    x,
    y,
    width,
    height,
    textIds,
    textAlign
  }: IntermediateParagraphSerialized) {
    this.id = id
    this.x = x
    this.y = y
    this.width = width
    this.height = height
    this.textIds = [...textIds]
    this.textAlign = normalizeTextAlign(textAlign)
  }
}
