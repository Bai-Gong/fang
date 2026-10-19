import { useId, type CSSProperties, type ReactNode } from "react";

export interface DockPanelProps {
  /** 面板标题（渲染于标题栏）。 */
  title: string;
  /** 受控折叠状态：true 为折叠（仅剩标题栏）。 */
  collapsed: boolean;
  /** 折叠状态变化回调。缺省时面板不可由用户切换（纯展示受控）。 */
  onCollapsedChange?: (collapsed: boolean) => void;
  children?: ReactNode;
  className?: string;
  style?: CSSProperties;
}

/**
 * 停靠面板：标题栏 + 受控折叠 + 内容区。
 *
 * 首版刻意不做：拖拽、浮动、Tab 化、布局持久化（见 docs/工程骨架决策.md 推迟项）。
 * 视觉取值全部走设计 token 的 CSS 变量，需先引入 '@baigong/fang/tokens.css'。
 */
export function DockPanel({
  title,
  collapsed,
  onCollapsedChange,
  children,
  className,
  style,
}: DockPanelProps) {
  const bodyId = useId();
  const toggle = () => {
    onCollapsedChange?.(!collapsed);
  };

  const headerStyle: CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: "var(--fang-space-2)",
    width: "100%",
    padding: "var(--fang-space-2) var(--fang-space-3)",
    border: "none",
    borderTopLeftRadius: "var(--fang-radius-md)",
    borderTopRightRadius: "var(--fang-radius-md)",
    background: "var(--fang-color-bg-raised)",
    color: "var(--fang-color-text)",
    font: "var(--fang-font-size-sm)/1.4 var(--fang-font-family)",
    textAlign: "left",
    cursor: onCollapsedChange ? "pointer" : "default",
    userSelect: "none",
  };

  return (
    <section
      className={["fang-dock-panel", className].filter(Boolean).join(" ")}
      data-collapsed={collapsed ? "true" : "false"}
      style={{
        display: "flex",
        flexDirection: "column",
        minWidth: 0,
        border: "1px solid var(--fang-color-border)",
        borderRadius: "var(--fang-radius-md)",
        background: "var(--fang-color-bg)",
        ...style,
      }}
    >
      <button
        type="button"
        className="fang-dock-panel__header"
        style={headerStyle}
        aria-expanded={!collapsed}
        aria-controls={bodyId}
        onClick={toggle}
        disabled={!onCollapsedChange}
      >
        <span
          aria-hidden="true"
          style={{
            display: "inline-block",
            transition: "transform 120ms ease",
            transform: collapsed ? "rotate(-90deg)" : "none",
            color: "var(--fang-color-text-muted)",
            fontSize: "var(--fang-font-size-xs)",
          }}
        >
          ▼
        </span>
        <span>{title}</span>
      </button>
      {!collapsed && (
        <div
          id={bodyId}
          className="fang-dock-panel__body"
          style={{
            padding: "var(--fang-space-3)",
            color: "var(--fang-color-text-secondary)",
            font: "var(--fang-font-size-md)/1.5 var(--fang-font-family)",
            overflow: "auto",
            minHeight: 0,
          }}
        >
          {children}
        </div>
      )}
    </section>
  );
}
