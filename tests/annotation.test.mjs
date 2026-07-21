import assert from 'node:assert/strict'
import test from 'node:test'

import {
  getContextAfter,
  getContextBefore,
  IntermediateAnnotation,
  IntermediateAnnotationType,
  IntermediateDocument,
  IntermediateOutlineDestType,
  isRegionAnchor,
  isTextAnchor,
  TEXT_ANCHOR_CONTEXT_LENGTH,
  textHash
} from '../dist/index.js'

function makePolygon(offsetX = 1, offsetY = 2) {
  return [
    [offsetX, offsetY],
    [offsetX + 10, offsetY],
    [offsetX + 10, offsetY + 20],
    [offsetX, offsetY + 20]
  ]
}

function makeTextPoint(overrides = {}) {
  return {
    pageId: 'page-1',
    textId: 'text-1',
    charIndex: 3,
    textHash: textHash('hello world'),
    contextBefore: 'hel',
    contextAfter: 'lo wo',
    ...overrides
  }
}

function makeTextAnchor(overrides = {}) {
  return {
    kind: 'text',
    start: makeTextPoint(),
    end: makeTextPoint({ charIndex: 8 }),
    ...overrides
  }
}

function makeRegionAnchor() {
  return {
    kind: 'region',
    pageId: 'page-1',
    polygons: [makePolygon(), makePolygon(20, 40)]
  }
}

function makeAnnotationData(overrides = {}) {
  return {
    id: 'annotation-1',
    type: IntermediateAnnotationType.HIGHLIGHT,
    anchor: makeTextAnchor(),
    text: 'lo wo',
    note: 'test note',
    color: '#ffeb3b',
    cfiRange: 'epubcfi(/6/4!/2/1:3,/6/4!/2/1:8)',
    author: 'tester',
    createdAt: '2026-07-20T12:00:00.000Z',
    updatedAt: '2026-07-20T13:00:00.000Z',
    ...overrides
  }
}

test('IntermediateAnnotation serialize/parse roundtrip with text anchor', () => {
  const annotation = new IntermediateAnnotation(makeAnnotationData())

  const serialized = IntermediateAnnotation.serialize(annotation)

  assert.deepStrictEqual(Object.keys(serialized), [
    'id',
    'type',
    'anchor',
    'text',
    'note',
    'color',
    'dest',
    'cfiRange',
    'source',
    'author',
    'createdAt',
    'updatedAt'
  ])
  assert.equal(serialized.type, 'highlight')
  assert.ok(isTextAnchor(serialized.anchor))
  assert.deepStrictEqual(serialized.anchor.start, makeTextPoint())

  const parsed = IntermediateAnnotation.parse(serialized)

  assert.deepStrictEqual(IntermediateAnnotation.serialize(parsed), serialized)
})

test('IntermediateAnnotation minimal data keeps optional fields undefined', () => {
  const annotation = new IntermediateAnnotation({
    id: 'annotation-min',
    type: IntermediateAnnotationType.HIGHLIGHT,
    anchor: makeTextAnchor()
  })

  const serialized = IntermediateAnnotation.serialize(annotation)

  assert.equal(serialized.text, undefined)
  assert.equal(serialized.note, undefined)
  assert.equal(serialized.color, undefined)
  assert.equal(serialized.dest, undefined)
  assert.equal(serialized.cfiRange, undefined)
  assert.equal(serialized.createdAt, undefined)
})

test('IntermediateAnnotation supports region anchor and normalizes polygons', () => {
  const annotation = new IntermediateAnnotation({
    id: 'annotation-region',
    type: IntermediateAnnotationType.LINK,
    anchor: makeRegionAnchor(),
    dest: {
      targetType: IntermediateOutlineDestType.PAGE,
      pageId: 'page-2'
    }
  })

  const serialized = IntermediateAnnotation.serialize(annotation)

  assert.ok(isRegionAnchor(serialized.anchor))
  assert.deepStrictEqual(serialized.anchor.polygons, [
    makePolygon(),
    makePolygon(20, 40)
  ])
  assert.deepStrictEqual(serialized.dest, {
    targetType: IntermediateOutlineDestType.PAGE,
    pageId: 'page-2'
  })

  const parsed = IntermediateAnnotation.parse(serialized)

  assert.deepStrictEqual(IntermediateAnnotation.serialize(parsed), serialized)
})

test('IntermediateAnnotation LINK can carry text dest for in-document references', () => {
  const annotation = new IntermediateAnnotation({
    id: 'annotation-ref',
    type: IntermediateAnnotationType.LINK,
    anchor: makeTextAnchor(),
    text: '[1]',
    dest: {
      targetType: IntermediateOutlineDestType.TEXT,
      textId: 'text-reference-1'
    }
  })

  const serialized = IntermediateAnnotation.serialize(annotation)

  assert.deepStrictEqual(serialized.dest, {
    targetType: IntermediateOutlineDestType.TEXT,
    textId: 'text-reference-1'
  })
})

test('IntermediateAnnotation bookmark uses collapsed text anchor', () => {
  const point = makeTextPoint()
  const annotation = new IntermediateAnnotation({
    id: 'annotation-bookmark',
    type: IntermediateAnnotationType.BOOKMARK,
    anchor: { kind: 'text', start: point, end: point }
  })

  const serialized = IntermediateAnnotation.serialize(annotation)

  assert.deepStrictEqual(serialized.anchor.start, serialized.anchor.end)

  const parsed = IntermediateAnnotation.parse(serialized)

  assert.deepStrictEqual(IntermediateAnnotation.serialize(parsed), serialized)
})

test('IntermediateAnnotation rejects invalid anchors', () => {
  assert.throws(
    () =>
      new IntermediateAnnotation({
        id: 'annotation-bad-kind',
        type: IntermediateAnnotationType.HIGHLIGHT,
        anchor: { kind: 'unknown' }
      }),
    /标注锚点 kind 必须是 text、region 或 page/
  )

  assert.throws(
    () =>
      new IntermediateAnnotation({
        id: 'annotation-bad-page',
        type: IntermediateAnnotationType.HIGHLIGHT,
        anchor: { kind: 'text', start: makeTextPoint({ pageId: '' }), end: makeTextPoint() }
      }),
    /标注锚点 pageId 必须是非空字符串/
  )

  assert.throws(
    () =>
      new IntermediateAnnotation({
        id: 'annotation-bad-index',
        type: IntermediateAnnotationType.HIGHLIGHT,
        anchor: {
          kind: 'text',
          start: makeTextPoint({ charIndex: -1 }),
          end: makeTextPoint()
        }
      }),
    /标注锚点 charIndex 必须是大于等于 0 的有限数值/
  )

  assert.throws(
    () =>
      new IntermediateAnnotation({
        id: 'annotation-bad-region',
        type: IntermediateAnnotationType.LINK,
        anchor: { kind: 'region', pageId: 'page-1', polygons: [] }
      }),
    /标注区域锚点 polygons 必须包含至少一个多边形/
  )

  assert.throws(
    () =>
      new IntermediateAnnotation({
        id: 'annotation-bad-polygon',
        type: IntermediateAnnotationType.LINK,
        anchor: {
          kind: 'region',
          pageId: 'page-1',
          polygons: [
            [
              [0, 0],
              [10, 0],
              [10, 20]
            ]
          ]
        }
      }),
    /polygon 必须包含且仅包含 4 个点/
  )
})

test('IntermediateDocument carries annotations through serialize/parse', async () => {
  const document = IntermediateDocument.parse({
    id: 'doc-1',
    title: 'doc',
    pages: [
      {
        id: 'page-1',
        content: [],
        width: 1000,
        height: 2000,
        number: 1
      }
    ],
    annotations: [
      makeAnnotationData(),
      {
        id: 'annotation-2',
        type: IntermediateAnnotationType.LINK,
        anchor: makeRegionAnchor(),
        dest: {
          targetType: IntermediateOutlineDestType.PAGE,
          pageId: 'page-1'
        }
      }
    ]
  })

  assert.equal(document.getAnnotations().length, 2)

  const serialized = await IntermediateDocument.serialize(document)

  assert.equal(serialized.annotations.length, 2)
  assert.equal(serialized.annotations[0].type, 'highlight')
  assert.equal(serialized.annotations[1].type, 'link')

  const reparsed = IntermediateDocument.parse(serialized)
  const reserialized = await IntermediateDocument.serialize(reparsed)

  assert.deepStrictEqual(reserialized, serialized)
})

test('IntermediateDocument without annotations keeps field undefined', async () => {
  const document = IntermediateDocument.parse({
    id: 'doc-no-annotations',
    title: 'doc',
    pages: [
      {
        id: 'page-1',
        content: [],
        width: 100,
        height: 200,
        number: 1
      }
    ]
  })

  assert.equal(document.getAnnotations(), undefined)

  const serialized = await IntermediateDocument.serialize(document)

  assert.equal(serialized.annotations, undefined)
})

test('textHash is deterministic and stable across calls', () => {
  assert.equal(textHash('hello world'), textHash('hello world'))
  assert.notEqual(textHash('hello world'), textHash('hello world!'))
  assert.equal(typeof textHash('hello world'), 'string')
})

test('context helpers extract surrounding text with default length', () => {
  const content = 'a'.repeat(100)

  assert.equal(getContextBefore(content, 50).length, TEXT_ANCHOR_CONTEXT_LENGTH)
  assert.equal(getContextAfter(content, 50).length, TEXT_ANCHOR_CONTEXT_LENGTH)
  assert.equal(getContextBefore(content, 3), 'aaa')
  assert.equal(getContextAfter(content, 97), 'aaa')
  assert.equal(getContextBefore('hello world', 3), 'hel')
  assert.equal(getContextAfter('hello world', 3), 'lo world')
})
