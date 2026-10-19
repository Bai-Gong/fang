// postbuild —— 库构建（vite lib + tsc 产型）之后的交付整理与防回归断言，四职责：
// ① 复制 src/theme/tokens.css → dist/tokens.css（对外样式唯一入口，复制后断言非空）；
// ② 清理 dist/es/*.css 孤儿（vite lib 会把 entry 图谱里的 css 抽成独立 [name].css，
//    产物名依赖入口/包名，不写死文件名，glob 清理；对外样式只走 dist/tokens.css）；
// ③ React 外置双向断言：dist/es/index.js 必须含 from"react" 外部引用（external 生效），
//    且不得含 Symbol.for("react. 内部标记（React 被整体打入的特征，含 react/jsx-runtime）；
// ④ 任一断言失败：非零退出（把「React 被打入」「样式缺失」两类回归拦在 build 门禁，早于 smoke）。
import { copyFileSync, existsSync, readdirSync, readFileSync, rmSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));

const fail = (message) => {
  console.error(`[postbuild] 失败：${message}`);
  process.exit(1);
};

// —— ① tokens.css 复制 ——
const tokensSrc = join(root, "src", "theme", "tokens.css");
const tokensDist = join(root, "dist", "tokens.css");
if (!existsSync(tokensSrc)) {
  fail(`缺少 ${tokensSrc}，无法复制 tokens.css`);
}
copyFileSync(tokensSrc, tokensDist);
const tokensSize = statSync(tokensDist).size;
if (tokensSize === 0) {
  fail("dist/tokens.css 为空");
}
console.log(`[postbuild] ① tokens.css → dist/tokens.css（${tokensSize} 字节）`);

// —— ② 清理 dist/es/*.css 孤儿 ——
const esDir = join(root, "dist", "es");
if (!existsSync(esDir)) {
  fail(`缺少 ${esDir}，vite lib 构建产物缺失`);
}
let removedCss = 0;
for (const name of readdirSync(esDir)) {
  if (name.endsWith(".css")) {
    rmSync(join(esDir, name));
    console.log(`[postbuild] ② 清理孤儿样式 ${name}`);
    removedCss += 1;
  }
}
if (removedCss === 0) {
  console.log("[postbuild] ② 无孤儿样式需要清理");
}

// —— ③ React 外置双向断言 ——
const bundlePath = join(esDir, "index.js");
if (!existsSync(bundlePath)) {
  fail(`缺少 ${bundlePath}，vite lib 产物名与预期不符`);
}
const code = readFileSync(bundlePath, "utf8");
const hasExternalReactImport = /from\s*["']react(\/[a-z-]+)?["']/.test(code);
if (!hasExternalReactImport) {
  fail(
    "dist/es/index.js 不含 from\"react\" 外部引用——external 配置疑似失效，" +
      "请检查 vite.lib.config.ts 的 rollupOptions.external（见 docs/工程骨架决策.md 留档⑦）",
  );
}
if (code.includes('Symbol.for("react.')) {
  fail(
    'dist/es/index.js 含 Symbol.for("react. 内部标记——React（或 react/jsx-runtime）被整体打入产物，' +
      "违反 peerDependencies 契约，真实消费方将出现双 React 实例",
  );
}
console.log(`[postbuild] ③ React 外置断言通过（bundle ${code.length} 字节，保留外部 react 引用）`);
console.log("[postbuild] 全部断言通过");
