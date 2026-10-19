import { fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { DockHost } from "../src/dock/DockHost";
import { DockPanel } from "../src/dock/DockPanel";

describe("DockPanel：受控折叠", () => {
  it("展开时渲染 children", () => {
    render(
      <DockPanel title="面板" collapsed={false}>
        面板内容
      </DockPanel>,
    );
    expect(screen.getByText("面板内容")).toBeTruthy();
    expect(screen.getByRole("button", { name: /面板/ }).getAttribute("aria-expanded")).toBe("true");
  });

  it("折叠时不渲染 children，aria-expanded 为 false", () => {
    render(
      <DockPanel title="面板" collapsed={true}>
        面板内容
      </DockPanel>,
    );
    expect(screen.queryByText("面板内容")).toBeNull();
    expect(screen.getByRole("button", { name: /面板/ }).getAttribute("aria-expanded")).toBe("false");
  });

  it("点击标题栏回调 onCollapsedChange（展开 → 折叠）", () => {
    const onChange = vi.fn();
    render(
      <DockPanel title="面板" collapsed={false} onCollapsedChange={onChange}>
        内容
      </DockPanel>,
    );
    fireEvent.click(screen.getByRole("button", { name: /面板/ }));
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith(true);
  });

  it("未提供 onCollapsedChange 时点击不抛错也不变化（纯展示）", () => {
    render(
      <DockPanel title="面板" collapsed={false}>
        内容
      </DockPanel>,
    );
    const header = screen.getByRole("button", { name: /面板/ });
    expect(() => fireEvent.click(header)).not.toThrow();
    expect(screen.getByText("内容")).toBeTruthy();
  });

  it("受控状态随外部 state 切换（集成：折叠后 children 消失）", () => {
    function Harness() {
      const [collapsed, setCollapsed] = useState(false);
      return (
        <DockPanel title="面板" collapsed={collapsed} onCollapsedChange={setCollapsed}>
          内容
        </DockPanel>
      );
    }
    render(<Harness />);
    fireEvent.click(screen.getByRole("button", { name: /面板/ }));
    expect(screen.queryByText("内容")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: /面板/ }));
    expect(screen.getByText("内容")).toBeTruthy();
  });
});

describe("DockHost：三列布局壳", () => {
  it("渲染传入的左/中/右内容", () => {
    render(
      <DockHost left={<div>左翼</div>} center={<div>中央</div>} right={<div>右翼</div>} />,
    );
    expect(screen.getByText("左翼")).toBeTruthy();
    expect(screen.getByText("中央")).toBeTruthy();
    expect(screen.getByText("右翼")).toBeTruthy();
    expect(screen.getByText("左翼").closest("aside")?.getAttribute("data-side")).toBe("left");
    expect(screen.getByText("右翼").closest("aside")?.getAttribute("data-side")).toBe("right");
  });

  it("未传入的翼不渲染 aside", () => {
    const { container } = render(<DockHost center={<div>中央</div>} />);
    expect(container.querySelectorAll("aside")).toHaveLength(0);
    expect(screen.getByText("中央")).toBeTruthy();
  });

  it("与 DockPanel 组合可用", () => {
    render(
      <DockHost
        left={
          <DockPanel title="组合面板" collapsed={false}>
            组合内容
          </DockPanel>
        }
        center={<div>中央</div>}
      />,
    );
    expect(screen.getByText("组合内容")).toBeTruthy();
  });
});
