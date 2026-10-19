import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

/**
 * demo 站配置（root 为 demo/，npm run dev 即起 demo/index.html）。
 * 库构建走 vite.lib.config.ts，两者共用同一 vite 8。
 * test 块仅供 vitest：测试根显式指回仓库根，使 tests/ 不受 demo root 影响。
 */
export default defineConfig({
  root: "demo",
  plugins: [react()],
  build: {
    outDir: "../dist-demo",
    emptyOutDir: true,
  },
  test: {
    environment: "jsdom",
    globals: true, // @testing-library/react 依赖全局 afterEach 注册自动 cleanup
    root: ".",
    include: ["tests/**/*.test.{ts,tsx}"],
  },
});
