## Context

当前 `IntermediateText` 与 `IntermediateOutline` 通过 `x`、`y`、`width`、`height`、`rotate` 表达文本几何信息。这套表达适合矩形文本框，但无法稳定描述 OCR 常见的透视四边形文本区域，也要求调用方在几何信息之外再额外维护旋转角。

本次变更目标是让文本中间态以 `polygon` 作为统一几何表达，并继续在 `IntermediatePage`、`IntermediateDocument`、`DocumentParser` 与 convert 流程之间以可序列化 JSON 结构传输。现有代码中，`IntermediateOutline` 继承 `IntermediateText`，`IntermediatePage` 负责聚合和序列化 `texts` / `paragraphs`，段落结构则通过 `textIds` 引用页面内文本，因此文本几何模型的改动会向页面序列化、Outline 导出类型、段落引用约定和测试数据同步扩散。

## Goals / Non-Goals

**Goals:**
- 将文本几何模型统一替换为四点 `polygon`，并在模型层限制为四边形。
- 让旋转语义由 `polygon[0] -> polygon[1]` 的边方向推导，不再单独存储 `rotate`。
- 保持 `IntermediateText`、`IntermediateOutline`、`IntermediatePage`、`IntermediateDocument` 的序列化/反序列化链路稳定。
- 让段落结构继续通过 `textIds` 引用文本，且在需求层明确“不再依赖 Text 的矩形边界字段”。
- 明确这是一次破坏性升级，统一新旧调用方的迁移方向，避免模型层出现双格式长期共存。

**Non-Goals:**
- 不把 `IntermediateParagraph` 的边界模型一并改为 `polygon`。
- 不在基础模型层新增 OCR、命中测试、旋转计算等几何算法能力。
- 不在本次变更中兼容解析旧版 `x/y/width/height/rotate` 文本结构。
- 不调整字体、颜色、字重、行高、段落阅读顺序等非几何语义。

## Decisions

### 1. `IntermediateText` 只保留 `polygon` 作为几何字段

`IntermediateTextSerialized` 与 `IntermediateText` 实例字段移除 `x`、`y`、`width`、`height`、`rotate`，新增 `polygon`。`polygon` 使用固定四点、固定顺序的类型表达（四个二维点的元组），保证调用方在类型层即可知道这是一个四边形，而不是任意长度数组。

选择该方案而不是“保留旧字段并额外增加 polygon”，是因为本次变更已被定义为 BREAKING CHANGE。若在模型层同时保留矩形与多边形，会让 convert 与 parser 必须处理双数据源，并引入几何来源不一致的问题。

### 2. 旋转方向从 polygon 边方向推导，不再序列化 `rotate`

文本朝向改由 `polygon[0]` 到 `polygon[1]` 的边来表达。这一约定使位置、尺寸和旋转方向合并为单一几何事实来源，避免 `rotate` 与实际顶点方向不一致。

选择“由 polygon 推导旋转”而不是“保留显式 `rotate` 作为缓存字段”，是为了减少冗余状态。若上游需要角度值，可在消费层按需根据首边向量计算；基础模型仅负责保存原始几何事实。

### 3. `IntermediateOutline` 继续复用 `IntermediateText` 的几何契约

`IntermediateOutlineSerialized` 仍继承文本序列化类型，`IntermediateOutline` 仍继承 `IntermediateText`，仅跟随文本模型切换到 `polygon`。这样可以保持 Outline 与普通 Text 在内容、字体、颜色、几何表达上的一致性，只把差异收敛在 `dest` 字段。

选择继续继承而不是拆出独立的几何基类，是因为当前仓库里 Outline 已经以“可导航文本”的形式存在，且本次变更只替换几何表达，不引入新的模型分层需求。保留继承关系可以最小化公开 API 的破坏面。

### 4. 页面与文档容器只透传新文本结构，不承担旧数据兼容

`IntermediatePage.serialize/parse`、`IntermediateDocument.serialize/parse` 继续作为容器层，负责把 `texts`、`outline`、`pages` 的新结构原样透传。它们不负责把旧版矩形字段转换成 polygon，也不负责在缺失 `polygon` 时推断几何数据。

选择在容器层不做兼容转换，是为了让破坏性升级边界清晰：旧格式由外部迁移脚本、parser 适配层或调用方在进入模型层前完成转换，而不是在核心模型层静默兼容。

### 5. `IntermediateParagraph` 维持矩形段落边界，但规范与 Text 解耦

本次仅修改 Text/Outline 的几何表达，`IntermediateParagraph` 仍保留 `x`、`y`、`width`、`height` 与 `textIds`。段落边界表达的是段级包围范围，语义与单个 Text 的透视几何不同，不必因为 Text 改为 polygon 而同步升级。

对应的 spec 调整应落在“段落通过 `textIds` 引用 Text，且不依赖 Text 曾经存在的矩形字段”。这样可以避免段落结构被不必要放大为本次改动的第二个破坏性模型。

### 6. 模型层增加四边形约束校验，校验失败直接拒绝构造

`IntermediateText.parse` / 构造函数以及 `IntermediateOutline.parse` 应校验 `polygon` 恰好包含四个点，且每个点都是合法的二维数值坐标。模型层负责保证“结构合法”，但不负责判断多边形是否自交、是否顺时针、是否面积为零等更高阶几何质量。

选择“只校验结构合法”而不是“做完整几何规范化”，是为了保持中间态模型轻量、确定且易于跨 parser 复用。更复杂的几何清洗仍留给上游 OCR/parser 处理。

### 7. 同步更新导出类型与测试/夹具，统一新契约

`src/HamsterDocument/index.ts`、`src/index.ts` 等公开导出入口需要同步暴露新的文本序列化类型。任何构造 `IntermediateTextSerialized` / `IntermediateOutlineSerialized` 的测试、fixture、样例 JSON、parser 适配代码，都必须改为提供 `polygon`。

选择在同一变更内同步更新所有样例和测试，而不是允许“实现先改、测试后补”，是因为这是类型级破坏性变更，若不同时更新，编译和序列化测试都会立即失效。

## Risks / Trade-offs

- [破坏性升级会影响所有文本调用方] → 通过 proposal/spec 明确新旧字段切换边界，并在同一实现批次内同步更新 parser、convert、fixture 与文档。
- [上游提供的 polygon 点顺序不一致会导致旋转方向语义漂移] → 在 spec 中固定顶点顺序与 `polygon[0] -> polygon[1]` 的方向约定，并要求 parser 在进入模型层前完成归一化。
- [Outline 继承 Text 后，几何变更会扩大到导航相关调用方] → 保持 `dest` 结构不变，只替换共享几何字段，减少非必要改动。
- [Paragraph 仍使用矩形边界，Text 使用 polygon，会出现两套几何语义并存] → 明确二者职责不同：Paragraph 表达段级区域，Text 表达精确文本区域；段落通过 `textIds` 关联而非复制文本几何。
- [不兼容旧版文本 JSON 会让历史数据直接解析失败] → 将迁移责任前置到 parser/convert/脚本层，避免核心模型层长期维护双格式逻辑。

## Migration Plan

1. 更新 change 下的 specs，明确 `text-polygon-geometry` 与 `paragraph-structure` 的新契约。
2. 修改 `IntermediateText` 与 `IntermediateOutline` 的序列化类型、构造函数、`serialize/parse` 实现，移除旧几何字段并引入 `polygon`。
3. 检查 `IntermediatePage`、`IntermediateDocument`、导出入口及任何直接构造文本序列化对象的代码，统一切换到新字段。
4. 更新测试、fixtures、示例 JSON 与 parser/convert 适配层，确保输入输出都使用 polygon。
5. 以类型检查和相关测试验证新契约，确认不存在对旧字段的残留引用。
6. 若上线后需要回滚，整体回滚到旧版模型与旧版 parser/fixture；不在同一代码版本内提供双格式热切换。

## Open Questions

- 是否需要抽出共享的 `polygon` 点类型（例如单独的二维点/四边形类型）供 Text、Outline 和未来其他中间态复用？
- `IntermediateTextMarkedContent` 当前继承 `IntermediateText` 但没有独立 `serialize/parse`；在文本几何切换后，是否需要顺手补齐其公开序列化契约以保持 `Intermediate*` 类一致性？
