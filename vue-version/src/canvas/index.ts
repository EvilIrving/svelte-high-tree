/**
 * Canvas 模块导出
 */

export { CanvasEngine, roundRect, drawText } from './CanvasEngine';
export type {
  CanvasEngineOptions,
  RenderContext,
  Renderer,
  EventHandler,
  MouseEvent,
  ClickEvent,
  DragEvent
} from './CanvasEngine';

export { HeatmapRenderer, LAYOUT } from './HeatmapRenderer';
export type {
  HeatmapCell,
  HeatmapData,
  ActivityLevel,
  CellSelection,
  HeatmapRendererOptions
} from './HeatmapRenderer';

export { HeatmapEventHandler } from './HeatmapEventHandler';
export type {
  HeatmapEventHandlers,
  CellSelectEvent,
  HeatmapEventHandlerOptions
} from './HeatmapEventHandler';
