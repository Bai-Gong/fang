# 更新日志

本包遵循 semver。0.x 阶段 minor 版本即允许破坏性变更，破坏点在此逐条记录。

## 0.1.0 — 2026-10-19

首版工程骨架（`@baigong/fang`，private，ESM-only）：

- 工程基座：仓库根即单包根，Vite 8 lib 构建 + tsc 产型 + postbuild 交付断言；ESLint 10 flat（typescript-eslint 8 + react-hooks 7）；vitest 5 + jsdom + @testing-library/react。
- `src/theme`：设计 token（深色为 `:root` 默认，`tokens.css` 与 `tokens.ts` 双源、一致性由测试锁定）、`ThemeProvider`（class 切换，深色默认）。
- `src/commands`：`parseKeybinding` / `normalizeKeybinding` / `matchesKeybinding` 纯函数解析器 + `useHotkeys` 声明式注册 hook。
- `src/dock`：`DockHost`（左/右停靠栏容器壳）+ `DockPanel`（标题 + 受控折叠），无拖拽。
- `demo/`：主题 / 停靠 / 快捷键三块演示页。
- `smoke/`：file: 安装形态的自包含消费验收工程。
- 门禁：`npm run check`（tsc --noEmit → eslint → vitest → build）；`npm run smoke` 独立验收。
- 对外样式入口为显式 `@baigong/fang/tokens.css`，主入口不注入样式（见 README「消费方式」）。
