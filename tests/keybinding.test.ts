import { describe, expect, it } from "vitest";
import { matchesKeybinding, normalizeKeybinding, parseKeybinding, type KeybindingEvent } from "../src/commands/keybinding";

describe("parseKeybinding：基础解析", () => {
  it("解析单修饰键组合", () => {
    expect(parseKeybinding("Ctrl+S")).toEqual({
      modifiers: ["ctrl"],
      key: "s",
      normalized: "ctrl+s",
    });
  });

  it("解析多修饰键组合", () => {
    expect(parseKeybinding("Ctrl+Shift+S")).toEqual({
      modifiers: ["ctrl", "shift"],
      key: "s",
      normalized: "ctrl+shift+s",
    });
  });

  it("解析裸键（无修饰键）", () => {
    expect(parseKeybinding("F2")).toEqual({ modifiers: [], key: "f2", normalized: "f2" });
    expect(parseKeybinding("s")).toEqual({ modifiers: [], key: "s", normalized: "s" });
  });
});

describe("parseKeybinding：大小写不敏感", () => {
  it("全大写序列归一为小写", () => {
    expect(parseKeybinding("CTRL+SHIFT+S")?.normalized).toBe("ctrl+shift+s");
  });

  it("混合大小写", () => {
    expect(parseKeybinding("Ctrl+Shift+Escape")?.key).toBe("escape");
    expect(parseKeybinding("cTrL+k")?.normalized).toBe("ctrl+k");
  });
});

describe("parseKeybinding：修饰键顺序规范化与别名归一", () => {
  it("乱序修饰键重排为 ctrl → alt → shift → meta", () => {
    expect(parseKeybinding("Shift+Ctrl+S")?.modifiers).toEqual(["ctrl", "shift"]);
    expect(parseKeybinding("Meta+Alt+Shift+Ctrl+S")?.modifiers).toEqual(["ctrl", "alt", "shift", "meta"]);
    expect(parseKeybinding("Meta+Alt+Shift+Ctrl+S")?.normalized).toBe("ctrl+alt+shift+meta+s");
  });

  it("别名归一：control→ctrl、cmd/command/win/super→meta、option→alt", () => {
    expect(parseKeybinding("Control+S")?.normalized).toBe("ctrl+s");
    expect(parseKeybinding("Cmd+S")?.normalized).toBe("meta+s");
    expect(parseKeybinding("Command+S")?.normalized).toBe("meta+s");
    expect(parseKeybinding("Win+K")?.normalized).toBe("meta+k");
    expect(parseKeybinding("Super+K")?.normalized).toBe("meta+k");
    expect(parseKeybinding("Option+K")?.normalized).toBe("alt+k");
  });

  it("别名与规范名同用不重复（Ctrl+Control+S 非法）", () => {
    expect(parseKeybinding("Ctrl+Control+S")).toBeNull();
    expect(parseKeybinding("Cmd+Meta+K")).toBeNull();
  });

  it("段两端空白容忍", () => {
    expect(parseKeybinding(" Ctrl + S ")?.normalized).toBe("ctrl+s");
  });
});

describe("parseKeybinding：非法序列", () => {
  it.each([
    ["空字符串", ""],
    ["纯空白", "   "],
    ["尾随空主键", "Ctrl+"],
    ["前导空段", "+S"],
    ["中间空段", "Ctrl++S"],
    ["仅修饰键无主键", "Ctrl+Shift"],
    ["仅单个修饰键", "Ctrl"],
    ["重复修饰键", "Ctrl+Ctrl+S"],
    ["修饰位出现非修饰键", "A+B"],
    ["主键位是修饰键别名", "S+Ctrl"],
  ])("%s → null：%s", (_label, input) => {
    expect(parseKeybinding(input as string)).toBeNull();
  });
});

describe("normalizeKeybinding", () => {
  it("返回规范化序列", () => {
    expect(normalizeKeybinding("Shift+Ctrl+S")).toBe("ctrl+shift+s");
  });

  it("非法输入返回 null", () => {
    expect(normalizeKeybinding("Ctrl+")).toBeNull();
  });
});

describe("matchesKeybinding", () => {
  const event = (overrides: Partial<KeybindingEvent> = {}): KeybindingEvent => ({
    ctrlKey: false,
    altKey: false,
    shiftKey: false,
    metaKey: false,
    key: "s",
    ...overrides,
  });

  it("修饰键与主键全中则命中", () => {
    expect(matchesKeybinding(event({ ctrlKey: true, shiftKey: true }), parseKeybinding("Ctrl+Shift+S")!)).toBe(true);
  });

  it("Shift 下字母键为大写仍命中（统一小写比较）", () => {
    expect(matchesKeybinding(event({ ctrlKey: true, shiftKey: true, key: "S" }), parseKeybinding("Ctrl+Shift+S")!)).toBe(true);
  });

  it("缺修饰键不命中", () => {
    expect(matchesKeybinding(event({ ctrlKey: true }), parseKeybinding("Ctrl+Shift+S")!)).toBe(false);
  });

  it("多出修饰键不命中", () => {
    expect(matchesKeybinding(event({ ctrlKey: true, altKey: true }), parseKeybinding("Ctrl+S")!)).toBe(false);
  });

  it("主键不同不命中", () => {
    expect(matchesKeybinding(event({ ctrlKey: true, key: "k" }), parseKeybinding("Ctrl+S")!)).toBe(false);
  });

  it("裸键（无修饰）匹配", () => {
    expect(matchesKeybinding(event({ key: "F2" }), parseKeybinding("F2")!)).toBe(true);
  });
});
