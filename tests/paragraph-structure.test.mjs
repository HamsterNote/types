import assert from 'node:assert/strict'
import test from 'node:test'

import {
  IntermediateDocument,
  IntermediateImage,
  IntermediateOutline,
  IntermediateOutlineDestType,
  IntermediatePage,
  IntermediateParagraph,
  IntermediateText,
  IntermediateTextAlign
} from '../dist/index.js'

function makePolygon(offsetX = 1, offsetY = 2) {
  return [
    [offsetX, offsetY],
    [offsetX + 10, offsetY],
    [offsetX + 10, offsetY + 20],
    [offsetX, offsetY + 20]
  ]
}

function makeTextData(id, overrides = {}) {
  return {
    id,
    content: 'text',
    fontSize: 16,
    fontFamily: 'sans-serif',
    fontWeight: 400,
    italic: false,
    color: '#000000',
    polygon: makePolygon(),
    lineHeight: 20,
    ascent: 8,
    descent: 2,
    vertical: false,
    dir: 'ltr',
    skew: 0,
    isEOL: false,
    ...overrides
  }
}

function makeText(id, overrides = {}) {
  return new IntermediateText(makeTextData(id, overrides))
}

function makeOutline(id, overrides = {}) {
  return new IntermediateOutline({
    ...makeTextData(id),
    content: 'outline',
    dest: {
      targetType: IntermediateOutlineDestType.PAGE,
      pageId: 'page-1'
    },
    ...overrides
  })
}

function makeParagraph(textIds, overrides = {}) {
  return new IntermediateParagraph({
    id: 'paragraph-1',
    x: 11,
    y: 22,
    width: 333,
    height: 44,
    textIds,
    ...overrides
  })
}

test('IntermediateText serialize/parse keeps polygon and omits legacy geometry fields', () => {
  const text = makeText('text-1')

  const serialized = IntermediateText.serialize(text)

  assert.deepStrictEqual(Object.keys(serialized), [
    'id',
    'content',
    'fontSize',
    'fontFamily',
    'fontWeight',
    'italic',
    'color',
    'polygon',
    'lineHeight',
    'ascent',
    'descent',
    'vertical',
    'dir',
    'opacity',
    'skew',
    'isEOL',
    'fitToPolygon'
  ])
  assert.deepStrictEqual(serialized.polygon, makePolygon())
  assert.equal('x' in serialized, false)
  assert.equal('y' in serialized, false)
  assert.equal('width' in serialized, false)
  assert.equal('height' in serialized, false)
  assert.equal('rotate' in serialized, false)

  const parsed = IntermediateText.parse(serialized)

  assert.deepStrictEqual(IntermediateText.serialize(parsed), serialized)
})

test('IntermediateText rejects invalid polygon structures', () => {
  assert.throws(
    () =>
      IntermediateText.parse(
        makeTextData('text-invalid-points', {
          polygon: [
            [0, 0],
            [10, 0],
            [10, 20]
          ]
        })
      ),
    /polygon 必须包含且仅包含 4 个点/
  )

  assert.throws(
    () =>
      IntermediateText.parse(
        makeTextData('text-invalid-coordinate', {
          polygon: [
            [0, 0],
            [10, 0],
            [10, 20],
            ['bad', 20]
          ]
        })
      ),
    /polygon\[3\] 必须包含两个有限数值坐标/
  )
})

test('IntermediateOutline serialize/parse keeps polygon and dest', () => {
  const outline = makeOutline('outline-1')

  const serialized = IntermediateOutline.serialize(outline)

  assert.deepStrictEqual(serialized.polygon, makePolygon())
  assert.deepStrictEqual(serialized.dest, {
    targetType: IntermediateOutlineDestType.PAGE,
    pageId: 'page-1'
  })
  assert.equal('rotate' in serialized, false)

  const parsed = IntermediateOutline.parse(serialized)

  assert.deepStrictEqual(IntermediateOutline.serialize(parsed), serialized)
})

test('IntermediateOutline rejects invalid polygon structures', () => {
  assert.throws(
    () =>
      IntermediateOutline.parse({
        ...IntermediateOutline.serialize(makeOutline('outline-invalid')),
        polygon: [
          [0, 0],
          [10, 0],
          [10, 20]
        ]
      }),
    /polygon 必须包含且仅包含 4 个点/
  )
})

test('IntermediateParagraph serialize/parse preserves fields and order', () => {
  const paragraph = makeParagraph(['text-2', 'text-1'])

  const serialized = IntermediateParagraph.serialize(paragraph)

  assert.deepStrictEqual(Object.keys(serialized), [
    'id',
    'x',
    'y',
    'width',
    'height',
    'textIds',
    'textAlign'
  ])
  assert.deepStrictEqual(serialized, {
    id: 'paragraph-1',
    x: 11,
    y: 22,
    width: 333,
    height: 44,
    textIds: ['text-2', 'text-1'],
    textAlign: undefined
  })

  const parsed = IntermediateParagraph.parse(serialized)

  assert.deepStrictEqual(parsed, paragraph)
  assert.deepStrictEqual(parsed.textIds, ['text-2', 'text-1'])
})

test('IntermediateParagraph preserves semantic text alignment', () => {
  // Given：一个来自 EPUB `text-align: center` 的段落。
  const paragraph = makeParagraph(
    ['text-title'],
    { textAlign: IntermediateTextAlign.CENTER }
  )

  // When：段落经过公共序列化和反序列化边界。
  const serialized = IntermediateParagraph.serialize(paragraph)
  const reparsed = IntermediateParagraph.parse(serialized)

  // Then：语义对齐信息独立于几何坐标完整保留。
  assert.equal(serialized.textAlign, 'center')
  assert.equal(reparsed.textAlign, IntermediateTextAlign.CENTER)
  assert.deepStrictEqual(IntermediateParagraph.serialize(reparsed), serialized)
})

test('historical paragraph data keeps textAlign undefined', () => {
  // Given：0.9.0 及更早版本生成的不含 textAlign 的段落数据。
  const legacyParagraph = {
    id: 'paragraph-legacy',
    x: 11,
    y: 22,
    width: 333,
    height: 44,
    textIds: ['text-1']
  }

  // When：旧数据被新版本解析。
  const parsed = IntermediateParagraph.parse(legacyParagraph)

  // Then：无需迁移即可使用，序列化结果仅增加值为 undefined 的可选字段。
  assert.equal(parsed.textAlign, undefined)
  assert.equal(IntermediateParagraph.serialize(parsed).textAlign, undefined)
})

test('IntermediateParagraph rejects unsupported text alignment', () => {
  // Given：一个来自非 TypeScript 消费者的非法对齐值。
  const paragraph = {
    id: 'paragraph-invalid-align',
    x: 11,
    y: 22,
    width: 333,
    height: 44,
    textIds: ['text-1'],
    textAlign: 'middle'
  }

  // When / Then：解析边界必须拒绝契约之外的值，避免非法状态进入文档模型。
  assert.throws(
    () => IntermediateParagraph.parse(paragraph),
    /textAlign 必须是 start、end、left、right、center、justify 或 undefined/
  )
})

test('IntermediatePage serialize/parse keeps paragraphs', () => {
  const page = new IntermediatePage({
    id: 'page-1',
    content: [makeText('text-1')],
    paragraphs: [makeParagraph(['text-1'])],
    width: 1000,
    height: 2000,
    number: 1
  })

  const serialized = IntermediatePage.serialize(page)

  assert.deepStrictEqual(serialized.paragraphs, [
    {
      id: 'paragraph-1',
      x: 11,
      y: 22,
      width: 333,
      height: 44,
      textIds: ['text-1'],
      textAlign: undefined
    }
  ])

  const parsed = IntermediatePage.parse(serialized)

  assert.deepStrictEqual(
    IntermediatePage.serialize(parsed),
    serialized
  )
})

test('historical page data defaults paragraphs to empty array', () => {
  const parsed = IntermediatePage.parse({
    id: 'page-legacy',
    content: [makeText('text-1')],
    width: 100,
    height: 200,
    number: 2
  })

  assert.deepStrictEqual(parsed.paragraphs, [])
  assert.deepStrictEqual(IntermediatePage.serialize(parsed).paragraphs, [])
})

test('paragraph textIds can point to missing page texts', () => {
  const page = new IntermediatePage({
    id: 'page-missing-texts',
    content: [],
    paragraphs: [makeParagraph(['missing-1', 'missing-2'])],
    width: 1000,
    height: 2000,
    number: 3
  })

  assert.doesNotThrow(() => IntermediatePage.serialize(page))
  assert.deepStrictEqual(page.paragraphs[0].textIds, ['missing-1', 'missing-2'])
  assert.deepStrictEqual(
    IntermediatePage.serialize(page).paragraphs[0].textIds,
    ['missing-1', 'missing-2']
  )
})

test('IntermediateDocument keeps paragraphs through page flow only', async () => {
  const document = IntermediateDocument.parse({
    id: 'doc-1',
    title: 'doc',
    pages: [
      {
        id: 'page-1',
        content: [makeText('text-1')],
        paragraphs: [makeParagraph(['text-1'])],
        width: 1000,
        height: 2000,
        number: 1
      }
    ],
    outline: [IntermediateOutline.serialize(makeOutline('outline-1'))]
  })

  const serialized = await IntermediateDocument.serialize(document)

  assert.equal('paragraphs' in serialized, false)
  assert.deepStrictEqual(serialized.pages[0].paragraphs, [
    {
      id: 'paragraph-1',
      x: 11,
      y: 22,
      width: 333,
      height: 44,
      textIds: ['text-1'],
      textAlign: undefined
    }
  ])
  assert.deepStrictEqual(serialized.pages[0].content[0].polygon, makePolygon())
  assert.deepStrictEqual(serialized.outline?.[0].polygon, makePolygon())

  const reparsed = IntermediateDocument.parse(serialized)
  const reserialized = await IntermediateDocument.serialize(reparsed)

  assert.deepStrictEqual(reserialized, serialized)
})

// ============================================================================
// IntermediateImage 测试
// ============================================================================

function makeImageData(id, overrides = {}) {
  return {
    id,
    src: 'https://example.com/image.png',
    polygon: makePolygon(5, 10),
    opacity: 1,
    ...overrides
  }
}

function makeImage(id, overrides = {}) {
  return new IntermediateImage(makeImageData(id, overrides))
}

test('IntermediateImage serialize/parse roundtrip', () => {
  const image = makeImage('img-1')

  const serialized = IntermediateImage.serialize(image)

  assert.deepStrictEqual(Object.keys(serialized), [
    'id',
    'src',
    'polygon',
    'opacity',
    'clip'
  ])
  assert.deepStrictEqual(serialized.polygon, makePolygon(5, 10))
  assert.equal(serialized.src, 'https://example.com/image.png')
  assert.equal(serialized.opacity, 1)
  assert.equal(serialized.clip, undefined)

  const parsed = IntermediateImage.parse(serialized)

  assert.deepStrictEqual(IntermediateImage.serialize(parsed), serialized)
})

test('IntermediateImage supports clip region', () => {
  const clip = { x: 10, y: 20, width: 100, height: 200 }
  const image = makeImage('img-clip', { clip })

  const serialized = IntermediateImage.serialize(image)

  assert.deepStrictEqual(serialized.clip, clip)

  const parsed = IntermediateImage.parse(serialized)

  assert.deepStrictEqual(parsed.clip, clip)
})

test('IntermediateImage rejects invalid polygon structures', () => {
  assert.throws(
    () =>
      IntermediateImage.parse(
        makeImageData('img-invalid', {
          polygon: [
            [0, 0],
            [10, 0],
            [10, 20]
          ]
        })
      ),
    /polygon 必须包含且仅包含 4 个点/
  )
})

// ============================================================================
// 混合内容测试（文本 + 图片）
// ============================================================================

test('IntermediatePage supports mixed content (text + image)', () => {
  const text = makeText('text-1')
  const image = makeImage('img-1')

  const page = new IntermediatePage({
    id: 'page-mixed',
    content: [text, image],
    width: 1000,
    height: 2000,
    number: 1
  })

  assert.equal(page.content.length, 2)
  assert.ok(page.content[0] instanceof IntermediateText)
  assert.ok(page.content[1] instanceof IntermediateImage)

  const serialized = IntermediatePage.serialize(page)

  assert.equal(serialized.content.length, 2)
  assert.equal(serialized.content[0].content, 'text')
  assert.equal(serialized.content[1].src, 'https://example.com/image.png')

  const parsed = IntermediatePage.parse(serialized)

  assert.equal(parsed.content.length, 2)
  assert.ok(parsed.content[0] instanceof IntermediateText)
  assert.ok(parsed.content[1] instanceof IntermediateImage)
})

// ============================================================================
// 向后兼容性测试
// ============================================================================

test('IntermediatePage.parse accepts legacy texts field', () => {
  const legacyData = {
    id: 'page-legacy',
    texts: [makeTextData('text-legacy')],
    width: 100,
    height: 200,
    number: 1
  }

  const parsed = IntermediatePage.parse(legacyData)

  assert.equal(parsed.content.length, 1)
  assert.ok(parsed.content[0] instanceof IntermediateText)
  assert.equal(parsed.content[0].id, 'text-legacy')
})

test('IntermediatePage.parse prefers content over texts', () => {
  const data = {
    id: 'page-both',
    content: [makeImageData('img-from-content')],
    texts: [makeTextData('text-from-texts')],
    width: 100,
    height: 200,
    number: 1
  }

  const parsed = IntermediatePage.parse(data)

  assert.equal(parsed.content.length, 1)
  assert.ok(parsed.content[0] instanceof IntermediateImage)
  assert.equal(parsed.content[0].id, 'img-from-content')
})

// ============================================================================
// Opacity 测试
// ============================================================================

test('IntermediateText opacity is optional and preserved', () => {
  const textWithoutOpacity = makeText('text-no-opacity')
  const textWithOpacity = makeText('text-with-opacity', { opacity: 0.5 })

  const serializedWithout = IntermediateText.serialize(textWithoutOpacity)
  const serializedWith = IntermediateText.serialize(textWithOpacity)

  assert.equal(serializedWithout.opacity, undefined)
  assert.equal(serializedWith.opacity, 0.5)

  const parsedWithout = IntermediateText.parse(serializedWithout)
  const parsedWith = IntermediateText.parse(serializedWith)

  assert.equal(parsedWithout.opacity, undefined)
  assert.equal(parsedWith.opacity, 0.5)
})

test('IntermediateImage opacity defaults to 1', () => {
  const image = new IntermediateImage({
    id: 'img-default-opacity',
    src: 'test.png',
    polygon: makePolygon()
  })

  assert.equal(image.opacity, 1)
})
