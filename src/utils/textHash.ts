/**
 * 文本哈希与上下文提取工具
 * 为标注（IntermediateAnnotation）锚点的失锚回退链提供稳定的文本指纹，
 * 与 reader 端 savedSelection 的实现保持一致（FNV-1a 32 位，base36 输出）
 */

// 上下文片段默认长度，与 reader 端 savedSelection 的 CONTEXT_LENGTH 保持一致
export const TEXT_ANCHOR_CONTEXT_LENGTH = 24

/**
 * 生成轻量、稳定的文本哈希
 * 使用本地 FNV-1a 32 位实现，避免引入依赖
 * @param text - 待哈希的文本
 * @returns base36 编码的哈希字符串
 */
export function textHash(text: string): string {
  let hash = 0x811c9dc5
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index)
    hash = Math.imul(hash, 0x01000193)
  }
  return (hash >>> 0).toString(36)
}

/**
 * 提取指定字符偏移之前的上下文片段
 * @param content - 完整文本
 * @param charIndex - 字符偏移
 * @param length - 上下文长度，默认 TEXT_ANCHOR_CONTEXT_LENGTH
 */
export function getContextBefore(
  content: string,
  charIndex: number,
  length: number = TEXT_ANCHOR_CONTEXT_LENGTH
): string {
  return content.slice(Math.max(0, charIndex - length), charIndex)
}

/**
 * 提取指定字符偏移之后的上下文片段
 * @param content - 完整文本
 * @param charIndex - 字符偏移
 * @param length - 上下文长度，默认 TEXT_ANCHOR_CONTEXT_LENGTH
 */
export function getContextAfter(
  content: string,
  charIndex: number,
  length: number = TEXT_ANCHOR_CONTEXT_LENGTH
): string {
  return content.slice(charIndex, charIndex + length)
}
