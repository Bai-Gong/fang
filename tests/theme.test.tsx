import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ThemeProvider, useFangTheme } from "../src/theme/ThemeProvider";

describe("ThemeProvider", () => {
  it("容器挂深色主题 class 与 data 标记（深色默认）", () => {
    const { container } = render(
      <ThemeProvider>
        <p>内容</p>
      </ThemeProvider>,
    );
    const host = container.querySelector(".fang-theme-dark");
    expect(host).not.toBeNull();
    expect(host?.getAttribute("data-fang-theme")).toBe("dark");
    expect(host?.textContent).toBe("内容");
  });

  it("主题载体承担满高布局（height:100%），不断工具外壳的高度链", () => {
    const { container } = render(
      <ThemeProvider>
        <p>内容</p>
      </ThemeProvider>,
    );
    const host = container.querySelector<HTMLElement>(".fang-theme-dark");
    expect(host?.style.height).toBe("100%");
  });

  it("useFangTheme 在 Provider 内读到 dark", () => {
    let seen: string | undefined;
    function Probe() {
      seen = useFangTheme().theme;
      return null;
    }
    render(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>,
    );
    expect(seen).toBe("dark");
  });

  it("useFangTheme 在 Provider 外回退默认深色", () => {
    let seen: string | undefined;
    function Probe() {
      seen = useFangTheme().theme;
      return null;
    }
    render(<Probe />);
    expect(seen).toBe("dark");
  });

  it("渲染内容可通过 screen 查到（jsdom 环境连通）", () => {
    render(
      <ThemeProvider>
        <span>fang-probe</span>
      </ThemeProvider>,
    );
    expect(screen.getByText("fang-probe")).toBeTruthy();
  });
});
