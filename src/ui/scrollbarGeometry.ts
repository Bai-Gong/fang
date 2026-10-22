/**
 * ScrollArea 滚动条几何纯函数：thumb 尺寸/位置、拖拽与轨道点击的指针→滚动映射。
 * 无 DOM、无 React 依赖，输入输出一律像素，可全量单测。
 *
 * 约定：track（轨道）全长即视口对应边内长；thumb 长度与视口/内容占比一致，
 * 最短钳到 minThumbPx 保证可抓取；offset 为 thumb 顶（左）端在轨道上的位置。
 */

/** thumb 最短长度（px）：内容远超视口时仍保持可抓取。 */
export const MIN_THUMB_PX = 24;

export interface ThumbMetrics {
  /** 内容不超过视口（≤1px 视为无溢出）时滚动条无意义。 */
  visible: boolean;
  /** thumb 长度（px），已钳 [minThumbPx, trackPx]。 */
  thumbPx: number;
  /** thumb 在轨道上的偏移（px），已钳 [0, trackPx - thumbPx]。 */
  offsetPx: number;
}

/** 由视口/内容/滚动位置算 thumb 几何。 */
export function thumbMetrics(
  viewportPx: number,
  contentPx: number,
  scrollPx: number,
  trackPx: number,
  minThumbPx: number = MIN_THUMB_PX,
): ThumbMetrics {
  const overflowPx = contentPx - viewportPx;
  if (overflowPx <= 1 || trackPx <= 0) return { visible: false, thumbPx: 0, offsetPx: 0 };
  const thumbPx = Math.min(trackPx, Math.max(minThumbPx, (trackPx * viewportPx) / contentPx));
  const travelPx = trackPx - thumbPx;
  const offsetPx = (scrollPx / overflowPx) * travelPx;
  return { visible: true, thumbPx, offsetPx: Math.min(Math.max(0, offsetPx), travelPx) };
}

/**
 * thumb 拖拽映射：指针在轨道上的位置 → 滚动偏移（px）。
 * grabPx＝按下时指针到 thumb 顶（左）端的距离，拖动期间 thumb 跟随指针保持抓点不动。
 */
export function dragToScroll(
  pointerPx: number,
  grabPx: number,
  trackPx: number,
  viewportPx: number,
  contentPx: number,
  minThumbPx: number = MIN_THUMB_PX,
): number {
  const overflowPx = contentPx - viewportPx;
  if (overflowPx <= 1) return 0;
  const { thumbPx } = thumbMetrics(viewportPx, contentPx, 0, trackPx, minThumbPx);
  const travelPx = trackPx - thumbPx;
  if (travelPx <= 0) return overflowPx / 2; // thumb 占满轨道（内容≈视口上限）取中
  const scrollPx = ((pointerPx - grabPx) / travelPx) * overflowPx;
  return Math.min(Math.max(0, scrollPx), overflowPx);
}

/** 轨道空白处点击：滚动到点击位置居中于 thumb 处。 */
export function trackClickToScroll(
  clickPx: number,
  trackPx: number,
  viewportPx: number,
  contentPx: number,
  minThumbPx: number = MIN_THUMB_PX,
): number {
  const overflowPx = contentPx - viewportPx;
  if (overflowPx <= 1) return 0;
  const { thumbPx } = thumbMetrics(viewportPx, contentPx, 0, trackPx, minThumbPx);
  const travelPx = trackPx - thumbPx;
  if (travelPx <= 0) return overflowPx / 2;
  const scrollPx = ((clickPx - thumbPx / 2) / travelPx) * overflowPx;
  return Math.min(Math.max(0, scrollPx), overflowPx);
}
