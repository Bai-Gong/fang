/**
 * ScrollArea：自绘滚动条的滚动容器（通用控件）。
 *
 * 动机：WebView2/Chromium 原生滚动条与应用深色外壳割裂、占 17px 布局宽、行为不可控
 * （无悬停淡出）。本组件隐藏原生条，在视口边缘叠加自绘 thumb：
 * - 几何全部走 scrollbarGeometry 纯函数；thumb 位移命令式直写 transform，
 *   滚动不触发 React 重渲染（与消费工具的播放头位移同一纪律）；
 * - 滚轮/触摸板/键盘仍走视口原生滚动，thumb 只做指示与拖拽定位；
 * - 无障碍：thumb 所在轨道挂 role="scrollbar" + aria-valuenow（随滚动命令式更新）；
 * - autoHide：无交互约 0.9s 后淡出，悬停/滚动/拖拽期间保持可见。
 *
 * 样式注入说明：隐藏原生滚动条必须用伪元素规则（::-webkit-scrollbar / scrollbar-width），
 * 内联样式做不到，故组件首次挂载向 document.head 注入一段 scoped <style>（幂等，id 固定）。
 * 这是坊「主入口不注入样式」约定的有意例外：作用域仅限 .fang-scroll-area__*。
 *
 * 视口元素经 onViewportChange 回调对外交付（回调 ref 语义）：消费方要挂滚轮监听、
 * 量窗口或直写 scrollLeft 时用它，不要用 ref 对象转发（子组件挂载帧读 ref 对象
 * 拿到的是 null——React 先跑后代 layout effect、后挂祖先 DOM 的 ref）。
 */
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";
import { dragToScroll, thumbMetrics, trackClickToScroll, type ThumbMetrics } from "./scrollbarGeometry";

/** 轨道厚度（px）。thumb 在轨道内两侧各缩进 2px。 */
export const SCROLLBAR_TRACK_PX = 10;
/** autoHide 淡出前等待（ms）。 */
const FADE_DELAY_MS = 900;
const HIDDEN_METRICS: ThumbMetrics = { visible: false, thumbPx: 0, offsetPx: 0 };

export type ScrollOrientation = "vertical" | "horizontal" | "both";

export interface ScrollAreaProps {
  /** 显示哪些方向的自绘滚动条；未开的方向视口对应轴 overflow:hidden（不可滚）。 */
  orientation?: ScrollOrientation;
  /** 闲置淡出（默认 true）；false 常显。 */
  autoHide?: boolean;
  /** 视口元素就绪/卸载回调（回调 ref 语义，el 为 null 即卸载）。 */
  onViewportChange?: (el: HTMLDivElement | null) => void;
  /** 视口滚动回调（同步外部元素等场景）。 */
  onScroll?: () => void;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
}

/** 滚动条隐藏与 thumb 视觉的 scoped 样式，挂载一次（见文件头「样式注入说明」）。 */
const STYLE_ID = "fang-scroll-area-style";
const STYLE_CSS = `
.fang-scroll-area__viewport { scrollbar-width: none; -ms-overflow-style: none; }
.fang-scroll-area__viewport::-webkit-scrollbar { display: none; width: 0; height: 0; }
.fang-scroll-area__thumb {
  border-radius: var(--fang-radius-sm, 3px);
  background: var(--fang-color-border-strong, #4a4e55);
  opacity: 0;
  transition: opacity 180ms ease, background-color 120ms ease;
}
.fang-scroll-area[data-active="true"] .fang-scroll-area__thumb { opacity: 0.85; }
.fang-scroll-area__thumb:hover, .fang-scroll-area__thumb[data-dragging="true"] {
  background: var(--fang-color-text-muted, #767c88);
}
.fang-scroll-area__thumb[data-dragging="true"] { opacity: 1; }
`;

function ensureStyle(): void {
  if (document.getElementById(STYLE_ID)) return;
  const tag = document.createElement("style");
  tag.id = STYLE_ID;
  tag.textContent = STYLE_CSS;
  document.head.appendChild(tag);
}

export function ScrollArea({
  orientation = "vertical",
  autoHide = true,
  onViewportChange,
  onScroll,
  className,
  style,
  children,
}: ScrollAreaProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const vTrackRef = useRef<HTMLDivElement>(null);
  const hTrackRef = useRef<HTMLDivElement>(null);
  const vThumbRef = useRef<HTMLDivElement>(null);
  const hThumbRef = useRef<HTMLDivElement>(null);
  // 视口存元素实例（回调 ref → state）：effect 依赖它挂监听，null 期不挂
  const [viewportEl, setViewportEl] = useState<HTMLDivElement | null>(null);
  const viewportId = useId();

  // 对外回调经 ref 转发最新闭包，外部可传内联函数而不致监听反复重挂
  const onViewportChangeRef = useRef(onViewportChange);
  onViewportChangeRef.current = onViewportChange;
  const onScrollRef = useRef(onScroll);
  onScrollRef.current = onScroll;

  const pointerInsideRef = useRef(false);
  const fadeTimerRef = useRef<number | null>(null);
  /** 拖拽状态：axis + 指针到 thumb 顶（左）端的抓取偏移。 */
  const dragRef = useRef<{ axis: "x" | "y"; grabPx: number } | null>(null);
  /** 最近一次 thumb 几何（update 写入），供 pointerdown 判断点击落点是否在 thumb 内。 */
  const metricsRef = useRef<{ x: ThumbMetrics; y: ThumbMetrics }>({ x: HIDDEN_METRICS, y: HIDDEN_METRICS });

  useEffect(ensureStyle, []);

  const markActive = useCallback(() => {
    const root = rootRef.current;
    if (!root) return;
    root.dataset.active = "true";
    if (fadeTimerRef.current !== null) window.clearTimeout(fadeTimerRef.current);
    if (!autoHide) return;
    fadeTimerRef.current = window.setTimeout(() => {
      fadeTimerRef.current = null;
      if (!pointerInsideRef.current && !dragRef.current && rootRef.current) {
        rootRef.current.dataset.active = "false";
      }
    }, FADE_DELAY_MS);
  }, [autoHide]);

  /** 滚动/尺寸变化后的 thumb 几何直写（不触发 React 重渲染）。 */
  const update = useCallback(() => {
    const vp = viewportEl;
    if (!vp) return;
    const axes = [
      {
        key: "y" as const,
        thumb: vThumbRef.current,
        trackPx: vTrackRef.current?.clientHeight ?? 0,
        viewportPx: vp.clientHeight,
        contentPx: vp.scrollHeight,
        scrollPx: vp.scrollTop,
      },
      {
        key: "x" as const,
        thumb: hThumbRef.current,
        trackPx: hTrackRef.current?.clientWidth ?? 0,
        viewportPx: vp.clientWidth,
        contentPx: vp.scrollWidth,
        scrollPx: vp.scrollLeft,
      },
    ];
    for (const axis of axes) {
      const m = thumbMetrics(axis.viewportPx, axis.contentPx, axis.scrollPx, axis.trackPx);
      metricsRef.current[axis.key] = m;
      const thumb = axis.thumb;
      if (!thumb) continue;
      if (!m.visible) {
        thumb.style.display = "none";
        continue;
      }
      const overflowPx = Math.max(1, axis.contentPx - axis.viewportPx);
      thumb.style.display = "block";
      thumb.style[axis.key === "y" ? "height" : "width"] = `${m.thumbPx}px`;
      thumb.style.transform = `translate${axis.key === "y" ? "Y" : "X"}(${m.offsetPx}px)`;
      thumb.setAttribute("aria-valuenow", String(Math.round((axis.scrollPx / overflowPx) * 100)));
    }
  }, [viewportEl]);

  // 视口监听：滚动 + 视口/内容尺寸变化（RO 看不到 scrollWidth/Height 溢出，两路都要）
  useEffect(() => {
    if (!viewportEl) return;
    const onScrollInternal = () => {
      update();
      markActive();
      onScrollRef.current?.();
    };
    viewportEl.addEventListener("scroll", onScrollInternal, { passive: true });
    const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(update);
    observer?.observe(viewportEl);
    if (contentRef.current) observer?.observe(contentRef.current);
    update();
    return () => {
      viewportEl.removeEventListener("scroll", onScrollInternal);
      observer?.disconnect();
    };
  }, [viewportEl, update, markActive]);

  useEffect(
    () => () => {
      if (fadeTimerRef.current !== null) window.clearTimeout(fadeTimerRef.current);
    },
    [],
  );

  const handleViewportRef = useCallback((el: HTMLDivElement | null) => {
    setViewportEl(el);
    onViewportChangeRef.current?.(el);
  }, []);

  const onRootPointerEnter = useCallback(() => {
    pointerInsideRef.current = true;
    markActive();
  }, [markActive]);
  const onRootPointerLeave = useCallback(() => {
    pointerInsideRef.current = false;
    markActive();
  }, [markActive]);

  /** 轨道指针交互：落在 thumb 上＝拖拽；落在空白＝先跳到点击处（thumb 居中）再转拖拽。 */
  const makeTrackHandlers = (axis: "x" | "y") => {
    const thumbRef = axis === "y" ? vThumbRef : hThumbRef;
    const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
      const vp = viewportEl;
      if (!vp || e.button !== 0) return;
      e.currentTarget.setPointerCapture(e.pointerId);
      const trackLen = axis === "y" ? e.currentTarget.clientHeight : e.currentTarget.clientWidth;
      const posPx = axis === "y" ? e.clientY - e.currentTarget.getBoundingClientRect().top : e.clientX - e.currentTarget.getBoundingClientRect().left;
      const viewportPx = axis === "y" ? vp.clientHeight : vp.clientWidth;
      const contentPx = axis === "y" ? vp.scrollHeight : vp.scrollWidth;
      const m = metricsRef.current[axis];
      let grabPx: number;
      if (e.target === thumbRef.current && m.visible) {
        grabPx = posPx - m.offsetPx;
      } else {
        // 空白轨道：跳到点击处，随即按住继续拖
        const scrollPx = trackClickToScroll(posPx, trackLen, viewportPx, contentPx);
        if (axis === "y") vp.scrollTop = scrollPx;
        else vp.scrollLeft = scrollPx;
        update();
        grabPx = metricsRef.current[axis].thumbPx / 2;
      }
      dragRef.current = { axis, grabPx };
      thumbRef.current?.setAttribute("data-dragging", "true");
      markActive();
    };
    const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
      const drag = dragRef.current;
      const vp = viewportEl;
      if (!drag || drag.axis !== axis || !vp) return;
      if (!e.currentTarget.hasPointerCapture(e.pointerId)) return;
      const rect = e.currentTarget.getBoundingClientRect();
      const trackLen = axis === "y" ? rect.height : rect.width;
      const posPx = axis === "y" ? e.clientY - rect.top : e.clientX - rect.left;
      const viewportPx = axis === "y" ? vp.clientHeight : vp.clientWidth;
      const contentPx = axis === "y" ? vp.scrollHeight : vp.scrollWidth;
      const scrollPx = dragToScroll(posPx, drag.grabPx, trackLen, viewportPx, contentPx);
      if (axis === "y") vp.scrollTop = scrollPx;
      else vp.scrollLeft = scrollPx;
    };
    const onPointerUp = (e: ReactPointerEvent<HTMLDivElement>) => {
      if (dragRef.current?.axis !== axis) return;
      dragRef.current = null;
      thumbRef.current?.removeAttribute("data-dragging");
      if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId);
      markActive();
    };
    return { onPointerDown, onPointerMove, onPointerUp, onPointerCancel: onPointerUp };
  };

  const vertical = orientation !== "horizontal";
  const horizontal = orientation !== "vertical";

  const rootStyle: CSSProperties = { position: "relative", overflow: "hidden", minWidth: 0, minHeight: 0, ...style };
  const viewportStyle: CSSProperties = {
    position: "absolute",
    inset: 0,
    overflowX: horizontal ? "auto" : "hidden",
    overflowY: vertical ? "auto" : "hidden",
  };
  // 内容包一层：inline-block 收缩适配（min(max(最小, 可用), 最大)）——块级子元素显式宽
  // 可撑开横向滚动、长文本仍按可用宽换行；ResizeObserver 观察它即可感知内容尺寸变化。
  const contentStyle: CSSProperties = { display: "inline-block", minWidth: "100%", verticalAlign: "top" };

  return (
    <div
      ref={rootRef}
      className={["fang-scroll-area", className].filter(Boolean).join(" ")}
      data-active={autoHide ? "false" : "true"}
      style={rootStyle}
      onPointerEnter={onRootPointerEnter}
      onPointerLeave={onRootPointerLeave}
    >
      <div ref={handleViewportRef} id={viewportId} className="fang-scroll-area__viewport" style={viewportStyle}>
        <div ref={contentRef} className="fang-scroll-area__content" style={contentStyle}>
          {children}
        </div>
      </div>
      {vertical && (
        <div
          ref={vTrackRef}
          className="fang-scroll-area__track"
          style={{ position: "absolute", zIndex: 6, top: 0, right: 0, bottom: horizontal ? SCROLLBAR_TRACK_PX : 0, width: SCROLLBAR_TRACK_PX }}
          role="scrollbar"
          aria-orientation="vertical"
          aria-controls={viewportId}
          aria-valuemin={0}
          aria-valuemax={100}
          {...makeTrackHandlers("y")}
        >
          <div ref={vThumbRef} className="fang-scroll-area__thumb" style={{ position: "absolute", top: 0, left: 2, right: 2 }} />
        </div>
      )}
      {horizontal && (
        <div
          ref={hTrackRef}
          className="fang-scroll-area__track"
          style={{ position: "absolute", zIndex: 6, left: 0, bottom: 0, right: vertical ? SCROLLBAR_TRACK_PX : 0, height: SCROLLBAR_TRACK_PX }}
          role="scrollbar"
          aria-orientation="horizontal"
          aria-controls={viewportId}
          aria-valuemin={0}
          aria-valuemax={100}
          {...makeTrackHandlers("x")}
        >
          <div ref={hThumbRef} className="fang-scroll-area__thumb" style={{ position: "absolute", left: 0, top: 2, bottom: 2 }} />
        </div>
      )}
    </div>
  );
}
