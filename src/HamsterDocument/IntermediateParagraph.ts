export interface IntermediateParagraphSerialized {
  id: string
  x: number
  y: number
  width: number
  height: number
  textIds: string[]
}

export class IntermediateParagraph implements IntermediateParagraphSerialized {
  public id: string
  public x: number
  public y: number
  public width: number
  public height: number
  public textIds: string[]

  static serialize(
    paragraph: IntermediateParagraph
  ): IntermediateParagraphSerialized {
    return {
      id: paragraph.id,
      x: paragraph.x,
      y: paragraph.y,
      width: paragraph.width,
      height: paragraph.height,
      textIds: [...paragraph.textIds]
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
    textIds
  }: IntermediateParagraphSerialized) {
    this.id = id
    this.x = x
    this.y = y
    this.width = width
    this.height = height
    this.textIds = [...textIds]
  }
}
