/**
 * 热力图渲染器 - 基于 CanvasEngine 的具体渲染实现
 */

import type { Renderer, RenderContext } from './CanvasEngine';
import { roundRect, drawText } from './CanvasEngine';

// ========== Types ==========

export interface HeatmapCell {
  day: number;   // 0-6 (周一 - 周日)
  hour: number;  // 0-23
  count: number;
}

export interface HeatmapData {
  cells: HeatmapCell[][];
  rowTotals: number[];
  colTotals: number[];
  grandTotal: number;
  maxCount: number;
}

export interface ActivityLevel {
  name: string;
  color: string;
  minPercentile: number;
  maxPercentile: number;
  minValue: number;
  maxValue: number;
  min: number;
  max: number;
}

export interface CellSelection {
  day: number;
  hour: number;
  type: 'cell' | 'row' | 'col';
}

export interface HeatmapRendererOptions {
  data: HeatmapData;
  activityLevels: ActivityLevel[];
  selectedCells: CellSelection[];
  showFilter?: boolean;
}

// ========== Layout Constants ==========

export const LAYOUT = {
  CELL_WIDTH: 40,
  CELL_HEIGHT: 26,
  ROW_LABEL_WIDTH: 40,
  COL_LABEL_HEIGHT: 20,
  LEGEND_WIDTH: 280,
  PADDING: 20,
  GAP: 2
} as const;

// ========== Helper Functions ==========

function formatNumber(num: number): string {
  if (num >= 10000) return (num / 10000).toFixed(1) + 'K';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
}

function getCellColor(count: number, levels: ActivityLevel[]): string {
  if (count === 0) return '#f5f5f5';
  for (const level of levels) {
    if (count >= level.min && count <= level.max) {
      return level.color;
    }
  }
  return '#f5f5f5';
}

function getCellTextColor(count: number, levels: ActivityLevel[]): string {
  if (count === 0) return '#999';
  for (const level of levels) {
    if (count >= level.min && count <= level.max) {
      if (level.color === '#fff566' || level.color === '#b7eb8f') return '#333';
      return '#fff';
    }
  }
  return '#fff';
}

// ========== HeatmapRenderer ==========

export class HeatmapRenderer implements Renderer {
  private options: HeatmapRendererOptions;
  private selectedSet: Set<string>;

  constructor(options: HeatmapRendererOptions) {
    this.options = options;
    this.selectedSet = this.buildSelectedSet(options.selectedCells);
  }

  private buildSelectedSet(cells: CellSelection[]): Set<string> {
    return new Set(cells.map((c) =>
      c.type === 'cell' ? `cell-${c.day}-${c.hour}` :
      c.type === 'row' ? `row-${c.day}` : `col-${c.hour}`
    ));
  }

  updateOptions(options: Partial<HeatmapRendererOptions>): void {
    this.options = { ...this.options, ...options };
    if (options.selectedCells !== undefined) {
      console.log('[Renderer] updateOptions selectedCells:', options.selectedCells.length);
      this.selectedSet = this.buildSelectedSet(options.selectedCells);
    }
  }

  render(ctx: RenderContext): void {
    const { data, activityLevels, showFilter } = this.options;
    const { CELL_WIDTH, CELL_HEIGHT, ROW_LABEL_WIDTH, COL_LABEL_HEIGHT, LEGEND_WIDTH, PADDING, GAP } = LAYOUT;

    const offsetX = PADDING;
    const offsetY = PADDING;
    const gridWidth = data.cells[0]?.length * (CELL_WIDTH + GAP) || 0;
    const gridHeight = data.cells.length * (CELL_HEIGHT + GAP);
    const totalsX = offsetX + ROW_LABEL_WIDTH + gridWidth + 8;
    const totalsY = offsetY + COL_LABEL_HEIGHT + gridHeight + 8;

    // 1. 绘制列标签 (小时)
    this.drawColumnLabels(ctx, offsetX, offsetY, ROW_LABEL_WIDTH, CELL_WIDTH, GAP);

    // 2. 绘制行标签 (星期)
    this.drawRowLabels(ctx, offsetX, offsetY, COL_LABEL_HEIGHT, CELL_HEIGHT, GAP, ROW_LABEL_WIDTH);

    // 3. 绘制网格单元格
    this.drawGridCells(ctx, offsetX, offsetY, ROW_LABEL_WIDTH, COL_LABEL_HEIGHT, CELL_WIDTH, CELL_HEIGHT, GAP);

    // 4. 绘制行总计
    this.drawRowTotals(ctx, totalsX, offsetY, COL_LABEL_HEIGHT, CELL_WIDTH, CELL_HEIGHT, GAP);

    // 5. 绘制列总计
    this.drawColumnTotals(ctx, offsetX, ROW_LABEL_WIDTH, totalsY, CELL_WIDTH, CELL_HEIGHT, GAP);

    // 6. 绘制图例
    this.drawLegend(ctx, totalsX, offsetY, CELL_WIDTH, LEGEND_WIDTH);

    // 7. 绘制设置提示
    if (showFilter) {
      this.drawSettingsHint(ctx, totalsX, offsetY, CELL_WIDTH, LEGEND_WIDTH);
    }
  }

  private drawColumnLabels(
    ctx: RenderContext,
    offsetX: number,
    offsetY: number,
    rowLabelWidth: number,
    cellWidth: number,
    gap: number
  ): void {
    for (let i = 0; i < 24; i++) {
      const x = offsetX + rowLabelWidth + i * (cellWidth + gap) + cellWidth / 2;
      const y = offsetY + 10;
      drawText(ctx.ctx, i.toString(), x, y, {
        color: '#666',
        font: '11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto'
      });
    }
  }

  private drawRowLabels(
    ctx: RenderContext,
    offsetX: number,
    offsetY: number,
    colLabelHeight: number,
    cellHeight: number,
    gap: number,
    rowLabelWidth: number
  ): void {
    const days = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
    for (let day = 0; day < 7; day++) {
      const y = offsetY + colLabelHeight + day * (cellHeight + gap) + cellHeight / 2;
      drawText(ctx.ctx, days[day], offsetX + rowLabelWidth - 8, y, {
        align: 'right',
        color: '#333',
        font: '11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto'
      });
    }
  }

  private drawGridCells(
    ctx: RenderContext,
    offsetX: number,
    offsetY: number,
    rowLabelWidth: number,
    colLabelHeight: number,
    cellWidth: number,
    cellHeight: number,
    gap: number
  ): void {
    const { data, activityLevels } = this.options;

    for (let day = 0; day < data.cells.length; day++) {
      const rowY = offsetY + colLabelHeight + day * (cellHeight + gap);

      for (let hour = 0; hour < data.cells[day].length; hour++) {
        const cell = data.cells[day][hour];
        const x = offsetX + rowLabelWidth + hour * (cellWidth + gap);
        const y = rowY;

        // 背景
        ctx.ctx.fillStyle = getCellColor(cell.count, activityLevels);
        roundRect(ctx.ctx, x, y, cellWidth, cellHeight, 4);
        ctx.ctx.fill();

        // 选中边框
        if (this.isCellSelected(day, hour)) {
          ctx.ctx.strokeStyle = '#1890ff';
          ctx.ctx.lineWidth = 2;
          roundRect(ctx.ctx, x, y, cellWidth, cellHeight, 4);
          ctx.ctx.stroke();
        }

        // 文字
        drawText(ctx.ctx, formatNumber(cell.count), x + cellWidth / 2, y + cellHeight / 2, {
          color: getCellTextColor(cell.count, activityLevels),
          font: '11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto'
        });
      }
    }
  }

  private drawRowTotals(
    ctx: RenderContext,
    totalsX: number,
    offsetY: number,
    colLabelHeight: number,
    cellWidth: number,
    cellHeight: number,
    gap: number
  ): void {
    const { data, activityLevels } = this.options;

    for (let day = 0; day < data.cells.length; day++) {
      const y = offsetY + colLabelHeight + day * (cellHeight + gap);
      const total = data.rowTotals[day];

      // 背景
      ctx.ctx.fillStyle = getCellColor(total, activityLevels);
      roundRect(ctx.ctx, totalsX, y, cellWidth, cellHeight, 4);
      ctx.ctx.fill();

      // 选中边框
      if (this.options.selectedCells.some((c) => c.type === 'row' && c.day === day)) {
        ctx.ctx.strokeStyle = '#1890ff';
        ctx.ctx.lineWidth = 2;
        roundRect(ctx.ctx, totalsX, y, cellWidth, cellHeight, 4);
        ctx.ctx.stroke();
      }

      // 文字
      drawText(ctx.ctx, formatNumber(total), totalsX + cellWidth / 2, y + cellHeight / 2, {
        color: getCellTextColor(total, activityLevels),
        font: 'bold 11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto'
      });
    }
  }

  private drawColumnTotals(
    ctx: RenderContext,
    offsetX: number,
    rowLabelWidth: number,
    totalsY: number,
    cellWidth: number,
    cellHeight: number,
    gap: number
  ): void {
    const { data, activityLevels } = this.options;

    for (let hour = 0; hour < data.colTotals.length; hour++) {
      const x = offsetX + rowLabelWidth + hour * (cellWidth + gap);
      const total = data.colTotals[hour];

      // 背景
      ctx.ctx.fillStyle = getCellColor(total, activityLevels);
      roundRect(ctx.ctx, x, totalsY, cellWidth, cellHeight, 4);
      ctx.ctx.fill();

      // 选中边框
      if (this.options.selectedCells.some((c) => c.type === 'col' && c.hour === hour)) {
        ctx.ctx.strokeStyle = '#1890ff';
        ctx.ctx.lineWidth = 2;
        roundRect(ctx.ctx, x, totalsY, cellWidth, cellHeight, 4);
        ctx.ctx.stroke();
      }

      // 文字
      drawText(ctx.ctx, formatNumber(total), x + cellWidth / 2, totalsY + cellHeight / 2, {
        color: getCellTextColor(total, activityLevels),
        font: 'bold 11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto'
      });
    }
  }

  private drawLegend(
    ctx: RenderContext,
    totalsX: number,
    offsetY: number,
    cellWidth: number,
    legendWidth: number
  ): void {
    const { activityLevels } = this.options;
    const legendX = totalsX + cellWidth + 30;
    const legendY = offsetY;

    // 标题
    drawText(ctx.ctx, '活动水平', legendX, legendY, {
      align: 'left',
      color: '#333',
      font: 'bold 13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto'
    });

    // 设置图标（齿轮）
    const settingsIconX = legendX + 70;
    const settingsIconY = legendY + 14;
    ctx.ctx.font = '16px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto';
    ctx.ctx.fillStyle = '#1890ff';
    ctx.ctx.fillText('⚙', settingsIconX, settingsIconY);

    const itemHeight = 20;
    const itemWidth = 14;
    const gap = 6;

    activityLevels.forEach((level, index) => {
      const y = legendY + 26 + index * (itemHeight + gap);

      // 颜色块
      ctx.ctx.fillStyle = level.color;
      roundRect(ctx.ctx, legendX, y, itemWidth, itemHeight, 3);
      ctx.ctx.fill();

      // 名称
      drawText(ctx.ctx, level.name, legendX + itemWidth + 6, y + itemHeight / 2, {
        align: 'left',
        color: '#666',
        font: '11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto'
      });

      // 范围
      drawText(ctx.ctx, `(${level.min.toLocaleString()}-${level.max.toLocaleString()})`, legendX + legendWidth - 30, y + itemHeight / 2, {
        align: 'right',
        color: '#999',
        font: '11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto'
      });
    });
  }

  // 检测是否点击了设置图标
  isClickOnSettingsIcon(x: number, y: number, totalsX: number, offsetY: number, cellWidth: number): boolean {
    const legendX = totalsX + cellWidth + 30;
    const legendY = offsetY;
    const settingsIconX = legendX + 70;
    const settingsIconY = legendY + 14;
    const iconSize = 20;

    return x >= settingsIconX && x <= settingsIconX + iconSize &&
           y >= settingsIconY - iconSize && y <= settingsIconY + iconSize;
  }

  private drawSettingsHint(
    ctx: RenderContext,
    totalsX: number,
    offsetY: number,
    cellWidth: number,
    legendWidth: number
  ): void {
    const { activityLevels } = this.options;
    const legendX = totalsX + cellWidth + 30;
    const itemHeight = 20;
    const gap = 6;
    const hintY = offsetY + 26 + activityLevels.length * (itemHeight + gap) + 16;

    drawText(ctx.ctx, '⚙ 双击打开设置', legendX, hintY, {
      align: 'left',
      color: '#1890ff',
      font: '11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto'
    });
  }

  private isCellSelected(day: number, hour: number): boolean {
    const key = `cell-${day}-${hour}`;
    const result = this.selectedSet.has(key);
    console.log('[Renderer] isCellSelected:', key, result, 'set size:', this.selectedSet.size);
    return result;
  }

  destroy(): void {
    // No cleanup needed
  }
}
