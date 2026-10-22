# 更新日志

本包遵循 semver。0.x 阶段 minor 版本即允许破坏性变更，破坏点在此逐条记录。

## 未发布

- 新增 `src/ui/TitleBar`：应用标题栏——可配置菜单栏（`defaultMenus` 通用默认项，应用对纯数据数组自由增删）＋居中信息槽＋动作槽＋窗口三键（最小化/最大化/关闭，Windows 形态）＋ `data-tauri-drag-region` 拖动区。配套 `windowAdapter`（坊不直接依赖 Tauri，窗口动作经应用侧注入；未注入三键置灰）与 `menu` 菜单模型。需求方：剪——去掉系统原生标题栏改为应用级外壳。样式与 ScrollArea 同法经运行时注入 scoped `<style>`（伪类 hover 内联做不到），作用域仅 `.fang-title-bar__*`。
- 新增 `src/ui/ScrollArea`：自绘滚动条滚动容器（隐藏原生滚动条、边缘叠加 thumb、拖拽/轨道点击定位、闲置淡出、`onViewportChange` 交付视口元素）。首个通用控件，来自剪（jian）时间线的真实需求。附 `scrollbarGeometry` 纯函数（thumb 几何/拖拽映射，可单测）。scoped 样式经运行时注入（隐藏原生滚动条所需伪元素规则内联做不到），作用域仅 `.fang-scroll-area__*`——「主入口不注入样式」约定的有意例外。
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
