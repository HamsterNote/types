# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
