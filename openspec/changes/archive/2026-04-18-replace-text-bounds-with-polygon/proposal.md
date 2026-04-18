## Why

当前 `IntermediateText` 使用 `x`、`y`、`rotate`、`width`、`height` 表达文字几何信息，只适合矩形或简单旋转场景，无法准确表示 OCR 识别出的透视四边形区域。为了让中间态在不同 `DocumentParser` 与 convert 流程之间稳定传递真实文本区域，需要改为以 `polygon` 作为统一几何表达。

## What Changes

- **BREAKING**：移除 Text 结构中的 `x`、`y`、`rotate`、`width`、`height` 字段，改为 `polygon: [number, number][]`。
- 将 `polygon` 限定为四边形，四个点共同定义该文字允许填充的区域，用于表达 OCR 识别出的透视文字框。
- 约定 `polygon[0]` 到 `polygon[1]` 的连线方向代表该 Text 的旋转方向，调用方不再单独传递 `rotate`。
- 更新文本中间态的序列化/反序列化契约，使 `DocumentParser` 与 convert 流程统一读写 polygon 几何信息。
- 保持文本内容、字体、行高、字重、颜色等非几何字段的行为不变。

## Capabilities

### New Capabilities
- `text-polygon-geometry`: 定义 Text 中间态基于 `polygon` 的几何表达、四边形约束、旋转推导规则，以及序列化/反序列化传输约定。

### Modified Capabilities
- `paragraph-structure`: 明确页面级段落与文本引用流程在传递文本中间态时，兼容基于 `polygon` 的文本几何字段，不再依赖被移除的 Text 边界框字段。

## Impact

- 受影响代码包括 `src/HamsterDocument/IntermediateText.ts`、`src/HamsterDocument/IntermediateOutline.ts` 及其导出的序列化类型。
- 受影响系统包括依赖 Text 几何字段的 `DocumentParser`、convert 适配层，以及消费中间态 JSON 的上下游调用方。
- 这是一次中间态结构破坏性变更，需要同步调整历史 `x/y/rotate/width/height` 消费逻辑与测试数据。
