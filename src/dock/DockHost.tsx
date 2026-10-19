import type { CSSProperties, ReactNode } from "react";

/** 停靠位。首版仅左/右两翼（顶/底等真实需求出现再进）。 */
export type DockSide = "left" | "right";

export interface DockHostProps {
  /** 左停靠栏内容。 */
  left?: ReactNode;
  /** 中央工作区内容。 */
  center?: ReactNode;
  /** 右停靠栏内容。 */
  right?: ReactNode;
  /** 停靠栏宽度（默认 260px）。 */
  sideWidth?: number | string;
  className?: string;
  style?: CSSProperties;
}

/**
 * 停靠容器壳：left | center | right 三列布局，仅布局不含拖拽。
 * 未传入的翼不占列。视觉取值走设计 token 变量。
 */
export function DockHost({
  left,
  center,
  right,
  sideWidth = 260,
  className,
  style,
}: DockHostProps) {
  const columns = [left ? `${typeof sideWidth === "number" ? `${sideWidth}px` : sideWidth}` : "", "1fr", right ? `${typeof sideWidth === "number" ? `${sideWidth}px` : sideWidth}` : ""]
    .filter(Boolean)
    .join(" ");

  const sideStyle: CSSProperties = {
    display: "flex",
    flexDirection: "column",
    gap: "var(--fang-space-3)",
    minWidth: 0,
    minHeight: 0,
    overflow: "auto",
    padding: "var(--fang-space-3)",
  };

  return (
    <div
      className={["fang-dock-host", className].filter(Boolean).join(" ")}
      style={{
        display: "grid",
        gridTemplateColumns: columns,
        gap: "var(--fang-space-3)",
        width: "100%",
        minHeight: 0,
        flex: 1,
        zIndex: "var(--fang-z-dock)",
        ...style,
      }}
    >
      {left && (
        <aside className="fang-dock-host__side fang-dock-host__side--left" data-side="left" style={sideStyle}>
          {left}
        </aside>
      )}
      <div
        className="fang-dock-host__center"
        style={{
          minWidth: 0,
          minHeight: 0,
          padding: "var(--fang-space-3)",
          border: "1px solid var(--fang-color-border)",
          borderRadius: "var(--fang-radius-md)",
          background: "var(--fang-color-bg)",
          overflow: "auto",
        }}
      >
        {center}
      </div>
      {right && (
        <aside className="fang-dock-host__side fang-dock-host__side--right" data-side="right" style={sideStyle}>
          {right}
        </aside>
      )}
    </div>
  );
}
