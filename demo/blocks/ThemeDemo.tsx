import { useFangTheme } from "../../src";

/** 主题演示：深色为唯一既定主题——展示 ThemeProvider 的 class 载体与 token 色板实际取值。 */
export function ThemeDemo() {
  const { theme } = useFangTheme();
  const swatches: Array<[label: string, cssVar: string]> = [
    ["bg", "var(--fang-color-bg)"],
    ["bg-raised", "var(--fang-color-bg-raised)"],
    ["accent", "var(--fang-color-accent)"],
    ["danger", "var(--fang-color-danger)"],
    ["warning", "var(--fang-color-warning)"],
    ["success", "var(--fang-color-success)"],
  ];
  return (
    <section aria-label="主题演示">
      <h2 style={{ fontSize: "var(--fang-font-size-lg)", margin: "0 0 var(--fang-space-2)" }}>
        主题：{theme}
        <span style={{ fontSize: "var(--fang-font-size-sm)", color: "var(--fang-color-text-muted)", marginLeft: "var(--fang-space-2)" }}>
          深色为默认且唯一主题，亮色在 roadmap
        </span>
      </h2>
      <div style={{ display: "flex", gap: "var(--fang-space-2)", flexWrap: "wrap" }}>
        {swatches.map(([label, value]) => (
          <div
            key={label}
            title={value}
            style={{
              width: 96,
              padding: "var(--fang-space-2)",
              borderRadius: "var(--fang-radius-md)",
              border: "1px solid var(--fang-color-border)",
              background: "var(--fang-color-bg-raised)",
            }}
          >
            <div style={{ height: 32, borderRadius: "var(--fang-radius-sm)", background: value }} />
            <code
              style={{
                display: "block",
                marginTop: "var(--fang-space-2)",
                fontSize: "var(--fang-font-size-xs)",
                fontFamily: "var(--fang-font-mono)",
                color: "var(--fang-color-text-secondary)",
              }}
            >
              {label}
            </code>
          </div>
        ))}
      </div>
    </section>
  );
}
