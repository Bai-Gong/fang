# 更新日志

本包遵循 semver。0.x 阶段 minor 版本即允许破坏性变更，破坏点在此逐条记录。

## 未发布

- 新增 GitLab CI：push 到 `develop` / `qa` 及目标为二者的 MR 触发全量门禁流水线（`npm ci` → `check` → `smoke`）；`qa` 分支额外产出试用 tarball 制品（不改版本号、不发布 registry）。`main` 流水线（正式版打包 / registry 发布）整体推迟。包代码与公共 API 无变化。

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
