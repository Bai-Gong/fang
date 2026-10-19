import reactHooks from "eslint-plugin-react-hooks";
import tseslint from "typescript-eslint";

/**
 * ESLint 10 flat config：typescript-eslint 8（非 type-aware，快速门禁）+ react-hooks 7。
 * 不引入 @eslint/js 核心规则集：TS 编译器已覆盖 no-undef 一类问题，保持依赖面最小。
 */
export default tseslint.config(
  {
    ignores: ["dist/**", "dist-demo/**", "coverage/**", "smoke/node_modules/**", ".zcode/**"],
  },
  ...tseslint.configs.recommended,
  {
    files: ["**/*.{ts,tsx}"],
    plugins: {
      "react-hooks": reactHooks,
    },
    rules: {
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
    },
  },
);
