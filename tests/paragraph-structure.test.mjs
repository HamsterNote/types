import test from 'node:test'
import assert from 'node:assert/strict'

import {
  IntermediateDocument,
  IntermediateOutline,
  IntermediateOutlineDestType,
  IntermediatePage,
  IntermediateParagraph,
  IntermediateText
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

function makeParagraph(textIds) {
  return new IntermediateParagraph({
    id: 'paragraph-1',
    x: 11,
    y: 22,
    width: 333,
    height: 44,
    textIds
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
    'skew',
    'isEOL'
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
    'textIds'
  ])
  assert.deepStrictEqual(serialized, {
    id: 'paragraph-1',
    x: 11,
    y: 22,
    width: 333,
    height: 44,
    textIds: ['text-2', 'text-1']
  })

  const parsed = IntermediateParagraph.parse(serialized)

  assert.deepStrictEqual(parsed, paragraph)
  assert.deepStrictEqual(parsed.textIds, ['text-2', 'text-1'])
})

test('IntermediatePage serialize/parse keeps paragraphs', () => {
  const page = new IntermediatePage({
    id: 'page-1',
    texts: [makeText('text-1')],
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
      textIds: ['text-1']
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
    texts: [makeText('text-1')],
    width: 100,
    height: 200,
    number: 2,
    thumbnail: undefined
  })

  assert.deepStrictEqual(parsed.paragraphs, [])
  assert.deepStrictEqual(IntermediatePage.serialize(parsed).paragraphs, [])
})

test('paragraph textIds can point to missing page texts', () => {
  const page = new IntermediatePage({
    id: 'page-missing-texts',
    texts: [],
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
        texts: [makeText('text-1')],
        paragraphs: [makeParagraph(['text-1'])],
        width: 1000,
        height: 2000,
        number: 1,
        thumbnail: undefined
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
      textIds: ['text-1']
    }
  ])
  assert.deepStrictEqual(serialized.pages[0].texts[0].polygon, makePolygon())
  assert.deepStrictEqual(serialized.outline?.[0].polygon, makePolygon())

  const reparsed = IntermediateDocument.parse(serialized)
  const reserialized = await IntermediateDocument.serialize(reparsed)

  assert.deepStrictEqual(reserialized, serialized)
})
