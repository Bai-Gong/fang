/**
 * 设计 token 的 TS 常量镜像：镜像的是 CSS 变量名（`--fang-*`）而非值——
 * 值由 tokens.css 在运行时按主题决定，TS 侧供内联样式、canvas 绘制等场景引用。
 * 与 tokens.css 的变量名集合一致性由 tests/tokens.test.ts 锁定，修改任一端必须同步另一端。
 */
export const tokens = {
  color: {
    bg: "--fang-color-bg",
    bgRaised: "--fang-color-bg-raised",
    bgOverlay: "--fang-color-bg-overlay",
    border: "--fang-color-border",
    borderStrong: "--fang-color-border-strong",
    text: "--fang-color-text",
    textSecondary: "--fang-color-text-secondary",
    textMuted: "--fang-color-text-muted",
    accent: "--fang-color-accent",
    accentHover: "--fang-color-accent-hover",
    accentActive: "--fang-color-accent-active",
    danger: "--fang-color-danger",
    warning: "--fang-color-warning",
    success: "--fang-color-success",
    selected: "--fang-color-selected",
    hover: "--fang-color-hover",
  },
  space: {
    1: "--fang-space-1",
    2: "--fang-space-2",
    3: "--fang-space-3",
    4: "--fang-space-4",
    5: "--fang-space-5",
    6: "--fang-space-6",
  },
  fontSize: {
    xs: "--fang-font-size-xs",
    sm: "--fang-font-size-sm",
    md: "--fang-font-size-md",
    lg: "--fang-font-size-lg",
    xl: "--fang-font-size-xl",
  },
  font: {
    family: "--fang-font-family",
    mono: "--fang-font-mono",
  },
  zIndex: {
    base: "--fang-z-base",
    dock: "--fang-z-dock",
    dropdown: "--fang-z-dropdown",
    overlay: "--fang-z-overlay",
    tooltip: "--fang-z-tooltip",
    modal: "--fang-z-modal",
  },
  radius: {
    sm: "--fang-radius-sm",
    md: "--fang-radius-md",
    lg: "--fang-radius-lg",
  },
} as const;

/** 展平后的全部 CSS 变量名（tokens 双源一致性测试使用）。 */
export function flattenTokenVars(): string[] {
  const result: string[] = [];
  for (const group of Object.values(tokens)) {
    for (const value of Object.values(group)) {
      result.push(value);
    }
  }
  return result;
}
