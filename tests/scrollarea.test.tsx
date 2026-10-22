import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { createRef } from "react";
import { describe, expect, it, vi } from "vitest";
import { ScrollArea } from "../src/ui/ScrollArea";
import { dragToScroll, thumbMetrics, trackClickToScroll } from "../src/ui/scrollbarGeometry";

describe("scrollbarGeometry：thumb 几何", () => {
  it("thumb 长度按视口/内容占比，offset 随滚动推进", () => {
    // 视口 100、内容 300、轨道 100：thumb 100/3，行程 200/300 全程滚到底时 offset 到行程末端
    const m = thumbMetrics(100, 300, 0, 100);
    expect(m.visible).toBe(true);
    expect(m.thumbPx).toBeCloseTo(100 / 3, 4);
    expect(m.offsetPx).toBeCloseTo(0, 4);
    const half = thumbMetrics(100, 300, 100, 100); // 溢出 200 滚过一半
    expect(half.offsetPx).toBeCloseTo((1 / 2) * (100 - 100 / 3), 4);
    const end = thumbMetrics(100, 300, 200, 100); // 滚到底
    expect(end.offsetPx).toBeCloseTo(100 - 100 / 3, 4);
  });

  it("内容远超视口时 thumb 钳到最短可抓长度", () => {
    const m = thumbMetrics(100, 100_000, 0, 100, 24);
    expect(m.thumbPx).toBe(24);
  });

  it("内容不超过视口时不可见", () => {
    expect(thumbMetrics(100, 100, 0, 100).visible).toBe(false);
    expect(thumbMetrics(100, 100.5, 0, 100).visible).toBe(false);
  });

  it("offset 两端钳制（滚动越界不画出轨道）", () => {
    expect(thumbMetrics(100, 300, -50, 100).offsetPx).toBe(0);
    expect(thumbMetrics(100, 300, 999, 100).offsetPx).toBeCloseTo(100 - 100 / 3, 4);
  });
});

describe("scrollbarGeometry：指针→滚动映射", () => {
  it("拖拽：thumb 顶（左）端跟随指针，滚动量按行程比例换算并钳制", () => {
    // 视口 100、内容 300、轨道 100：行程 = 100 - 100/3；指针在轨道中点 → 滚动到溢出中点
    const mid = dragToScroll(50 - 100 / 6, 0, 100, 100, 300);
    expect(mid).toBeCloseTo(100, 4);
    expect(dragToScroll(-999, 0, 100, 100, 300)).toBe(0);
    expect(dragToScroll(9999, 0, 100, 100, 300)).toBe(200);
  });

  it("轨道空白点击：滚动到点击处居中于 thumb", () => {
    // 点击轨道末端 → 滚到底；点击起点 → 回顶
    expect(trackClickToScroll(100, 100, 100, 300)).toBeCloseTo(200, 4);
    expect(trackClickToScroll(0, 100, 100, 300)).toBe(0);
  });
});

describe("ScrollArea：渲染与回调", () => {
  it("渲染 children 与默认竖向轨道（role=scrollbar）", () => {
    render(
      <ScrollArea>
        <div>内容</div>
      </ScrollArea>,
    );
    expect(screen.getByText("内容")).toBeTruthy();
    const bars = screen.queryAllByRole("scrollbar");
    expect(bars).toHaveLength(1);
    expect(bars[0]!.getAttribute("aria-orientation")).toBe("vertical");
  });

  it("orientation=both 渲染横竖两条轨道；horizontal 只渲染横向", () => {
    const { rerender } = render(<ScrollArea orientation="both">x</ScrollArea>);
    expect(screen.queryAllByRole("scrollbar")).toHaveLength(2);
    rerender(<ScrollArea orientation="horizontal">x</ScrollArea>);
    const bars = screen.queryAllByRole("scrollbar");
    expect(bars).toHaveLength(1);
    expect(bars[0]!.getAttribute("aria-orientation")).toBe("horizontal");
  });

  it("onViewportChange 交付视口元素（挂载 el / 卸载 null）", () => {
    const onViewportChange = vi.fn();
    const { unmount } = render(
      <ScrollArea onViewportChange={onViewportChange}>x</ScrollArea>,
    );
    expect(onViewportChange).toHaveBeenCalledTimes(1);
    const el = onViewportChange.mock.calls[0]![0];
    expect(el).toBeInstanceOf(HTMLDivElement);
    expect(el.className).toContain("fang-scroll-area__viewport");
    unmount();
    expect(onViewportChange).toHaveBeenLastCalledWith(null);
  });

  it("视口滚动触发 onScroll 回调", async () => {
    const onScroll = vi.fn();
    const onViewportChange = vi.fn();
    render(
      <ScrollArea onViewportChange={onViewportChange} onScroll={onScroll}>
        x
      </ScrollArea>,
    );
    const el = onViewportChange.mock.calls[0]![0] as HTMLDivElement;
    fireEvent.scroll(el);
    await waitFor(() => expect(onScroll).toHaveBeenCalled());
  });

  it("隐藏原生滚动条的 scoped 样式只注入一次", () => {
    render(
      <>
        <ScrollArea>a</ScrollArea>
        <ScrollArea>b</ScrollArea>
      </>,
    );
    const tags = document.querySelectorAll("#fang-scroll-area-style");
    expect(tags).toHaveLength(1);
    expect(tags[0]!.textContent).toContain("::-webkit-scrollbar");
  });

  it("autoHide=false 时常显（data-active 初始即 true）", () => {
    render(<ScrollArea autoHide={false}>x</ScrollArea>);
    expect(document.querySelector(".fang-scroll-area")!.getAttribute("data-active")).toBe("true");
  });

  it("视口经回调 ref 可绑外部监听（消费方接线形态冒烟）", () => {
    const external = createRef<HTMLDivElement | null>();
    render(
      <ScrollArea
        onViewportChange={(el) => {
          external.current = el;
        }}
      >
        x
      </ScrollArea>,
    );
    expect(external.current).toBeInstanceOf(HTMLDivElement);
  });
});
