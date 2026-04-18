## ADDED Requirements

### Requirement: Text 与 Outline 使用 polygon 作为唯一几何字段
系统 SHALL 仅使用 `polygon` 表达 `IntermediateText` 与 `IntermediateOutline` 的几何信息。`polygon` MUST 表示同一文本区域的四边形顶点集合，系统 MUST NOT 再要求或输出 `x`、`y`、`width`、`height`、`rotate` 这些已移除的文本边界字段。

#### Scenario: 序列化文本几何为 polygon
- **WHEN** 调用方序列化一个 Text 或 Outline 中间态对象
- **THEN** 序列化结果包含 `polygon` 字段
- **AND** 序列化结果不包含 `x`、`y`、`width`、`height`、`rotate`

### Requirement: polygon 必须是四个二维数值点
系统 MUST 仅接受由四个二维数值点组成的 `polygon`。每个点 MUST 使用 `[number, number]` 形式表达坐标，点的顺序 MUST 被保留；缺失点、额外点或非数值坐标的输入 MUST 被视为无效。

#### Scenario: 解析合法四边形 polygon
- **WHEN** 系统解析一个包含四个 `[number, number]` 点的 `polygon` 文本结构
- **THEN** 解析流程成功完成
- **AND** 解析后的点顺序与输入保持一致

#### Scenario: 拒绝非法 polygon 结构
- **WHEN** 系统解析一个点数不是四个或坐标不是二维数值的 `polygon` 文本结构
- **THEN** 解析流程失败
- **AND** 系统不会接受该非法文本几何进入中间态模型

### Requirement: 文本方向由 polygon 首边定义
系统 SHALL 将 `polygon[0]` 到 `polygon[1]` 的边方向视为文本方向语义的唯一来源。消费方 MUST 从该首边推导文本朝向，而不是依赖单独的 `rotate` 字段。

#### Scenario: 调用方根据首边理解文本朝向
- **WHEN** 调用方读取一个已提供 `polygon` 的 Text 中间态对象
- **THEN** 调用方可以通过 `polygon[0]` 到 `polygon[1]` 的方向理解文本朝向
- **AND** 系统不再提供单独的 `rotate` 字段作为方向来源

### Requirement: 文本几何在序列化链路中稳定透传
系统 SHALL 在 `IntermediateText`、`IntermediateOutline`、`IntermediatePage` 与 `IntermediateDocument` 的序列化/反序列化链路中稳定透传 `polygon`。仅包含旧版矩形边界字段而缺失 `polygon` 的文本数据 MUST NOT 被视为符合新契约的有效输入。

#### Scenario: 页面与文档链路保留 polygon
- **WHEN** 页面或文档中包含使用 `polygon` 的文本与 Outline 并被序列化后再解析
- **THEN** 文本与 Outline 的 `polygon` 在链路中被完整保留
- **AND** 页面与文档容器不要求额外补充旧矩形边界字段

#### Scenario: 拒绝仅含旧字段的文本数据
- **WHEN** 系统解析一个缺少 `polygon` 且仅包含 `x`、`y`、`width`、`height`、`rotate` 的文本结构
- **THEN** 该数据不被视为有效的新文本几何输入
- **AND** 系统不会把旧字段静默兼容为新的 `polygon` 契约
