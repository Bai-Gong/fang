import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
// demo 经 src 直接消费（联调轨同理，见 README「消费方式」）
import "../src/theme/tokens.css";
import { ThemeProvider } from "../src";
import { DockDemo } from "./blocks/DockDemo";
import { HotkeysDemo } from "./blocks/HotkeysDemo";
import { ScrollAreaDemo } from "./blocks/ScrollAreaDemo";
import { ThemeDemo } from "./blocks/ThemeDemo";
import { TitleBarDemo } from "./blocks/TitleBarDemo";

const root = document.getElementById("root");
if (!root) {
  throw new Error("demo 挂载点 #root 不存在");
}

createRoot(root).render(
  <StrictMode>
    <ThemeProvider>
      <main
        style={{
          minHeight: "100vh",
          padding: "var(--fang-space-5)",
          background: "var(--fang-color-bg)",
          color: "var(--fang-color-text)",
          fontFamily: "var(--fang-font-family)",
          display: "flex",
          flexDirection: "column",
          gap: "var(--fang-space-5)",
        }}
      >
        <h1 style={{ fontSize: "var(--fang-font-size-xl)", margin: 0 }}>
          百工·坊 demo
          <span style={{ fontSize: "var(--fang-font-size-sm)", color: "var(--fang-color-text-muted)", marginLeft: "var(--fang-space-3)" }}>
            主题 / 停靠 / 快捷键 / 滚动条
          </span>
        </h1>
        <ThemeDemo />
        <DockDemo />
        <HotkeysDemo />
        <ScrollAreaDemo />
        <TitleBarDemo />
      </main>
    </ThemeProvider>
  </StrictMode>,
);
