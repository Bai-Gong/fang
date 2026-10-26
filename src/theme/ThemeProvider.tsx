import { createContext, useContext, useMemo, type ReactNode } from "react";

/**
 * 主题类型。深色（dark）是产品分析既定的唯一默认主题；
 * 亮色等需求出现前不预设多主题配置接口（见 docs/工程骨架决策.md 推迟项）。
 */
export type FangTheme = "dark";

interface FangThemeContextValue {
  /** 当前生效主题。 */
  theme: FangTheme;
}

const FangThemeContext = createContext<FangThemeContextValue>({ theme: "dark" });

export interface ThemeProviderProps {
  children: ReactNode;
}

/**
 * 主题载体：在容器上挂 `fang-theme-dark` class 与 `data-fang-theme` 标记，
 * 主题切换即 class 切换。token 变量本身定义在 tokens.css 的 `:root`（全局默认深色）。
 * 载体不注入视觉样式，但承担满高布局（height:100%）：工具外壳依赖
 * `#root(100%) → 主题载体(100%) → .app-shell(100%)` 的高度链铺满窗口，
 * 载体若无高度，链条在中间断裂，界面塌成内容高度（墨启动空态实测过）。
 */
export function ThemeProvider({ children }: ThemeProviderProps) {
  const value = useMemo<FangThemeContextValue>(() => ({ theme: "dark" }), []);
  return (
    <FangThemeContext.Provider value={value}>
      <div className="fang-theme-dark" data-fang-theme="dark" style={{ height: "100%" }}>
        {children}
      </div>
    </FangThemeContext.Provider>
  );
}

/** 读取当前主题上下文（未包裹 ThemeProvider 时回退默认深色）。 */
export function useFangTheme(): FangThemeContextValue {
  return useContext(FangThemeContext);
}
