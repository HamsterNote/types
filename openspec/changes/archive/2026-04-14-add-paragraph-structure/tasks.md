## 1. 段落模型

- [x] 1.1 新增 `IntermediateParagraphSerialized` 接口与 `IntermediateParagraph` class，包含 `id`、边界字段、`textIds` 以及 `serialize` / `parse`
- [x] 1.2 在 `src/HamsterDocument/index.ts` 中导出段落相关类型，保持中间态模型入口一致

## 2. 页面结构集成

- [x] 2.1 扩展 `IntermediatePageSerialized` 与相关类型定义，支持可选 `paragraphs` 字段
- [x] 2.2 更新 `IntermediatePage` 的构造、`parse` 与 `serialize` 逻辑，在缺失 `paragraphs` 时归一化为空数组，并稳定输出段落数据
- [x] 2.3 确认 `IntermediateDocument` 通过现有 page 级流程传递段落结构，不新增 document 级字段

## 3. 兼容性验证

- [x] 3.1 补充段落模型与页面段落序列化/反序列化用例，覆盖 `textIds` 顺序保留
- [x] 3.2 补充历史页面缺失 `paragraphs` 和未校验 `textIds` 的兼容用例，确认模型层不会在解析阶段报错
