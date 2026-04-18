## ADDED Requirements

### Requirement: 段落引用流程兼容 polygon 文本几何
系统 SHALL 允许页面在保留段落矩形边界的同时，引用仅提供 `polygon` 几何的文本对象。段落的解析、序列化与引用流程 MUST 仅依赖 `textIds` 标识关系，而不得要求被引用文本额外提供 `x`、`y`、`width`、`height` 或 `rotate` 字段。

#### Scenario: 段落引用 polygon 文本
- **WHEN** 页面包含 `paragraphs`，且被引用的 `texts` 仅提供 `polygon` 几何信息
- **THEN** 段落与文本之间的 `textIds` 引用关系仍然有效
- **AND** 段落流程不会因为文本缺少旧矩形边界字段而失败

### Requirement: 页面段落结构与文本几何解耦传输
系统 SHALL 让页面级段落结构继续独立表达自身的 `x`、`y`、`width`、`height` 与 `textIds`，同时允许页面内文本采用 `polygon` 几何单独传输。段落边界 MUST NOT 被解释为对被引用文本 polygon 的复制或替代。

#### Scenario: 页面同时传输段落边界与 polygon 文本
- **WHEN** 页面被序列化并同时包含段落矩形边界和基于 `polygon` 的文本几何
- **THEN** `paragraphs` 继续保留自身边界字段与 `textIds`
- **AND** `texts` 的 polygon 几何按各自文本对象独立传输
