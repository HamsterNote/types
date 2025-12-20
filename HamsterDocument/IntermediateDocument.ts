import {
  IntermediatePage,
  IntermediatePageSerialized
} from './IntermediatePage'
import {
  IntermediateOutline,
  IntermediateOutlineSerialized
} from './IntermediateOutline'
import { Number2 } from '@math'

export interface IntermediateDocumentSerialized {
  id: string
  pages: IntermediatePageSerialized[]
  title: string
  // 文档大纲（可选）
  outline?: IntermediateOutlineSerialized[]
}

type getPage = () => Promise<IntermediatePage>

// ! 用来懒加载 Pages
export class IntermediatePageMap {
  // ! 缓存 Promise
  private cacheMapById: Map<string, ReturnType<getPage>> = new Map()
  // ! 缓存 Promise
  private cacheMapByPageNumber: Map<number, ReturnType<getPage>> = new Map()
  constructor(
    private mapById: Map<string, getPage>,
    private mapByPageNumber: Map<number, getPage>,
    private sizeMapByPageNumber: Map<number, Number2>
  ) {
    return
  }
  // 按顺序从第一页开始
  async getPages(): Promise<IntermediatePage[]> {
    const result: IntermediatePage[] = []
    for (const pageId of this.mapById.keys()) {
      // ? 从 this.getPageById 拿是因为会过一遍缓存
      const getPage = this.getPageById(pageId)
      if (getPage) {
        const page = await getPage()
        result[page.number - 1] = page
      }
    }
    return result
  }
  updatePage(page: IntermediatePage) {
    const newPromise = Promise.resolve(page)
    const newGetPage = () => newPromise
    this.cacheMapById.set(page.id, newPromise)
    this.cacheMapByPageNumber.set(page.number, newPromise)
    this.mapById.set(page.id, newGetPage)
    this.mapByPageNumber.set(page.number, newGetPage)
    this.sizeMapByPageNumber.set(page.number, {
      x: page.width,
      y: page.height
    })
  }
  // & 从序列化的数据生成类
  static makeBySerializedData(pages: IntermediatePageSerialized[]) {
    const mapById: IntermediatePageMap['mapById'] = new Map()
    const mapByPageNumber: IntermediatePageMap['mapByPageNumber'] = new Map()
    const sizeMapByPageNumber: IntermediatePageMap['sizeMapByPageNumber'] =
      new Map()
    pages.forEach((page) => {
      mapById.set(page.id, () => Promise.resolve(new IntermediatePage(page)))
      mapByPageNumber.set(page.number, () =>
        Promise.resolve(new IntermediatePage(page))
      )
      sizeMapByPageNumber.set(page.number, { x: page.width, y: page.height })
    })
    return new IntermediatePageMap(
      mapById,
      mapByPageNumber,
      sizeMapByPageNumber
    )
  }
  // & 从列表数据生成类
  static makeByInfoList(
    infoList: {
      id: string
      pageNumber: number
      size: Number2
      getData: getPage
    }[]
  ) {
    const mapById: IntermediatePageMap['mapById'] = new Map()
    const mapByPageNumber: IntermediatePageMap['mapByPageNumber'] = new Map()
    const sizeMapByPageNumber: IntermediatePageMap['sizeMapByPageNumber'] =
      new Map()
    infoList.forEach((info) => {
      mapById.set(info.id, info.getData)
      mapByPageNumber.set(info.pageNumber, info.getData)
      sizeMapByPageNumber.set(info.pageNumber, info.size)
    })
    return new IntermediatePageMap(
      mapById,
      mapByPageNumber,
      sizeMapByPageNumber
    )
  }
  getPageById(id: string) {
    const cache = this.cacheMapById.get(id)
    if (!cache) {
      const result = this.mapById.get(id)
      if (result) {
        const promise = result()
        this.cacheMapById.set(id, promise)
        return () => promise
      }
    } else {
      return () => cache
    }
    return undefined
  }
  getPageByPageNumber(pageNumber: number) {
    const cache = this.cacheMapByPageNumber.get(pageNumber)
    if (!cache) {
      const result = this.mapByPageNumber.get(pageNumber)
      if (result) {
        const promise = result()
        this.cacheMapByPageNumber.set(pageNumber, promise)
        return () => promise
      }
    } else {
      return () => cache
    }
    return undefined
  }
  getPageSizeByPageNumber(pageNumber: number) {
    return this.sizeMapByPageNumber.get(pageNumber)
  }
}

export class IntermediateDocument {
  public id: string
  public title: string
  public outline?: IntermediateOutline[]
  get pages(): Promise<IntermediatePage[]> {
    // 按顺序从 pagesMap 获取pages
    return this.pagesMap.getPages()
  }
  set pages(pages: IntermediatePage[]) {
    pages.forEach((page) => {
      this.pagesMap.updatePage(page)
    })
  }
  private pagesMap: IntermediatePageMap
  static async serialize(
    doc: IntermediateDocument
  ): Promise<IntermediateDocumentSerialized> {
    const pages = await doc.pages
    return {
      pages: pages.map(IntermediatePage.serialize),
      id: doc.id,
      title: doc.title,
      outline: doc.outline?.map(IntermediateOutline.serialize)
    }
  }
  static parse(data: IntermediateDocumentSerialized): IntermediateDocument {
    return new IntermediateDocument({
      ...data,
      pagesMap: IntermediatePageMap.makeBySerializedData(data.pages),
      outline: data.outline?.map(IntermediateOutline.parse)
    })
  }
  constructor({
    pagesMap,
    id,
    title,
    outline
  }: Omit<IntermediateDocumentSerialized, 'pages'> & {
    pagesMap: IntermediatePageMap
    outline?: IntermediateOutline[]
  }) {
    this.pagesMap = pagesMap
    this.id = id
    this.title = title
    this.outline = outline
  }
  async getCover() {
    const page = await this.pagesMap.getPageByPageNumber(1)?.()
    if (!page) return undefined
    return page.getThumbnail(0.3)
  }
  getPageById(id: string) {
    return this.pagesMap.getPageById(id)
  }
  getPageByPageNumber(pageNumber: number) {
    return this.pagesMap.getPageByPageNumber(pageNumber)
  }
  getPageSizeByPageNumber(pageNumber: number) {
    return this.pagesMap.getPageSizeByPageNumber(pageNumber)
  }
  // 获取文档大纲
  getOutline() {
    return this.outline
  }
}
