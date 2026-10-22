/**
 * TitleBar：应用标题栏（无系统装饰窗口的应用级外壳件）——
 * 菜单栏（可配置，通用默认项见 defaultMenus）＋居中信息槽＋应用动作槽＋窗口三键。
 *
 * 消费形态：应用窗口开 `decorations: false`（Tauri conf），本组件顶在最上行；
 * 根与空白区带 data-tauri-drag-region（拖动窗口、双击最大化由 Tauri 内核处理，
 * 权限 core:default 已含 start-dragging / internal-toggle-maximize）。
 * 窗口三键经窗口适配器执行（windowAdapter.ts，应用侧注入 Tauri 实现），未注入置灰。
 *
 * 样式注入说明：窗口按钮 :hover/关闭钮红色等伪类态内联做不到，与 ScrollArea 同一
 * 处理——挂载时注入 scoped <style>（幂等），作用域仅限 .fang-title-bar__*。
 */
import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";
import type { MenuEntry } from "./menu";
import { getWindowAdapter } from "./windowAdapter";

/** 标题栏高度（px）：Windows 惯例的紧凑值。 */
export const TITLEBAR_HEIGHT_PX = 36;

export interface TitleBarProps {
  /** 应用名（拖动区左侧显示，兼作窗口标识）。 */
  appName: string;
  /** 应用图标/标志节点，置于应用名左侧（可选）。 */
  appIcon?: ReactNode;
  /** 菜单栏（缺省不渲染菜单区）；通用默认项用 defaultMenus 组装再增删。 */
  menus?: MenuEntry[];
  /** 居中信息槽（如工程名＋画幅），绝对居中、不拦截拖动。 */
  center?: ReactNode;
  /** 窗口三键左侧的动作槽（应用的工具按钮，如剪的导出）。 */
  actions?: ReactNode;
  className?: string;
  style?: CSSProperties;
}

const STYLE_ID = "fang-title-bar-style";
const STYLE_CSS = `
.fang-title-bar__winbtn { background: transparent; color: var(--fang-color-text-secondary); }
.fang-title-bar__winbtn:hover:not([aria-disabled="true"]) { background: var(--fang-color-hover); color: var(--fang-color-text); }
.fang-title-bar__winbtn--close:hover:not([aria-disabled="true"]) { background: var(--fang-color-danger); color: #fff; }
`;

function ensureStyle(): void {
  if (document.getElementById(STYLE_ID)) return;
  const tag = document.createElement("style");
  tag.id = STYLE_ID;
  tag.textContent = STYLE_CSS;
  document.head.appendChild(tag);
}

/** 窗口按钮图形：16px 线框 SVG（Windows 三键形态：底横线 / 方框 / 双框 / 叉）。 */
function WinIcon({ kind }: { kind: "min" | "max" | "restore" | "close" }) {
  const common = {
    width: 16,
    height: 16,
    viewBox: "0 0 16 16",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.2,
    "aria-hidden": true,
  } as const;
  if (kind === "min") return <svg {...common}><line x1="3.5" y1="12" x2="12.5" y2="12" /></svg>;
  if (kind === "max") return <svg {...common}><rect x="3.5" y="3.5" width="9" height="9" rx="0.5" /></svg>;
  if (kind === "restore")
    return (
      <svg {...common}>
        <rect x="5.5" y="3.5" width="7" height="7" rx="0.5" />
        <path d="M3.5 10.5v-5a2 2 0 0 1 2-2" />
      </svg>
    );
  return (
    <svg {...common}>
      <line x1="4" y1="4" x2="12" y2="12" />
      <line x1="12" y1="4" x2="4" y2="12" />
    </svg>
  );
}

export function TitleBar({ appName, appIcon, menus, center, actions, className, style }: TitleBarProps) {
  const rootRef = useRef<HTMLElement>(null);
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [maximized, setMaximized] = useState(false);
  // 适配器在应用入口渲染前注入，挂载帧读取一次即定（未注入 → 三键置灰）
  const hasAdapter = getWindowAdapter() !== null;

  useEffect(ensureStyle, []);

  // 最大化状态：初值 + 订阅变化（恢复/最大化图标切换）
  useEffect(() => {
    const adapter = getWindowAdapter();
    if (!adapter) return;
    let alive = true;
    void adapter.isMaximized().then((m) => {
      if (alive) setMaximized(m);
    });
    const off = adapter.onMaximizeChange((m) => setMaximized(m));
    return () => {
      alive = false;
      off();
    };
  }, []);

  // 点外面 / Esc 关菜单
  useEffect(() => {
    if (openIndex === null) return;
    const onPointerDown = (e: PointerEvent) => {
      if (rootRef.current && e.target instanceof Node && !rootRef.current.contains(e.target)) {
        setOpenIndex(null);
      }
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpenIndex(null);
    };
    document.addEventListener("pointerdown", onPointerDown, true);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown, true);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [openIndex]);

  const winBtn = (kind: "min" | "max" | "restore" | "close", label: string, onClick: () => void): ReactNode => (
    <button
      type="button"
      className={kind === "close" ? "fang-title-bar__winbtn fang-title-bar__winbtn--close" : "fang-title-bar__winbtn"}
      style={{ width: 46, height: "100%", display: "inline-flex", alignItems: "center", justifyContent: "center", border: "none", padding: 0, cursor: hasAdapter ? "pointer" : "default" }}
      aria-disabled={hasAdapter ? undefined : "true"}
      aria-label={label}
      title={label}
      onClick={hasAdapter ? onClick : undefined}
    >
      <WinIcon kind={kind} />
    </button>
  );

  const onMenuButtonClick = (index: number) => setOpenIndex((cur) => (cur === index ? null : index));
  const onMenuButtonEnter = (index: number) => {
    // 已有菜单展开时，悬停切换到相邻菜单（桌面菜单栏惯例）
    if (openIndex !== null && openIndex !== index) setOpenIndex(index);
  };
  const onItemSelect = (entry: MenuEntry, itemIndex: number) => {
    const item = entry.items[itemIndex];
    if (!item || item.kind === "separator" || item.disabled) return;
    item.onSelect?.();
    setOpenIndex(null);
  };

  const rootStyle: CSSProperties = {
    display: "flex",
    alignItems: "stretch",
    flex: "none",
    height: TITLEBAR_HEIGHT_PX,
    background: "var(--fang-color-bg-raised)",
    borderBottom: "1px solid var(--fang-color-border)",
    color: "var(--fang-color-text)",
    fontFamily: "var(--fang-font-family)",
    userSelect: "none",
    position: "relative",
    ...style,
  };
  const menuButtonStyle = (open: boolean): CSSProperties => ({
    border: "none",
    background: open ? "var(--fang-color-hover)" : "transparent",
    color: open ? "var(--fang-color-text)" : "var(--fang-color-text-secondary)",
    font: "var(--fang-font-size-md)/1 var(--fang-font-family)",
    padding: "0 var(--fang-space-3)",
    cursor: "pointer",
  });
  const dropdownStyle: CSSProperties = {
    position: "absolute",
    top: "100%",
    left: 0,
    minWidth: 200,
    padding: "var(--fang-space-1)",
    background: "var(--fang-color-bg-overlay)",
    border: "1px solid var(--fang-color-border-strong)",
    borderRadius: "var(--fang-radius-md)",
    boxShadow: "0 6px 18px rgba(0, 0, 0, 0.35)",
    zIndex: "var(--fang-z-dropdown)",
  };

  return (
    <header
      ref={rootRef}
      className={["fang-title-bar", className].filter(Boolean).join(" ")}
      style={rootStyle}
      data-tauri-drag-region=""
    >
      {(appIcon || appName) && (
        <div
          data-tauri-drag-region=""
          style={{ display: "flex", alignItems: "center", gap: "var(--fang-space-2)", padding: "0 var(--fang-space-3)", flex: "none" }}
        >
          {appIcon}
          <span style={{ fontSize: "var(--fang-font-size-md)", fontWeight: 600, whiteSpace: "nowrap" }}>{appName}</span>
        </div>
      )}

      {menus && menus.length > 0 && (
        <nav aria-label="应用菜单" style={{ display: "flex", alignItems: "stretch", flex: "none" }}>
          {menus.map((entry, index) => (
            <div key={entry.label} style={{ position: "relative", display: "flex" }}>
              <button
                type="button"
                style={menuButtonStyle(openIndex === index)}
                aria-haspopup="menu"
                aria-expanded={openIndex === index}
                onClick={() => onMenuButtonClick(index)}
                onPointerEnter={(e: ReactPointerEvent<HTMLButtonElement>) => {
                  if (e.buttons === 0) onMenuButtonEnter(index);
                }}
              >
                {entry.label}
              </button>
              {openIndex === index && (
                <div role="menu" aria-label={entry.label} style={dropdownStyle}>
                  {entry.items.map((item, itemIndex) =>
                    item.kind === "separator" ? (
                      <div key={itemIndex} role="separator" style={{ height: 1, margin: "var(--fang-space-1) var(--fang-space-2)", background: "var(--fang-color-border)" }} />
                    ) : (
                      <button
                        key={itemIndex}
                        type="button"
                        role="menuitem"
                        aria-disabled={item.disabled ? "true" : undefined}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "var(--fang-space-2)",
                          width: "100%",
                          border: "none",
                          background: "transparent",
                          color: item.disabled ? "var(--fang-color-text-muted)" : "var(--fang-color-text)",
                          font: "var(--fang-font-size-md)/1.4 var(--fang-font-family)",
                          textAlign: "left",
                          padding: "6px var(--fang-space-2)",
                          borderRadius: "var(--fang-radius-sm)",
                          cursor: item.disabled ? "default" : "pointer",
                        }}
                        onClick={() => onItemSelect(entry, itemIndex)}
                      >
                        <span aria-hidden="true" style={{ width: 14, flex: "none", color: "var(--fang-color-accent)" }}>
                          {item.checked ? "✓" : ""}
                        </span>
                        <span style={{ flex: 1, whiteSpace: "nowrap" }}>{item.label}</span>
                        {item.hint && (
                          <span style={{ font: "var(--fang-font-size-xs)/1 var(--fang-font-mono)", color: "var(--fang-color-text-muted)" }}>{item.hint}</span>
                        )}
                      </button>
                    ),
                  )}
                </div>
              )}
            </div>
          ))}
        </nav>
      )}

      {/* 居中信息槽：绝对居中且不拦截指针（拖动穿透到根） */}
      {center && (
        <div
          aria-hidden="true"
          style={{ position: "absolute", left: "50%", top: 0, bottom: 0, transform: "translateX(-50%)", display: "flex", alignItems: "center", gap: "var(--fang-space-3)", pointerEvents: "none", maxWidth: "40%", overflow: "hidden" }}
        >
          {center}
        </div>
      )}

      {/* 动作槽（左对齐贴三键） */}
      {actions && (
        <div style={{ display: "flex", alignItems: "center", gap: "var(--fang-space-2)", padding: "0 var(--fang-space-2)", flex: "none", marginLeft: "auto" }}>
          {actions}
        </div>
      )}

      {/* 拖动空白区：无动作槽时也要有（ marginLeft:auto 兜底在 spacer） */}
      <div data-tauri-drag-region="" style={{ flex: 1 }} />

      <div style={{ display: "flex", alignItems: "stretch", flex: "none" }}>
        {winBtn("min", "最小化", () => void getWindowAdapter()?.minimize())}
        {winBtn(maximized ? "restore" : "max", maximized ? "向下还原" : "最大化", () => void getWindowAdapter()?.toggleMaximize())}
        {winBtn("close", "关闭", () => void getWindowAdapter()?.close())}
      </div>
    </header>
  );
}
