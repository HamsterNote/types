# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.10.0] - 2026-07-21

### Added
- `IntermediateAnnotation` 新增页面锚点与 EPUB `href`/`fragment` 源位置，在文本 id 或 CFI 不可用时仍可保留页面书签和源文档定位
- `IntermediateParagraph` 新增 `textAlign` 段落级语义对齐，支持 `start`、`end`、`left`、`right`、`center` 与 `justify`
- `normalizeOutlineDest` 增加了对 annotation/link 目标地址的校验

### Changed
- `IntermediateAnnotationSerialized` 改为判别联合，`NOTE` 必须包含 `note`，`LINK` 必须包含 `dest`，并在运行时边界执行同等校验
- 标注构造与序列化会拒绝未知类型、非法源位置对象及非字符串 `fragment`，避免无效数据进入文档模型
- 段落解析与序列化会拒绝契约之外的 `textAlign` 值，同时继续兼容缺少该字段的历史数据

## [0.9.0] - 2026-07-21

### Added
- 新增 `IntermediateAnnotation` 中间态结构，提供通用标注能力：支持高亮、下划线、波浪线、删除线、笔记、链接、书签七种类型；锚点支持文本区间锚点（pageId/textId/charIndex + textHash/上下文失锚回退 + 可选 cfiRange）与几何区域锚点（pageId + Polygon[]）两种方式；链接类型复用 `IntermediateOutlineDest` 作为跳转目标，可表达 `[1]` 引用、可点击目录等场景
- `IntermediateDocument` 新增 `annotations` 字段与 `getAnnotations()` 方法，标注随文档序列化
- 新增 `src/utils/textHash.ts` 工具模块，提供 FNV-1a `textHash` 与上下文提取函数 `getContextBefore` / `getContextAfter`，用于标注锚点的失锚回退
- 新增标注序列化测试，覆盖 roundtrip、锚点判别、链接跳转目标、非法锚点校验与哈希工具

### Changed
- `test` 脚本改为运行 `tests/` 目录下全部测试
- CI 发布策略从分支触发切换为标签触发，正式版与 beta 版分别使用 `v*.*.*` 和 `v*.*.*-*` 格式的标签

### Fixed
- 校验标注锚点合法性，禁止空区域锚点
- 修复 CI 命令中 npm publish 触发方式

## [0.8.0] - 2026-05-23

### Added
- 新增 `IntermediateImage` 中间态结构，用于表达图像内容及其几何信息
- 新增 `IntermediateText` 的 `opacity` 字段，支持文本透明度设置
- 新增 `src/utils/polygon.ts` 工具模块，提取共享的多边形几何计算函数

### Changed
- 重构 `IntermediatePage` 的内容结构，统一 `texts` 和 `images` 的管理方式
- 优化 `IntermediateText` 的实现，简化几何信息处理逻辑
- 更新测试用例，覆盖图像内容和透明度相关功能

## [0.7.0] - 2026-04-18

### Added
- 新增 `IntermediateParagraph` 中间态结构，并在 `IntermediatePage` 中补充 `paragraphs` 字段，用于表达段落与文本块的归属关系
- 新增段落结构与文本几何结构的测试用例，覆盖序列化、反序列化、兼容旧数据与异常输入校验

### Changed
- 将 `IntermediateText` 与 `IntermediateOutline` 的几何信息从 `x`、`y`、`width`、`height`、`rotate` 调整为 `polygon` 四点坐标，统一文本区域表达方式并显式保留阅读方向
- 完善 `IntermediateDocument`、`IntermediatePage`、`IntermediateOutline` 的 `parse` / `serialize` 流程，统一通过静态解析方法恢复中间态对象
- 更新 `test` 脚本，在发布前执行构建并运行段落结构相关测试

## [0.6.0] - 2026-04-10

### Changed
- 移除整个 `src/api` 目录，包入口不再导出 API 相关类型
- 移除 `class-transformer`、`class-validator`、`reflect-metadata` 及相关装饰器配置，包不再依赖 DTO 运行时

## [0.5.5] - 2026-03-24

### Changed
- 升级 Node.js 版本至 22
- 新增 npm 认证校验步骤，确保发布前 token 有效
- 标记运行时依赖 (class-transformer, class-validator, reflect-metadata) 为 external，避免打包到产物中
- 升级版本号至 0.5.5，添加 publishConfig 配置

## [0.5.4] - 2026-03-21

### Added
- 添加 `GenerateLlmTextDto` 与 `GenerateLlmTextResponseDto`，为 LLM 文本生成接口提供输入校验和响应类型定义

### Changed
- 调整构建流程，先生成 JavaScript 与声明文件再执行打包，并引入 `reflect-metadata` 以支持装饰器运行时依赖
- 从包入口补充导出 `api/main/dto` 中的 LLM 文本生成 DTO

## [0.5.3] - 2026-03-07

### Added
- 添加图像记忆、文本记忆和记忆搜索相关 DTO，并从 `api/main/dto` 统一导出

### Changed
- 更新包版本至 `0.5.3`，补充 `class-transformer`、`class-validator` 依赖并完善包导出配置

### Fixed
- 修复 DTO 装饰器在 TypeScript 5 下触发的 `TS1240` 报错，新增 `experimentalDecorators` 配置以兼容 `class-validator`
- 修复 DTO 文件中的注释和格式问题

## [0.5.2] - 2026-01-07

### Changed
- 导出 api/main

## [0.5.1] - 2026-01-04

### Changed
- 优化 CI 脚本

## [0.5.0] - 2026-01-04

### Changed
- 版本升级至 0.5.0

## [0.4.0] - 2026-01-04

### Added
- 添加 OpenCode 自动代码审查工作流，在 Pull Request 时触发 AI 代码审查

## [0.3.0] - 2026-01-03

### Added
- 标准化模块导入路径，添加 `.js` 扩展名以支持 ESM (ES Modules) 规范
- 更新所有源文件中的相对导入语句，确保完全兼容 ES 模块系统
- 迁移构建工具到 rolldown，添加 `rolldown.config.ts` 配置文件

### Changed
- 更新 `src/HamsterDocument/IntermediateDocument.ts` 中的导入路径
- 更新 `src/HamsterDocument/IntermediateOutline.ts` 中的导入路径
- 更新 `src/HamsterDocument/IntermediatePage.ts` 中的导入路径
- 更新 `src/HamsterDocument/index.ts` 中的导出路径
- 更新 `src/index.ts` 中的导入路径
- 更新 `src/math/index.ts` 中的导出路径
- 修改 `package.json` 中的构建脚本，使用 rolldown 替代 tsc
- 移除所有导入/导出语句中的 `.js` 扩展名，由 rolldown 自动处理模块解析

## [0.2.0] - Previous release
- Enhance IntermediatePage and IntermediateDocument for improved lazy loading and caching
- Refactor base class structure
- Update build configuration

## [0.1.0] - Previous release
- Initial release
