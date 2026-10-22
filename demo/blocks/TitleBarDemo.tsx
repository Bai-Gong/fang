import { useState } from "react";
import { TitleBar, defaultMenus, installWindowAdapter, uninstallWindowAdapter } from "../../src";

/** 窗口三键的假实现（demo 无 Tauri）：点击只计数回显。 */
const counters = { minimize: 0, toggleMaximize: 0, close: 0 };
let demoMaximized = false;
const listeners = new Set<(m: boolean) => void>();
const notifyMax = (m: boolean) => listeners.forEach((cb) => cb(m));
installWindowAdapter({
  minimize: () => {
    counters.minimize += 1;
  },
  toggleMaximize: () => {
    counters.toggleMaximize += 1;
    demoMaximized = !demoMaximized;
    notifyMax(demoMaximized);
  },
  close: () => {
    counters.close += 1;
  },
  isMaximized: () => Promise.resolve(demoMaximized),
  onMaximizeChange(cb) {
    listeners.add(cb);
    return () => listeners.delete(cb);
  },
});
// 卸载钩子仅作形态示意：demo 单实例常驻，实际不触发
window.addEventListener("beforeunload", uninstallWindowAdapter);

/** 标题栏演示：菜单（默认项＋应用自定义）＋居中信息＋动作槽＋窗口三键（假适配器）。 */
export function TitleBarDemo() {
  const [lastAction, setLastAction] = useState("（尚未点过菜单）");
  const menus = [
    {
      label: "文件",
      items: [
        { kind: "item" as const, label: "新建工程", hint: "Ctrl+N", onSelect: () => setLastAction("文件 → 新建工程") },
        { kind: "item" as const, label: "导出…", onSelect: () => setLastAction("文件 → 导出…") },
        { kind: "separator" as const },
        { kind: "item" as const, label: "退出", onSelect: () => setLastAction(`文件 → 退出（已点 ${counters.close} 次关闭钮）`) },
      ],
    },
    ...defaultMenus({
      onUndo: () => setLastAction("编辑 → 撤销"),
      onRedo: () => setLastAction("编辑 → 重做"),
      onAbout: () => setLastAction("帮助 → 关于"),
    }),
  ];

  return (
    <section aria-label="标题栏演示">
      <h2 style={{ fontSize: "var(--fang-font-size-lg)", margin: "0 0 var(--fang-space-2)" }}>
        TitleBar
        <span style={{ fontSize: "var(--fang-font-size-sm)", color: "var(--fang-color-text-muted)", marginLeft: "var(--fang-space-2)" }}>
          菜单栏＋窗口三键＋拖动区（demo 为假适配器，点击计数不真关窗）
        </span>
      </h2>
      <div style={{ border: "1px solid var(--fang-color-border)", borderRadius: "var(--fang-radius-md)", overflow: "hidden" }}>
        <TitleBar
          appName="百工·坊 demo"
          menus={menus}
          center={<span style={{ fontSize: "var(--fang-font-size-sm)", color: "var(--fang-color-text-secondary)" }}>未命名工程 · 1920×1080@30</span>}
          actions={
            <span style={{ fontSize: "var(--fang-font-size-sm)", color: "var(--fang-color-text-muted)" }}>最近动作：{lastAction}</span>
          }
        />
        <div style={{ padding: "var(--fang-space-3)", fontSize: "var(--fang-font-size-sm)", color: "var(--fang-color-text-muted)" }}>
          应用正文区（真实应用中 DockHost 停靠布局从这里开始）
        </div>
      </div>
    </section>
  );
}
