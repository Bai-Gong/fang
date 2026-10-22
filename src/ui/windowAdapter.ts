/**
 * 窗口适配器：坊不直接依赖 Tauri（「Tauri 相关部分作为可选层」约定），
 * 标题栏的最小化/最大化/关闭经应用侧注入实现。
 *
 * 应用入口（渲染前）调用 installWindowAdapter({...}) 一次——剪的接线见
 * src/shell/windowControls.ts；demo/单测注入假适配器或不注入（按钮置灰）。
 */
export interface WindowAdapter {
  minimize(): void | Promise<void>;
  toggleMaximize(): void | Promise<void>;
  close(): void | Promise<void>;
  isMaximized(): Promise<boolean>;
  /** 订阅最大化状态变化（恢复按钮图标切换），返回退订函数。 */
  onMaximizeChange(cb: (maximized: boolean) => void): () => void;
}

let adapter: WindowAdapter | null = null;

/** 注入窗口适配器；重复注入以后者为准。须在 TitleBar 挂载前完成（挂载帧读取一次）。 */
export function installWindowAdapter(next: WindowAdapter): void {
  adapter = next;
}

/** 移除适配器（测试清理用）。 */
export function uninstallWindowAdapter(): void {
  adapter = null;
}

/** 取当前适配器；未注入为 null（TitleBar 据此置灰窗口按钮）。 */
export function getWindowAdapter(): WindowAdapter | null {
  return adapter;
}
