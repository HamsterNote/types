import {
  IntermediatePage,
  IntermediatePageSerialized
} from './IntermediatePage'
import {
  IntermediateOutline,
  IntermediateOutlineSerialized
} from './IntermediateOutline'
import { Number2 } from 'src/math'

export interface IntermediateDocumentSerialized {
  id: string
  pages: IntermediatePageSerialized[]
  title: string
  // 文档大纲（可选）
  outline?: IntermediateOutlineSerialized[]
}

type PageLoader = () => Promise<IntermediatePage>

interface IntermediatePageEntry {
  id: string
  pageNumber: number
  size: Number2
  loader: PageLoader
  cache?: Promise<IntermediatePage>
}

// ! 用来懒加载 Pages
export class IntermediatePageMap {
  // ! 以 id、页码分别索引，方便不同场景快速查找
  private entryById: Map<string, IntermediatePageEntry> = new Map()
  private entryByPageNumber: Map<number, IntermediatePageEntry> = new Map()

  constructor(entries: IntermediatePageEntry[] = []) {
    entries.forEach((entry) => this.registerEntry(entry))
  }

  private registerEntry(entry: IntermediatePageEntry) {
    this.entryById.set(entry.id, entry)
    this.entryByPageNumber.set(entry.pageNumber, entry)
  }

  private async resolve(entry: IntermediatePageEntry): Promise<IntermediatePage> {
    if (!entry.cache) entry.cache = entry.loader()
    return entry.cache
  }

  // 按页码顺序批量获取，内部并发取数避免串行等待
  async getPages(): Promise<IntermediatePage[]> {
    const orderedEntries = this.pageNumbers
      .map((pageNumber) => this.entryByPageNumber.get(pageNumber))
      .filter(
        (entry): entry is IntermediatePageEntry => Boolean(entry)
      )
    return Promise.all(orderedEntries.map((entry) => this.resolve(entry)))
  }

  // 直接用完整实例覆盖缓存，便于外部更新
  updatePage(page: IntermediatePage) {
    // 先清理旧索引，避免相同 id 或页码残留造成脏数据
    const oldById = this.entryById.get(page.id)
    if (oldById) {
      this.entryByPageNumber.delete(oldById.pageNumber)
      this.entryById.delete(oldById.id)
    }
    const oldByNumber = this.entryByPageNumber.get(page.number)
    if (oldByNumber && oldByNumber.id !== page.id) {
      this.entryById.delete(oldByNumber.id)
      this.entryByPageNumber.delete(oldByNumber.pageNumber)
    }
    const newPromise = Promise.resolve(page)
    const entry: IntermediatePageEntry = {
      id: page.id,
      pageNumber: page.number,
      size: { x: page.width, y: page.height },
      loader: () => newPromise,
      cache: newPromise
    }
    this.registerEntry(entry)
  }

  get pageCount() {
    return this.entryByPageNumber.size
  }

  get pageNumbers(): number[] {
    return [...this.entryByPageNumber.keys()].sort((a, b) => a - b)
  }

  // & 从序列化的数据生成类
  static fromSerialized(pages: IntermediatePageSerialized[]) {
    const entries: IntermediatePageEntry[] = pages.map((page) => ({
      id: page.id,
      pageNumber: page.number,
      loader: () => Promise.resolve(new IntermediatePage(page)),
      size: { x: page.width, y: page.height }
    }))
    return new IntermediatePageMap(entries)
  }

  // & 从列表数据生成类
  static fromInfoList(
    infoList: {
      id: string
      pageNumber: number
      size: Number2
      getData: PageLoader
    }[]
  ) {
    const entries: IntermediatePageEntry[] = infoList.map((info) => ({
      id: info.id,
      pageNumber: info.pageNumber,
      size: info.size,
      loader: info.getData
    }))
    return new IntermediatePageMap(entries)
  }

  // 兼容旧命名（Deprecated），方便平滑过渡
  static makeBySerializedData(pages: IntermediatePageSerialized[]) {
    return IntermediatePageMap.fromSerialized(pages)
  }
  static makeByInfoList(infoList: {
    id: string
    pageNumber: number
    size: Number2
    getData: PageLoader
  }[]) {
    return IntermediatePageMap.fromInfoList(infoList)
  }

  getPageById(id: string) {
    const entry = this.entryById.get(id)
    if (!entry) return undefined
    return this.resolve(entry)
  }

  getPageByPageNumber(pageNumber: number) {
    const entry = this.entryByPageNumber.get(pageNumber)
    if (!entry) return undefined
    return this.resolve(entry)
  }

  getPageSizeByPageNumber(pageNumber: number) {
    return this.entryByPageNumber.get(pageNumber)?.size
  }
}

export class IntermediateDocument {
  public readonly id: string
  public title: string
  public outline?: IntermediateOutline[]

  get pages(): Promise<IntermediatePage[]> {
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
    const pages = await doc.pagesMap.getPages()
    const serializedPages = await Promise.all(
      pages.map(async (page) => {
        if (!page.hasLoadedTexts) await page.getTexts()
        return IntermediatePage.serialize(page)
      })
    )
    return {
      pages: serializedPages,
      id: doc.id,
      title: doc.title,
      outline: doc.outline?.map(IntermediateOutline.serialize)
    }
  }

  static parse(data: IntermediateDocumentSerialized): IntermediateDocument {
    return new IntermediateDocument({
      ...data,
      pagesMap: IntermediatePageMap.fromSerialized(data.pages),
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

  get pageCount() {
    return this.pagesMap.pageCount
  }

  get pageNumbers() {
    return this.pagesMap.pageNumbers
  }

  async getCover(scale = 0.3) {
    const firstPagePromise = this.pagesMap.getPageByPageNumber(1)
    const page = firstPagePromise ? await firstPagePromise : undefined
    if (!page) return undefined
    return page.getThumbnail(scale)
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
