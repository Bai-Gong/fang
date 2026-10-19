// smoke 验收 —— 模拟外部工程经 npm file: 安装 @baigong/fang 后的关键消费路径。
// 前置：仓库根先执行过 npm run build（dist/ 已产出）。五步：
// ① node 动态 import 主入口，断言公共 API 全量在册（外置 react 的 ESM 产物 node 可直接加载）；
// ② import.meta.resolve("@baigong/fang/tokens.css") 成功且文件存在、非空（显式样式入口）；
// ③ dist/types/index.d.ts 存在且非空（react@19 无自带 types，本包 d.ts 是消费方唯一类型来源）；
// ④ fs.lstat 记录 node_modules/@baigong/fang 的 symlink/目录复制形态（npm 对 file: 的实现事实）；
// ⑤ 任一步失败：非零退出。
import { existsSync, lstatSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const fail = (message) => {
  console.error(`[smoke] 失败：${message}`);
  process.exit(1);
};

// —— ① 主入口动态 import ——
let mod;
try {
  mod = await import("@baigong/fang");
} catch (error) {
  fail(`import "@baigong/fang" 抛错（先确认仓库根已跑过 npm run build）：${error}`);
}
const expectedExports = [
  "ThemeProvider",
  "useFangTheme",
  "tokens",
  "flattenTokenVars",
  "parseKeybinding",
  "normalizeKeybinding",
  "matchesKeybinding",
  "useHotkeys",
  "DockHost",
  "DockPanel",
];
for (const name of expectedExports) {
  if (!(name in mod)) {
    fail(`主入口缺少导出：${name}`);
  }
}
console.log(`[smoke] ① import @baigong/fang 成功，公共 API ${expectedExports.length} 项全量在册`);

// —— ② tokens.css 子路径解析 ——
let cssUrl;
try {
  cssUrl = import.meta.resolve("@baigong/fang/tokens.css");
} catch (error) {
  fail(`import.meta.resolve("@baigong/fang/tokens.css") 抛错：${error}`);
}
const cssPath = fileURLToPath(cssUrl);
if (!existsSync(cssPath)) {
  fail(`tokens.css 解析到 ${cssPath}，但文件不存在`);
}
const cssSize = statSync(cssPath).size;
if (cssSize === 0) {
  fail(`tokens.css（${cssPath}）为空`);
}
console.log(`[smoke] ② tokens.css 解析成功且非空（${cssSize} 字节）`);

// —— ③ d.ts 交付 ——
const entryPath = fileURLToPath(import.meta.resolve("@baigong/fang"));
// dist/es/index.js → 上溯三级即安装副本的包根
const packageRoot = dirname(dirname(dirname(entryPath)));
const dtsPath = join(packageRoot, "dist", "types", "index.d.ts");
if (!existsSync(dtsPath)) {
  fail(`缺少 ${dtsPath}——npm run build 的 tsc 产型环节疑似未执行`);
}
const dtsSize = statSync(dtsPath).size;
if (dtsSize === 0) {
  fail(`dist/types/index.d.ts 为空`);
}
console.log(`[smoke] ③ dist/types/index.d.ts 存在且非空（${dtsSize} 字节）`);

// —— ④ file: 链接形态记录 ——
// 注意：node ESM 默认走 realpath（--preserve-symlinks 关闭），symlink 形态下
// resolve("@baigong/fang") 会直接落到仓库真实路径（上面 entryPath 即证据）。
// 因此安装副本位置从 verify.mjs 自身推导，与 resolve 行为解耦。
const smokeDir = dirname(fileURLToPath(import.meta.url));
const installedPath = join(smokeDir, "node_modules", "@baigong", "fang");
if (!existsSync(installedPath)) {
  fail(`未找到安装副本 ${installedPath}`);
}
console.log(`[smoke]    （resolve 主入口落在：${entryPath}）`);
const stats = lstatSync(installedPath);
const linkKind = stats.isSymbolicLink()
  ? "symlink"
  : stats.isDirectory()
    ? "directory-copy"
    : `other(${stats.mode})`;
console.log(`[smoke] ④ node_modules/@baigong/fang 链接形态：${linkKind}`);
console.log("[smoke] 全部通过");
