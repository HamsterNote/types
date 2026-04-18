## 1. 文本几何模型改造

- [x] 1.1 为文本几何定义四点 polygon 类型，并更新 `IntermediateText` / `IntermediateTextSerialized` 移除 `x`、`y`、`width`、`height`、`rotate`
- [x] 1.2 在 `IntermediateText` 的构造、`parse`、`serialize` 中实现 polygon 四点二维数值校验与稳定输出
- [x] 1.3 同步更新 `IntermediateOutline` 及其序列化链路，复用 polygon 几何契约并保持 `dest` 语义不变

## 2. 容器与段落引用链路适配

- [x] 2.1 更新 `IntermediatePage` / `IntermediateDocument` 的相关类型与序列化、反序列化流程，确保 texts 与 outline 的 polygon 几何稳定透传
- [x] 2.2 检查并调整页面段落引用流程，确保 `IntermediateParagraph` 仅通过 `textIds` 关联文本且不依赖已移除的文本矩形字段
- [x] 2.3 同步更新公开导出入口与仓库内直接构造文本序列化对象的代码，统一切换到 polygon 契约

## 3. 夹具与验证补齐

- [x] 3.1 更新测试、fixtures、示例数据与 parser/convert 适配输入，统一移除旧文本边界字段并补齐 polygon
- [x] 3.2 增加或更新验证用例，覆盖合法 polygon 解析透传、非法 polygon 拒绝，以及段落在 polygon 文本下仍可通过 `textIds` 正常引用
