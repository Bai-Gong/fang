# 百工·坊 (Fang)

创作工具共享外壳 —— 为集群内的创作工具（墨、剪、陶、乐、筑、锻）提供统一的桌面应用外壳与 UI 基础设施。

## 定位与原则

- 以 npm 私有包形式分发给各工具项目，semver 版本化；
- 内容范围：停靠面板系统、快捷键/命令框架、主题与设计 token、菜单栏、通用控件（滑杆、取色器、树、表格等）；
- **API 需求驱动**：不预先设计接口，从第一个真实工具的开发中沉淀，避免过早抽象；
- 技术栈：Tauri + React；Tauri 相关部分（窗口、IPC 约定）作为可选层。

产品分析见 [docs/产品分析.md](docs/产品分析.md)。工程骨架的方案定夺与实测留档见 [docs/工程骨架决策.md](docs/工程骨架决策.md)。

属于「百工」项目集群，约定参见上级目录 [AGENTS.md](../AGENTS.md)。

## 开发

- 环境要求：Node `^20.19.0 || >=22.12.0`；包管理器一律用 **npm**（集群约定）。
- 首次：`npm install`，之后四个常用命令：

| 命令 | 内容 |
| --- | --- |
| `npm run check` | 全量门禁：`tsc --noEmit` → `eslint .` → `vitest run` → `npm run build` |
| `npm run build` | 类型检查 + 构建：vite lib 产物（React 显式外置）→ `tsc` 产 d.ts → postbuild 断言（tokens.css 复制、孤儿 css 清理、React 外置双向校验） |
| `npm run smoke` | 消费验收（独立于 check 链）。**前置：先跑过 `npm run build`**——本包 exports 全部指向 `dist/`（package.json），新克隆后只 `npm install` 就跑 smoke 会在第①步 import 失败。所谓「自包含」指 `smoke/` 是自带 `package.json`、可独立重装的子工程（其 `node_modules` 与锁文件不入库，见 `.gitignore`）；验收内容：`file:` 安装后 node 侧 import 主入口 / resolve tokens.css / 断言 d.ts / 记录链接形态 |
| `npm run dev` | demo 站（`demo/`，主题 / 停靠 / 快捷键三块演示，经 `src` 直接消费） |

- 目录速览：`src/theme`（token 双源 + ThemeProvider）、`src/commands`（keybinding 解析 + useHotkeys）、`src/dock`（DockHost / DockPanel）、`src/ui`（通用控件占位）、`demo/`、`tests/`、`smoke/`、`scripts/postbuild.mjs`。
- 仓库里另有一个 `fang/fang/` 子目录：**门禁 runner 的兼容跳板，不是嵌套包、不属包内容**（runner 固定以 `<项目目录>/<项目名>` 为包根执行 `npm run build`）。缘由与删除条件见 [`fang/fang/README.md`](fang/README.md) 与 [docs/工程骨架决策.md](docs/工程骨架决策.md)「施工附注」；已通过 `.gitignore` 排除出版本库。
- CI（GitLab）：push 到 `develop` / `qa` 及目标为二者的 MR 触发门禁流水线（`npm ci` → `check` → `smoke`，与本地同链）；`qa` 分支额外产出试用 tarball 制品（`npm i <tgz>`，不发布 registry）。`main` 暂无流水线——正式版打包/发布推迟，见 [docs/工程骨架决策.md](docs/工程骨架决策.md)「八、CI 流水线决策」。
- 版本纪律：semver，0.x 期间 minor 即允许破坏，破坏点记 [CHANGELOG.md](CHANGELOG.md)。

## 消费方式

**正式消费（读 dist 产物，registry 轨）**

> 现状注：本包当前 `"private": true` 且私有 registry 尚未搭建（推迟项，见 [docs/工程骨架决策.md](docs/工程骨架决策.md)），**此轨暂不可用**，现阶段实际消费走下面两条轨。本小节保留为 registry 就绪后的正式形态。

```bash
npm install @baigong/fang react react-dom
```

```tsx
import { DockHost, DockPanel, ThemeProvider, useHotkeys } from "@baigong/fang";
// ⚠ 样式不会随主入口注入（刻意约定），必须显式导入：
import "@baigong/fang/tokens.css";
```

- 漏掉 `import "@baigong/fang/tokens.css"` 时 UI 无样式（token 变量缺失、文字仍是默认黑字）——主入口 JS 不携带任何样式，见 demo 与 `docs/工程骨架决策.md` 的取舍留档。
- peer 依赖：`react ^18 || ^19`；本包不直接依赖 `react-dom`。
- TS 消费方注意：本包 d.ts 保留了 css 副作用导入，请保持 `skipLibCheck: true`（Vite 脚手架默认开启）或自备 `declare module "*.css"` 声明，否则编译本包类型会报 TS2882。

**本地联调（alias 直连 src，不经构建产物）**

在消费工具的 vite 配置中加两条子路径规则，**先长后短**：

```ts
resolve: {
  alias: [
    { find: /^@baigong\/fang\/tokens\.css$/, replacement: "<fang 路径>/src/theme/tokens.css" },
    { find: /^@baigong\/fang$/, replacement: "<fang 路径>/src/index.ts" },
  ],
}
```

**`file:` 本地链接**

`file:` 依赖在本机 npm 10.9.7 实测为 **symlink**（`npm run smoke` 第④步持续记录实际形态）。注意 symlink 指向的是包目录而非产物：消费方经 exports 读到的**只有 `dist/` 产物**——fang 侧改 `src` 后需在 fang 重跑 `npm run build`，新 `dist` 即时对消费方生效、无需在消费方重装；若换环境后形态变为目录复制，则 fang 任何改动都需在消费方重新安装。想让 `src` 改动不经构建即时见效，一律走上面的 alias 联调轨。

