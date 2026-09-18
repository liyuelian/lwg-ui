/**
 * 设计 token 的运行时读取工具（lwg-ui）
 *
 * 为什么需要它：ECharts 只接受具体颜色字符串，不认 `var(--token)`，
 * 因此图表配色必须在运行时把 CSS 变量读出来。
 *
 * 关于 FALLBACK：这里的字面量只是"token 缺失时的兜底"，色值的唯一定义处
 * 仍然是 `src/style.css` 的 `:root`。把它们集中在本文件（而不是散在视图里），
 * 是为了让"视图与组件内不出现具体色值"这条约束可以被静态检查。
 */

export const FALLBACK = {
  '--lwg-ink': '#2b2b2b',
  '--lwg-ink-2': '#4a4a4a',
  '--lwg-ink-3': '#8a8175',
  '--lwg-line': '#d9cfc0',
  '--lwg-success': '#4a7c59',
  '--lwg-danger': '#a33a3a',
  '--lwg-cinnabar': '#8b3a3a',
  '--lwg-cinnabar-hover': '#a64d40',
  '--lwg-gold': '#b08d57',
  '--lwg-paper': '#f5f0e6',
  '--lwg-paper-2': '#ede5d8',
  '--lwg-paper-3': '#fbf8f1'
}

/** 读取当前作用域下的 CSS 变量（含 .lwg-night 的局部覆盖） */
export function cssVar(name, fallback = '') {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback
}

/** 便捷写法：token 名简写，自动带上 FALLBACK */
export const token = (name) => cssVar(name, FALLBACK[name] || '')
