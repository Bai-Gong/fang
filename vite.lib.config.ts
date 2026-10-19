import { defineConfig } from "vite";

/**
 * 库构建配置（对外产物）。类型产物由 tsc -p tsconfig.build.json 产出，本配置只管 JS/CSS。
 *
 * external 为硬性要求：vite 8（rolldown/oxc 底座）lib 模式不会自动外置 react——
 * 缺省时 React 会被整体打入产物（设计期探针实测 36,529 字节），违反 peerDependencies 契约，
 * 真实消费方会出现双 React 实例导致 hooks 崩溃；加上 external 后 132 字节、外部引用保留。
 * 防回归断言见 scripts/postbuild.mjs。vite 大版本升级时须重验（见 docs/工程骨架决策.md 留档⑦）。
 */
export default defineConfig({
  build: {
    lib: {
      entry: "src/index.ts",
      formats: ["es"],
      // 产物名显式钉死为 index：vite lib 默认按包名命名（@baigong/fang → fang.js），
      // 而 package.json exports 与 postbuild 断言均指向 dist/es/index.js，三处必须一致。
      fileName: () => "index.js",
    },
    outDir: "dist/es",
    rollupOptions: {
      external: [/^react($|\/)/, /^react-dom($|\/)/],
    },
  },
});
