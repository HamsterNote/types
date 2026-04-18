## ADDED Requirements

### Requirement: 页面支持独立段落结构
系统 SHALL 允许每个页面携带独立的段落集合。每个段落 MUST 提供 `id`、`x`、`y`、`width`、`height` 与 `textIds` 字段，这些字段共同描述同一页面坐标系中的段落身份、边界与文本引用关系。

#### Scenario: 页面保存段落边界
- **WHEN** 调用方向页面写入一个或多个段落对象
- **THEN** 每个段落都能以独立实体存在于页面级结构中
- **AND** 段落边界字段表达的是该页面坐标系中的位置与尺寸

### Requirement: 段落通过文本标识关联内容
系统 SHALL 让段落通过 `textIds` 引用页面内已有文本，而不是在段落结构中内嵌文本对象。`textIds` 的顺序 MUST 表示段落的阅读顺序。

#### Scenario: 段落引用已有文本
- **WHEN** 一个段落需要表达它包含的文本内容
- **THEN** 该段落仅保存文本标识列表而不重复保存文本实体
- **AND** 调用方可以按照 `textIds` 顺序恢复段落内文本的阅读顺序

### Requirement: 页面序列化稳定携带段落数据
系统 SHALL 在页面级序列化结果中稳定传递段落数据，使段落结构能够随文档中间态一起在不同 DocumentParser 与 convert 流程之间传输。段落数据 MUST 使用可序列化的浅层 JSON 结构表示。

#### Scenario: 序列化页面时包含段落
- **WHEN** 页面包含段落结构并被序列化
- **THEN** 序列化结果包含页面的 `paragraphs` 字段
- **AND** `paragraphs` 中的每个条目都保留段落的边界字段与 `textIds`

### Requirement: 历史页面数据缺失段落时可被兼容解析
系统 MUST 兼容解析未提供 `paragraphs` 字段的历史页面数据。历史数据缺失段落信息时，解析结果 SHALL 将页面段落集合视为空，而不是报错或推断新的段落结构。

#### Scenario: 解析旧版页面数据
- **WHEN** 系统解析一个仅包含文本数据且没有 `paragraphs` 字段的历史页面结构
- **THEN** 解析流程成功完成
- **AND** 得到的页面段落集合为空

### Requirement: 模型层不强制校验段落引用目标
系统 SHALL 允许段落模型保存任意 `textIds` 列表，而不在基础模型的解析或构造阶段强制验证这些标识是否已出现在页面文本集合中。引用有效性校验 MUST 由上游 parser、convert 或其他调用方按场景决定。

#### Scenario: 解析未校验引用的段落数据
- **WHEN** 系统解析一个包含 `textIds` 的段落结构
- **THEN** 基础模型层接受并保留该 `textIds` 列表
- **AND** 不因为缺少对应文本实体而在模型解析阶段失败
