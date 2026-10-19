import { useEffect, useMemo, useRef } from "react";
import { matchesKeybinding, parseKeybinding, type ParsedKeybinding } from "./keybinding";

export type HotkeyHandler = (event: KeyboardEvent) => void;

export interface UseHotkeysOptions {
  /** 是否启用注册（默认 true），为 false 时不挂监听。 */
  enabled?: boolean;
}

/**
 * 声明式快捷键注册：`useHotkeys({ "Ctrl+Shift+S": handler })`。
 *
 * - 序列语法与归一规则见 keybinding.ts；非法序列在开发期于控制台告警并被忽略；
 * - 命中即 `preventDefault()` 后调用 handler（多键命中时仅触发首个匹配）；
 * - handler 引用每渲染可变（经 ref 透传），键位集合变化才重新挂监听。
 */
export function useHotkeys(
  bindings: Record<string, HotkeyHandler>,
  options: UseHotkeysOptions = {},
): void {
  const { enabled = true } = options;

  // 最新 bindings 经 ref 透传给监听器，避免 handler 变化导致反复解绑/重绑。
  const bindingsRef = useRef(bindings);
  useEffect(() => {
    bindingsRef.current = bindings;
  });

  // 键位集合 → 解析结果。非法序列记 warn（开发期可见），匹配时跳过。
  const keySequences = useMemo(() => Object.keys(bindings), [bindings]);
  const parsedMap = useMemo(() => {
    const map = new Map<string, ParsedKeybinding | null>();
    for (const sequence of keySequences) {
      const parsed = parseKeybinding(sequence);
      map.set(sequence, parsed);
      if (parsed === null) {
        console.warn(`[fang] useHotkeys 收到无法解析的快捷键序列，已忽略：${JSON.stringify(sequence)}`);
      }
    }
    return map;
  }, [keySequences]);

  useEffect(() => {
    if (!enabled) {
      return;
    }
    const onKeyDown = (event: KeyboardEvent) => {
      for (const [sequence, handler] of Object.entries(bindingsRef.current)) {
        const parsed = parsedMap.get(sequence);
        if (parsed === null || parsed === undefined) {
          continue;
        }
        if (matchesKeybinding(event, parsed)) {
          event.preventDefault();
          handler(event);
          return;
        }
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [enabled, parsedMap]);
}
