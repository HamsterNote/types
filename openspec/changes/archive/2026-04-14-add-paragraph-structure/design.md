## Context

当前中间态结构以 `IntermediateDocument` 聚合页面，`IntermediatePage` 聚合 `IntermediateText`。文本对象同时承载内容、字体、位置、尺寸与行结束信息，但缺少段落级锚点，调用方只能从 text 顺序、坐标和 `isEOL` 推断段落边界。

本变更需要新增独立段落层级，服务于 DocumentParser 之间的 convert、版面还原和结构化消费。现有项目约定是 `Intermediate*` class 必须提供 `serialize` 与 `parse`，并通过 `*Serialized` interface 描述可传递的 JSON 数据结构。

## Goals / Non-Goals

**Goals:**

- 新增 `IntermediateParagraph` 与 `IntermediateParagraphSerialized`，表达段落的 `id`、位置、尺寸与关联文本。
- 在页面层维护 `paragraphs` 聚合，让段落与文本共享同一页坐标系。
- 段落通过 `textIds` 引用现有 `IntermediateText.id`，避免内嵌文本导致数据重复与生命周期耦合。
- 保持旧序列化数据可解析，缺失 `paragraphs` 时默认视为无段落结构。

**Non-Goals:**

- 不在本设计中定义自动段落识别算法，具体识别逻辑由各 DocumentParser 或 convert 流程实现。
- 不改变 `IntermediateText` 的字体、坐标、旋转、倾斜等字段含义。
- 不引入外部依赖，也不新增复杂的段落懒加载机制。
- 不强制所有历史数据立即补齐段落信息。

## Decisions

### 1. 使用独立 `IntermediateParagraph` class

新增 `src/HamsterDocument/IntermediateParagraph.ts`，并导出：

- `IntermediateParagraphSerialized`
- `IntermediateParagraph`

字段建议：

- `id: string`
- `x: number`
- `y: number`
- `width: number`
- `height: number`
- `textIds: string[]`

理由：段落是页面内的结构分组，不是文本本身；独立 class 比继承 `IntermediateText` 更符合语义，也能避免段落被误用为可渲染文本。

备选方案：让 `IntermediateParagraph extends IntermediateText`。放弃原因是段落没有单一 `content`、字体和 baseline，继承会制造无意义字段。

### 2. 在 `IntermediatePage` 上新增 `paragraphs`

将页面序列化结构扩展为：

- `texts: IntermediateTextSerialized[]`
- `paragraphs?: IntermediateParagraphSerialized[]`

运行时 `IntermediatePage` 使用 `paragraphs: IntermediateParagraph[]`，构造时将缺失值归一化为 `[]`。

理由：段落的位置与尺寸属于页面坐标系，放在 page 下可以与 text 保持同级数据来源，并让 document 的懒加载页面机制继续生效。

备选方案：在 `IntermediateDocument` 上维护全局段落列表。放弃原因是段落天然依附页面，全局列表需要额外 page id 索引，增加 convert 成本。

### 3. 段落引用 text id，而不是内嵌 text

`IntermediateParagraph.textIds` 只保存段落包含的文本 id。段落边界、顺序与可读文本内容由调用方通过 `page.texts` 解析。

理由：proposal 明确要求段落与文本解耦；引用 id 可以避免同一 text 在 page 与 paragraph 中重复序列化，并降低更新文本对象时的数据不一致风险。

备选方案：`paragraph.texts: IntermediateText[]`。放弃原因是会造成重复存储，且 parse/serialize 时需要处理嵌套文本对象与页面文本数组的同步。

### 4. 序列化与解析保持兼容

`IntermediateParagraph.serialize` 返回浅层 JSON 数据，`IntermediateParagraph.parse` 通过构造函数恢复实例。`IntermediatePage.serialize` 总是输出 `paragraphs` 字段，历史输入缺失该字段时 `parse` 与 constructor 默认填充空数组。

理由：符合当前 `Intermediate*` 的 serialize/parse 契约，同时让新数据格式稳定携带段落结构，旧数据不需要迁移即可读取。

备选方案：要求序列化输入强制包含 `paragraphs`。放弃原因是会破坏已有上游数据与测试夹具。

### 5. 不在模型层强制校验 `textIds`

模型层只保存 `textIds`，不在 `parse` 时强制检查 id 是否存在于 `page.texts`。需要校验时由 parser、convert 或后续工具按场景执行。

理由：当前中间态 class 更偏数据容器，强制校验可能阻断部分按需加载、增量转换或临时中间状态。

备选方案：在 `IntermediatePage` 构造函数中校验所有段落引用。放弃原因是会让数据模型承担流程约束，并可能与懒加载策略冲突。

## Risks / Trade-offs

- 段落 `textIds` 指向不存在的 text → 在 parser/convert 生成阶段补充校验，并在测试中覆盖无效引用场景。
- 历史数据没有段落结构 → `paragraphs` 默认空数组，调用方需要将“无段落信息”和“空页面”区分处理。
- text 顺序与 `textIds` 顺序不一致 → 约定 `textIds` 顺序表示段落阅读顺序，不隐式依赖 `page.texts` 的数组位置。
- 段落边界与 text 外框不完全一致 → 允许 parser 根据来源信息给出段落外框，不要求模型层重新计算。

## Migration Plan

1. 新增 `IntermediateParagraph` 类型文件，并在 `src/HamsterDocument/index.ts` 中导出。
2. 扩展 `IntermediatePageSerialized` 与 `IntermediatePage`，添加 `paragraphs` 的 parse/serialize 支持。
3. 保持 `IntermediateDocument.serialize` / `parse` 通过 page 级逻辑传递段落结构，不新增 document 级字段。
4. 为旧数据缺失 `paragraphs` 的路径添加覆盖，确认 parse 后为 `[]`。
5. 回滚时可忽略序列化数据中的 `paragraphs` 字段，旧调用方仍可读取 `texts`。

## Open Questions

- 后续是否需要定义段落类型（正文、标题、脚注等）由独立 capability 扩展，本次只保留基础段落结构。
- 是否需要统一的段落识别工具函数应在实现阶段根据 parser 需求决定，不放入当前基础数据模型。
