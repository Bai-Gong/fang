import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { TitleBar } from "../src/ui/TitleBar";
import { defaultMenus, type MenuEntry } from "../src/ui/menu";
import {
  getWindowAdapter,
  installWindowAdapter,
  uninstallWindowAdapter,
  type WindowAdapter,
} from "../src/ui/windowAdapter";

const MENUS: MenuEntry[] = [
  {
    label: "文件",
    items: [
      { kind: "item", label: "导入素材…", hint: "Ctrl+I" },
      { kind: "separator" },
      { kind: "item", label: "导出 MP4…", onSelect: vi.fn() },
    ],
  },
  { label: "帮助", items: [{ kind: "item", label: "关于", onSelect: vi.fn() }] },
];

function makeAdapter(overrides: Partial<WindowAdapter> = {}): WindowAdapter {
  return {
    minimize: vi.fn(),
    toggleMaximize: vi.fn(),
    close: vi.fn(),
    isMaximized: vi.fn().mockResolvedValue(false),
    onMaximizeChange: vi.fn(() => () => {}),
    ...overrides,
  };
}

afterEach(() => {
  uninstallWindowAdapter();
});

describe("defaultMenus：动作剪除", () => {
  it("只给撤销 → 编辑菜单只有撤销；给关于 → 帮助菜单出现", () => {
    const menus = defaultMenus({ onUndo: () => {}, onAbout: () => {} });
    expect(menus.map((m) => m.label)).toEqual(["编辑", "帮助"]);
    expect(menus[0]!.items).toHaveLength(1);
    expect(menus[0]!.items[0]).toMatchObject({ kind: "item", label: "撤销" });
  });

  it("撤销重做都给 → 编辑两项；全不给 → 空数组（应用全自定义）", () => {
    expect(defaultMenus({ onUndo: () => {}, onRedo: () => {} })[0]!.items).toHaveLength(2);
    expect(defaultMenus({})).toEqual([]);
  });
});

describe("TitleBar：结构与拖动区", () => {
  it("渲染应用名/居中槽/动作槽，根与空白区带拖动区标记", () => {
    render(
      <TitleBar appName="百工·剪" center={<span>工程名</span>} actions={<button>导出</button>} />,
    );
    expect(screen.getByText("百工·剪")).toBeTruthy();
    expect(screen.getByText("工程名")).toBeTruthy();
    expect(screen.getByRole("button", { name: "导出" })).toBeTruthy();
    const root = document.querySelector(".fang-title-bar")!;
    expect(root.hasAttribute("data-tauri-drag-region")).toBe(true);
    expect(root.querySelectorAll("[data-tauri-drag-region]").length).toBeGreaterThanOrEqual(2);
  });

  it("无 menus 时不渲染菜单栏", () => {
    render(<TitleBar appName="x" />);
    expect(screen.queryByRole("menubar")).toBeNull();
    expect(document.querySelector(".fang-title-bar nav")).toBeNull();
  });
});

describe("TitleBar：菜单交互", () => {
  it("点开顶级菜单展示条目；点动作项触发 onSelect 并关闭", () => {
    render(<TitleBar appName="x" menus={MENUS} />);
    fireEvent.click(screen.getByRole("button", { name: "文件" }));
    expect(screen.getByRole("menu", { name: "文件" })).toBeTruthy();
    const item = screen.getByRole("menuitem", { name: /导出 MP4…/ });
    fireEvent.click(item);
    const onSelect = (MENUS[0]!.items[2] as { onSelect?: () => void }).onSelect;
    expect(onSelect).toHaveBeenCalled();
    expect(screen.queryByRole("menu")).toBeNull();
  });

  it("再点同一顶级菜单关闭；悬停切换到相邻菜单", () => {
    render(<TitleBar appName="x" menus={MENUS} />);
    const file = screen.getByRole("button", { name: "文件" });
    fireEvent.click(file);
    expect(screen.getByRole("menu", { name: "文件" })).toBeTruthy();
    fireEvent.click(file); // 再点关闭
    expect(screen.queryByRole("menu")).toBeNull();
    fireEvent.click(file); // 重新打开
    fireEvent.pointerEnter(screen.getByRole("button", { name: "帮助" }));
    expect(screen.queryByRole("menu", { name: "文件" })).toBeNull();
    expect(screen.getByRole("menu", { name: "帮助" })).toBeTruthy();
  });

  it("点外部与 Esc 关闭菜单", () => {
    render(
      <>
        <TitleBar appName="x" menus={MENUS} />
        <div>页面其他区域</div>
      </>,
    );
    fireEvent.click(screen.getByRole("button", { name: "文件" }));
    expect(screen.getByRole("menu")).toBeTruthy();
    fireEvent.pointerDown(screen.getByText("页面其他区域"), { buttons: 1 });
    expect(screen.queryByRole("menu")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "帮助" }));
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("menu")).toBeNull();
  });

  it("disabled 条目不触发 onSelect；分隔线渲染为 separator", () => {
    const onSelect = vi.fn();
    const menus: MenuEntry[] = [
      { label: "文件", items: [{ kind: "item", label: "灰项", disabled: true, onSelect }, { kind: "separator" }] },
    ];
    render(<TitleBar appName="x" menus={menus} />);
    fireEvent.click(screen.getByRole("button", { name: "文件" }));
    const item = screen.getByRole("menuitem", { name: /灰项/ });
    expect(item.getAttribute("aria-disabled")).toBe("true");
    fireEvent.click(item);
    expect(onSelect).not.toHaveBeenCalled();
    expect(screen.getByRole("separator")).toBeTruthy();
  });
});

describe("TitleBar：窗口三键（适配器）", () => {
  it("未注入适配器：三键 aria-disabled，点击不抛错", () => {
    render(<TitleBar appName="x" />);
    for (const label of ["最小化", "最大化", "关闭"]) {
      const btn = screen.getByRole("button", { name: label });
      expect(btn.getAttribute("aria-disabled")).toBe("true");
      expect(() => fireEvent.click(btn)).not.toThrow();
    }
  });

  it("注入适配器：三键调用对应方法", async () => {
    const adapter = makeAdapter();
    installWindowAdapter(adapter);
    render(<TitleBar appName="x" />);
    fireEvent.click(screen.getByRole("button", { name: "最小化" }));
    await waitFor(() => expect(adapter.minimize).toHaveBeenCalled());
    fireEvent.click(screen.getByRole("button", { name: "关闭" }));
    await waitFor(() => expect(adapter.close).toHaveBeenCalled());
  });

  it("最大化状态经 onMaximizeChange 回传后切到「向下还原」", async () => {
    let notify: ((m: boolean) => void) | null = null;
    installWindowAdapter(
      makeAdapter({
        isMaximized: vi.fn().mockResolvedValue(false),
        onMaximizeChange: (cb) => {
          notify = cb;
          return () => {};
        },
      }),
    );
    render(<TitleBar appName="x" />);
    const maxBtn = screen.getByRole("button", { name: "最大化" });
    await waitFor(() => expect(maxBtn).toBeTruthy());
    act(() => notify?.(true));
    expect(screen.getByRole("button", { name: "向下还原" })).toBeTruthy();
  });

  it("getWindowAdapter 返回注入实例，卸载后为 null", () => {
    const adapter = makeAdapter();
    installWindowAdapter(adapter);
    expect(getWindowAdapter()).toBe(adapter);
    uninstallWindowAdapter();
    expect(getWindowAdapter()).toBeNull();
  });
});
