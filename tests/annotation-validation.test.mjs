import assert from 'node:assert/strict'
import test from 'node:test'

import {
  IntermediateAnnotation,
  IntermediateAnnotationType,
  isPageAnchor
} from '../dist/index.js'

test('IntermediateAnnotation preserves page anchors and EPUB source locations', () => {
  // Given：一个只定位到页面、并保留 EPUB 原始 href/fragment 的书签。
  const annotation = new IntermediateAnnotation({
    id: 'annotation-page-bookmark',
    type: IntermediateAnnotationType.BOOKMARK,
    anchor: { kind: 'page', pageId: 'page-3' },
    source: {
      href: 'Text/chapter-03.xhtml',
      fragment: 'section-2'
    }
  })

  // When：通过公共序列化和反序列化边界往返。
  const serialized = IntermediateAnnotation.serialize(annotation)
  const reparsed = IntermediateAnnotation.parse(serialized)

  // Then：页面锚点可被判别，源位置完整保留。
  assert.ok(isPageAnchor(serialized.anchor))
  assert.deepStrictEqual(serialized.anchor, {
    kind: 'page',
    pageId: 'page-3'
  })
  assert.deepStrictEqual(serialized.source, {
    href: 'Text/chapter-03.xhtml',
    fragment: 'section-2'
  })
  assert.deepStrictEqual(IntermediateAnnotation.serialize(reparsed), serialized)
})

test('IntermediateAnnotation rejects region anchors without a pageId', () => {
  // Given：一个具有合法多边形、但缺少页面归属的 region 锚点。
  const anchor = {
    kind: 'region',
    pageId: '',
    polygons: [
      [
        [0, 0],
        [10, 0],
        [10, 20],
        [0, 20]
      ]
    ]
  }

  // When / Then：在构造边界立即拒绝该无效锚点。
  assert.throws(
    () =>
      new IntermediateAnnotation({
        id: 'annotation-bad-region-page',
        type: IntermediateAnnotationType.LINK,
        anchor
      }),
    /标注锚点 pageId 必须是非空字符串/
  )
})

test('IntermediateAnnotation rejects page anchors without a pageId', () => {
  // Given / When / Then：页面书签必须指向一个明确页面。
  assert.throws(
    () =>
      new IntermediateAnnotation({
        id: 'annotation-bad-page-anchor',
        type: IntermediateAnnotationType.BOOKMARK,
        anchor: { kind: 'page', pageId: '' }
      }),
    /标注锚点 pageId 必须是非空字符串/
  )
})

test('IntermediateAnnotation rejects invalid EPUB source locations', () => {
  // Given / When / Then：href 是源定位的最低要求，不能接受空字符串。
  assert.throws(
    () =>
      new IntermediateAnnotation({
        id: 'annotation-bad-source',
        type: IntermediateAnnotationType.BOOKMARK,
        anchor: { kind: 'page', pageId: 'page-1' },
        source: { href: '' }
      }),
    /标注源位置 href 必须是非空字符串/
  )
})

test('IntermediateAnnotation rejects invalid source shapes and fragments', () => {
  // Given / When / Then：非对象 source 不能被静默当作缺省值。
  assert.throws(
    () =>
      new IntermediateAnnotation({
        id: 'annotation-bad-source-shape',
        type: IntermediateAnnotationType.BOOKMARK,
        anchor: { kind: 'page', pageId: 'page-1' },
        source: ''
      }),
    /标注源位置必须是对象/
  )

  // Given / When / Then：fragment 存在时必须保持字符串契约。
  assert.throws(
    () =>
      new IntermediateAnnotation({
        id: 'annotation-bad-source-fragment',
        type: IntermediateAnnotationType.BOOKMARK,
        anchor: { kind: 'page', pageId: 'page-1' },
        source: { href: 'Text/chapter.xhtml', fragment: 123 }
      }),
    /标注源位置 fragment 必须是字符串或 undefined/
  )
})

test('IntermediateAnnotation rejects unsupported annotation types', () => {
  // Given：一个由非 TypeScript 消费者传入的未知标注类型。
  const annotation = {
    id: 'annotation-bad-type',
    type: 'unknown',
    anchor: { kind: 'page', pageId: 'page-1' }
  }

  // When / Then：构造边界立即拒绝未知类型。
  assert.throws(
    () => new IntermediateAnnotation(annotation),
    /标注类型必须是 highlight、underline、squiggly、strikeout、note、link 或 bookmark/
  )

  // Given：合法实例的公开 type 被运行时消费者篡改。
  const mutated = new IntermediateAnnotation({
    id: 'annotation-mutated-type',
    type: IntermediateAnnotationType.BOOKMARK,
    anchor: { kind: 'page', pageId: 'page-1' }
  })
  mutated.type = 'unknown'

  // When / Then：序列化边界再次校验，不能静默返回 undefined。
  assert.throws(
    () => IntermediateAnnotation.serialize(mutated),
    /标注类型必须是 highlight、underline、squiggly、strikeout、note、link 或 bookmark/
  )
})

test('IntermediateAnnotation NOTE requires note content', () => {
  // Given / When / Then：NOTE 没有正文属于非法状态，应在构造边界拒绝。
  assert.throws(
    () =>
      new IntermediateAnnotation({
        id: 'annotation-note-without-body',
        type: IntermediateAnnotationType.NOTE,
        anchor: { kind: 'page', pageId: 'page-1' }
      }),
    /NOTE 类型标注必须包含 note/
  )
})

test('IntermediateAnnotation LINK requires a destination', () => {
  // Given / When / Then：LINK 没有跳转目标属于非法状态，应在构造边界拒绝。
  assert.throws(
    () =>
      new IntermediateAnnotation({
        id: 'annotation-link-without-dest',
        type: IntermediateAnnotationType.LINK,
        anchor: { kind: 'page', pageId: 'page-1' }
      }),
    /LINK 类型标注必须包含 dest/
  )
})
