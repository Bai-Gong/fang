import { ScrollArea } from "../../src";

/** 滚动条演示：竖向长列表 + 横向宽内容 + 双向大画布，三种 orientation 一屏对照。 */
export function ScrollAreaDemo() {
  return (
    <section aria-label="滚动条演示">
      <h2 style={{ fontSize: "var(--fang-font-size-lg)", margin: "0 0 var(--fang-space-2)" }}>
        ScrollArea
        <span style={{ fontSize: "var(--fang-font-size-sm)", color: "var(--fang-color-text-muted)", marginLeft: "var(--fang-space-2)" }}>
          自绘滚动条：悬停/滚动/拖拽时可见，闲置淡出
        </span>
      </h2>
      <div style={{ display: "flex", gap: "var(--fang-space-3)", alignItems: "flex-start", flexWrap: "wrap" }}>
        <div style={{ width: 220 }}>
          <p style={{ margin: "0 0 var(--fang-space-1)", fontSize: "var(--fang-font-size-sm)", color: "var(--fang-color-text-muted)" }}>
            vertical（长列表）
          </p>
          <ScrollArea orientation="vertical" style={{ height: 200, border: "1px solid var(--fang-color-border)", borderRadius: "var(--fang-radius-md)", background: "var(--fang-color-bg-raised)" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--fang-space-2)", padding: "var(--fang-space-2)" }}>
              {Array.from({ length: 30 }, (_, i) => (
                <div
                  key={i}
                  style={{
                    padding: "var(--fang-space-2)",
                    borderRadius: "var(--fang-radius-sm)",
                    border: "1px solid var(--fang-color-border)",
                    fontSize: "var(--fang-font-size-sm)",
                  }}
                >
                  条目 {i + 1}
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
        <div style={{ width: 320 }}>
          <p style={{ margin: "0 0 var(--fang-space-1)", fontSize: "var(--fang-font-size-sm)", color: "var(--fang-color-text-muted)" }}>
            horizontal（宽内容）
          </p>
          <ScrollArea orientation="horizontal" style={{ height: 120, border: "1px solid var(--fang-color-border)", borderRadius: "var(--fang-radius-md)", background: "var(--fang-color-bg-raised)" }}>
            <div style={{ display: "flex", gap: "var(--fang-space-2)", padding: "var(--fang-space-2)", width: 1200 }}>
              {Array.from({ length: 12 }, (_, i) => (
                <div
                  key={i}
                  style={{
                    flex: "none",
                    width: 80,
                    height: 64,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: "var(--fang-radius-sm)",
                    border: "1px solid var(--fang-color-border)",
                    fontSize: "var(--fang-font-size-sm)",
                  }}
                >
                  {i + 1}
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
        <div style={{ width: 260 }}>
          <p style={{ margin: "0 0 var(--fang-space-1)", fontSize: "var(--fang-font-size-sm)", color: "var(--fang-color-text-muted)" }}>
            both（大画布）
          </p>
          <ScrollArea orientation="both" style={{ height: 200, border: "1px solid var(--fang-color-border)", borderRadius: "var(--fang-radius-md)", background: "var(--fang-color-bg-raised)" }}>
            <div style={{ width: 1600, height: 1200, position: "relative" }}>
              <div style={{ position: "absolute", left: 16, top: 12, fontSize: "var(--fang-font-size-sm)", color: "var(--fang-color-text-muted)" }}>
                画布左上 (0, 0)
              </div>
              <div style={{ position: "absolute", right: 16, bottom: 12, fontSize: "var(--fang-font-size-sm)", color: "var(--fang-color-text-muted)" }}>
                画布右下 (1600, 1200)
              </div>
            </div>
          </ScrollArea>
        </div>
      </div>
    </section>
  );
}
