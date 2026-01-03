# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.3.0] - 2026-01-03

### Added
- 标准化模块导入路径，添加 `.js` 扩展名以支持 ESM (ES Modules) 规范
- 更新所有源文件中的相对导入语句，确保完全兼容 ES 模块系统

### Changed
- 更新 `src/HamsterDocument/IntermediateDocument.ts` 中的导入路径
- 更新 `src/HamsterDocument/IntermediateOutline.ts` 中的导入路径
- 更新 `src/HamsterDocument/IntermediatePage.ts` 中的导入路径
- 更新 `src/HamsterDocument/index.ts` 中的导出路径
- 更新 `src/index.ts` 中的导入路径
- 更新 `src/math/index.ts` 中的导出路径

## [0.2.0] - Previous release
- Enhance IntermediatePage and IntermediateDocument for improved lazy loading and caching
- Refactor base class structure
- Update build configuration

## [0.1.0] - Previous release
- Initial release
