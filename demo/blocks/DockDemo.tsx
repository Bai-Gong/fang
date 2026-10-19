import { useState, type ReactNode } from "react";
import { DockHost, DockPanel } from "../../src";

/** 停靠演示：DockHost 三列 + DockPanel 受控折叠（无拖拽，拖拽在 roadmap）。 */
export function DockDemo() {
  const [leftCollapsed, setLeftCollapsed] = useState(false);
  const [rightCollapsed, setRightCollapsed] = useState(true);

  const panel = (
    title: string,
    collapsed: boolean,
    onChange: ((next: boolean) => void) | undefined,
    body: ReactNode,
  ) => (
    <DockPanel title={title} collapsed={collapsed} onCollapsedChange={onChange}>
      {body}
    </DockPanel>
  );

  return (
    <section aria-label="停靠演示">
      <h2 style={{ fontSize: "var(--fang-font-size-lg)", margin: "0 0 var(--fang-space-2)" }}>
        停靠面板
        <span style={{ fontSize: "var(--fang-font-size-sm)", color: "var(--fang-color-text-muted)", marginLeft: "var(--fang-space-2)" }}>
          点击标题栏折叠/展开
        </span>
      </h2>
      <div style={{ height: 240 }}>
        <DockHost
          sideWidth={240}
          left={
            <>
              {panel("面板 A（左）", leftCollapsed, setLeftCollapsed, "左停靠栏面板，受控折叠。")}
              {panel("面板 B（左）", false, undefined, "未提供 onCollapsedChange，纯展示不可折叠。")}
            </>
          }
          center={
            <p style={{ margin: 0, color: "var(--fang-color-text-secondary)" }}>
              中央工作区。左翼两块面板、右翼一块（默认折叠），均为朴素布局壳。
            </p>
          }
          right={panel("面板 C（右）", rightCollapsed, setRightCollapsed, "右停靠栏面板。")}
        />
      </div>
    </section>
  );
}
