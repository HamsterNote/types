## Why

当前中间态仅表达页面与文本块，缺少独立的段落层级，导致段落位置、尺寸与阅读分组信息只能依赖 text 结构推断，语义与布局容易耦合。现在补充独立的段落中间数据，可以为后续转换、排版还原和结构化消费提供稳定的段落锚点。

## What Changes

- 新增独立的段落中间数据模型，用于描述段落在页面中的位置与尺寸。
- 为段落建立与文本的映射关系，段落内通过 text id 关联已有文本数据，而不是内嵌 text 结构。
- 扩展中间态的序列化与反序列化契约，使段落数据能够在 document/page 级别稳定传递。
- 明确段落与文本解耦后的结构约束，保证不同 DocumentParser 与 convert 流程之间可互通。

## Capabilities

### New Capabilities
- `paragraph-structure`: 定义独立的段落中间数据、位置尺寸字段，以及段落与 text id 的映射关系。

### Modified Capabilities

## Impact

- `src/HamsterDocument` 下的中间态类型定义、serialize/parse 入口与聚合结构。
- 依赖中间态结构的 DocumentParser 与 convert 流程。
- 中间数据的序列化格式与兼容该格式的上下游调用方。
