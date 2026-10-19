import { useState } from "react";
import { useHotkeys } from "../../src";

/** 快捷键演示：声明式注册，按键命中即在下方追加记录。 */
export function HotkeysDemo() {
  const [hits, setHits] = useState<string[]>([]);
  const record = (sequence: string) => {
    setHits((prev) => [`[${new Date().toLocaleTimeString()}] ${sequence}`, ...prev].slice(0, 5));
  };

  useHotkeys({
    "Ctrl+Shift+K": () => record("Ctrl+Shift+K"),
    "Ctrl+K": () => record("Ctrl+K"),
    "Alt+D": () => record("Alt+D"),
    "F2": () => record("F2"),
  });

  return (
    <section aria-label="快捷键演示">
      <h2 style={{ fontSize: "var(--fang-font-size-lg)", margin: "0 0 var(--fang-space-2)" }}>
        快捷键
        <span style={{ fontSize: "var(--fang-font-size-sm)", color: "var(--fang-color-text-muted)", marginLeft: "var(--fang-space-2)" }}>
          试按 Ctrl+K / Ctrl+Shift+K / Alt+D / F2
        </span>
      </h2>
      <ol style={{ margin: 0, paddingLeft: "var(--fang-space-5)", fontFamily: "var(--fang-font-mono)", fontSize: "var(--fang-font-size-sm)", color: "var(--fang-color-text-secondary)" }}>
        {hits.length === 0 ? <li>尚未触发任何快捷键</li> : hits.map((hit, index) => <li key={index}>{hit}</li>)}
      </ol>
    </section>
  );
}
