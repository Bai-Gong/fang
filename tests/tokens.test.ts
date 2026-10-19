import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { flattenTokenVars } from "../src/theme/tokens";

/**
 * tokens.css ↔ tokens.ts 双源一致性：
 * 两端各自展开为「--fang-* 变量名」集合，双向相等——改任一端漏同步另一端即红。
 */
const cssPath = join(dirname(fileURLToPath(import.meta.url)), "..", "src", "theme", "tokens.css");
const cssText = readFileSync(cssPath, "utf8");

function extractCssVars(text: string): Set<string> {
  return new Set(text.match(/--fang-[a-z0-9-]+/g) ?? []);
}

describe("tokens 双源一致性", () => {
  it("tokens.css 中全部变量名都在 tokens.ts 有镜像", () => {
    const cssVars = extractCssVars(cssText);
    const tsVars = new Set(flattenTokenVars());
    expect(tsVars.size).toBeGreaterThan(0);
    for (const name of cssVars) {
      expect(tsVars.has(name), `tokens.ts 缺少镜像：${name}`).toBe(true);
    }
  });

  it("tokens.ts 中全部变量名都在 tokens.css 有定义", () => {
    const cssVars = extractCssVars(cssText);
    for (const name of flattenTokenVars()) {
      expect(cssVars.has(name), `tokens.css 缺少定义：${name}`).toBe(true);
    }
  });

  it("变量名集合规模锁定（两端总数一致，防一边倒的双向检查假绿）", () => {
    expect(extractCssVars(cssText).size).toBe(flattenTokenVars().length);
  });
});
