/**
 * @baigong/fang 唯一公共出口。
 *
 * 顶部 css 副作用导入的用途：构建图谱验证 + 包内 demo/tests 消费。
 * 对外样式入口是显式 `import "@baigong/fang/tokens.css"`——主入口不注入样式（刻意约定，
 * 见 README「消费方式」与 docs/工程骨架决策.md）。
 */
import "./theme/tokens.css";

export { flattenTokenVars, tokens } from "./theme/tokens";
export { ThemeProvider, useFangTheme, type FangTheme, type ThemeProviderProps } from "./theme/ThemeProvider";

export {
  matchesKeybinding,
  normalizeKeybinding,
  parseKeybinding,
  type KeybindingEvent,
  type Modifier,
  type ParsedKeybinding,
} from "./commands/keybinding";
export { useHotkeys, type HotkeyHandler, type UseHotkeysOptions } from "./commands/useHotkeys";

export { DockHost, type DockHostProps, type DockSide } from "./dock/DockHost";
export { DockPanel, type DockPanelProps } from "./dock/DockPanel";

export { ScrollArea, SCROLLBAR_TRACK_PX, type ScrollAreaProps, type ScrollOrientation } from "./ui/ScrollArea";
export {
  dragToScroll,
  MIN_THUMB_PX,
  thumbMetrics,
  trackClickToScroll,
  type ThumbMetrics,
} from "./ui/scrollbarGeometry";
