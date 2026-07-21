import assert from 'node:assert/strict'
import test from 'node:test'

import {
  IntermediateAnnotation,
  IntermediateAnnotationType
} from '../dist/index.js'

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
