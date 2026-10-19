/**
 * 快捷键序列解析与匹配 —— 纯函数，无 DOM 依赖，可全量单测。
 *
 * 首版只覆盖「字符串序列 → 键盘事件匹配」的公共子集；
 * macOS 平台键（Cmd 之外的 Ctrl 等价物）、chord 序列（"Ctrl+K Ctrl+S"）等
 * 等真实工具需求出现再进（见 docs/工程骨架决策.md 推迟项）。
 */

/** 修饰键（规范名）。 */
export type Modifier = "ctrl" | "alt" | "shift" | "meta";

/** 解析结果。modifiers 恒为规范顺序（ctrl → alt → shift → meta）。 */
export interface ParsedKeybinding {
  modifiers: Modifier[];
  /** 规范化（小写）后的主键名，如 "s"、"f2"、"escape"。 */
  key: string;
  /** 规范化后的完整序列，如 "ctrl+shift+s"。 */
  normalized: string;
}

/** 修饰键规范顺序。 */
const MODIFIER_ORDER: readonly Modifier[] = ["ctrl", "alt", "shift", "meta"];

/** 修饰键别名归一表（cmd/command/win/super → meta，option → alt，control → ctrl）。 */
const MODIFIER_ALIASES: Readonly<Record<string, Modifier>> = {
  ctrl: "ctrl",
  control: "ctrl",
  alt: "alt",
  option: "alt",
  shift: "shift",
  meta: "meta",
  cmd: "meta",
  command: "meta",
  win: "meta",
  super: "meta",
};

/** matchesKeybinding 所需的最小事件面（测试可伪造）。 */
export interface KeybindingEvent {
  ctrlKey: boolean;
  altKey: boolean;
  shiftKey: boolean;
  metaKey: boolean;
  key: string;
}

/**
 * 解析快捷键序列。规则：
 * - 以 `+` 分段，段两端空白容忍，大小写不敏感；
 * - 修饰键别名归一并按规范顺序重排；
 * - 末段（或唯一段）必须是主键：非空且不是修饰键名；
 * - 重复修饰键、空段、空串、含多个非修饰段均视为非法。
 *
 * 非法输入返回 null，不抛错（调用方自行决定告警策略）。
 */
export function parseKeybinding(sequence: string): ParsedKeybinding | null {
  if (typeof sequence !== "string" || sequence.trim() === "") {
    return null;
  }
  const parts = sequence.split("+").map((part) => part.trim().toLowerCase());
  if (parts.some((part) => part === "")) {
    return null;
  }

  const modifiers = new Set<Modifier>();
  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i]!;
    const modifier = MODIFIER_ALIASES[part];
    if (!modifier) {
      return null; // 修饰位出现了非修饰键（如 "a+b"）
    }
    if (modifiers.has(modifier)) {
      return null; // 重复修饰键（如 "Ctrl+Ctrl+S"）
    }
    modifiers.add(modifier);
  }

  const key = parts[parts.length - 1]!;
  if (MODIFIER_ALIASES[key] !== undefined) {
    return null; // 只有修饰键没有主键（如 "Ctrl+Shift"）
  }

  const ordered = MODIFIER_ORDER.filter((m) => modifiers.has(m));
  const normalized = [...ordered, key].join("+");
  return { modifiers: ordered, key, normalized };
}

/** 规范化序列字符串（"Shift+Ctrl+S" → "ctrl+shift+s"）；非法输入返回 null。 */
export function normalizeKeybinding(sequence: string): string | null {
  return parseKeybinding(sequence)?.normalized ?? null;
}

/**
 * 判断键盘事件是否命中已解析的键位。
 * 注意字母键在按下 Shift 时 `event.key` 为大写，此处统一小写比较。
 */
export function matchesKeybinding(event: KeybindingEvent, parsed: ParsedKeybinding): boolean {
  const pressed: Record<Modifier, boolean> = {
    ctrl: event.ctrlKey,
    alt: event.altKey,
    shift: event.shiftKey,
    meta: event.metaKey,
  };
  return (
    MODIFIER_ORDER.every((m) => pressed[m] === parsed.modifiers.includes(m)) &&
    event.key.toLowerCase() === parsed.key
  );
}
