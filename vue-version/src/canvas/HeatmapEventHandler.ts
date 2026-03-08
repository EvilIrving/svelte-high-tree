/**
 * 热力图事件处理器 - 处理交互逻辑
 */

import type { EventHandler, ClickEvent } from './CanvasEngine';
import { LAYOUT } from './HeatmapRenderer';
import type { CellSelection } from './HeatmapRenderer';

// ========== Types ==========

export interface HeatmapEventHandlers {
  onCellSelect?: (event: CellSelectEvent) => void;
  onSettingsOpen?: () => void;
}

export interface CellSelectEvent {
  cell: CellSelection;
  isDragging: boolean;
  ctrlKey: boolean;
  selectedCells: CellSelection[];
}

export interface HeatmapEventHandlerOptions {
  handlers: HeatmapEventHandlers;
  getCtrlKey: () => boolean;
  getSelectedCells: () => CellSelection[];
  cellCount?: number;  // 列数 (小时数)
  rowCount?: number;   // 行数 (天数)
}

// ========== HeatmapEventHandler ==========

export class HeatmapEventHandler implements EventHandler {
  private options: Required<HeatmapEventHandlerOptions>;
  private renderer: any = null;

  constructor(options: HeatmapEventHandlerOptions) {
    this.options = {
      handlers: options.handlers,
      getCtrlKey: options.getCtrlKey,
      getSelectedCells: options.getSelectedCells,
      cellCount: options.cellCount ?? 24,
      rowCount: options.rowCount ?? 7
    };
  }

  setRenderer(renderer: any): void {
    this.renderer = renderer;
  }

  updateHandlers(handlers: HeatmapEventHandlers): void {
    this.options.handlers = { ...this.options.handlers, ...handlers };
  }

  // ========== Coordinate Conversion ==========

  getCellFromCoords(x: number, y: number): CellSelection | null {
    const { CELL_WIDTH, CELL_HEIGHT, ROW_LABEL_WIDTH, COL_LABEL_HEIGHT, PADDING, GAP } = LAYOUT;

    const offsetX = PADDING;
    const offsetY = PADDING;
    const gridWidth = this.options.cellCount * (CELL_WIDTH + GAP);
    const gridHeight = this.options.rowCount * (CELL_HEIGHT + GAP);
    const totalsX = offsetX + ROW_LABEL_WIDTH + gridWidth + 8;
    const totalsY = offsetY + COL_LABEL_HEIGHT + gridHeight + 8;

    // 检查列总计 (底部)
    if (y >= totalsY && y <= totalsY + CELL_HEIGHT &&
        x >= offsetX + ROW_LABEL_WIDTH && x < offsetX + ROW_LABEL_WIDTH + gridWidth) {
      const hour = Math.floor((x - offsetX - ROW_LABEL_WIDTH) / (CELL_WIDTH + GAP));
      if (hour >= 0 && hour < this.options.cellCount) {
        return { day: -1, hour, type: 'col' };
      }
    }

    // 检查行总计 (右侧)
    if (x >= totalsX && x <= totalsX + CELL_WIDTH &&
        y >= offsetY + COL_LABEL_HEIGHT && y < offsetY + COL_LABEL_HEIGHT + gridHeight) {
      const day = Math.floor((y - offsetY - COL_LABEL_HEIGHT) / (CELL_HEIGHT + GAP));
      if (day >= 0 && day < this.options.rowCount) {
        return { day, hour: -1, type: 'row' };
      }
    }

    // 检查主网格
    if (x < offsetX + ROW_LABEL_WIDTH || y < offsetY + COL_LABEL_HEIGHT) {
      return null;
    }

    const hour = Math.floor((x - offsetX - ROW_LABEL_WIDTH) / (CELL_WIDTH + GAP));
    const day = Math.floor((y - offsetY - COL_LABEL_HEIGHT) / (CELL_HEIGHT + GAP));

    if (day >= 0 && day < this.options.rowCount && hour >= 0 && hour < this.options.cellCount) {
      return { day, hour, type: 'cell' };
    }

    return null;
  }

  // ========== Selection Logic ==========

  private buildSelectedSet(cells: CellSelection[]): Set<string> {
    return new Set(cells.map((c) =>
      c.type === 'cell' ? `cell-${c.day}-${c.hour}` :
      c.type === 'row' ? `row-${c.day}` : `col-${c.hour}`
    ));
  }

  // ========== Event Handlers ==========

  onClick(event: ClickEvent): void {
    const { CELL_WIDTH, ROW_LABEL_WIDTH, PADDING, GAP } = LAYOUT;

    const offsetX = PADDING;
    const offsetY = PADDING;
    const gridWidth = this.options.cellCount * (CELL_WIDTH + GAP);
    const totalsX = offsetX + ROW_LABEL_WIDTH + gridWidth + 8;

    // 检测是否点击了设置图标
    if (this.renderer && this.renderer.isClickOnSettingsIcon(event.x, event.y, totalsX, offsetY, CELL_WIDTH)) {
      console.log('[Heatmap] Settings icon clicked');
      this.options.handlers.onSettingsOpen?.();
      return;
    }

    const cell = this.getCellFromCoords(event.x, event.y);
    if (!cell) return;

    const ctrlKey = this.options.getCtrlKey();

    console.log('[Heatmap] onClick:', {
      cell: `${cell.type}(${cell.day},${cell.hour})`,
      ctrlKey,
      clickCount: event.clickCount,
      selectedCount: this.options.getSelectedCells().length
    });

    if (event.clickCount === 2) {
      // 双击：占位（暂时无操作）
      console.log('[Heatmap] Double click - reserved (no action)');
    } else {
      // 单击：选择
      this.handleCellSelection(cell, ctrlKey);
    }
  }

  onMouseMove(): void {
    // 可以添加 hover 效果
  }

  onMouseLeave(): void {
    // 清理
  }

  // ========== Private Methods ==========

  private handleCellSelection(
    cell: CellSelection,
    ctrlKey: boolean
  ): void {
    // 获取当前选中的单元格
    const currentSelection = this.options.getSelectedCells();

    console.log('[Heatmap] handleCellSelection:', {
      cell: `${cell.type}(${cell.day},${cell.hour})`,
      ctrlKey,
      currentCount: currentSelection.length
    });

    const selectedSet = this.buildSelectedSet(currentSelection);
    const key = cell.type === 'cell' ? `cell-${cell.day}-${cell.hour}` :
                cell.type === 'row' ? `row-${cell.day}` : `col-${cell.hour}`;

    let newSelection: CellSelection[];

    if (ctrlKey) {
      // Ctrl+ 点击：切换
      if (selectedSet.has(key)) {
        selectedSet.delete(key);
      } else {
        selectedSet.add(key);
      }
      newSelection = this.setToArray(selectedSet);
    } else {
      // 普通点击：如果已选中则清除，否则替换
      if (selectedSet.has(key)) {
        newSelection = [];
      } else {
        // 点击行/列总计时，选中整行/整列
        if (cell.type === 'row') {
          // 选中整行
          newSelection = [];
          for (let hour = 0; hour < this.options.cellCount; hour++) {
            newSelection.push({ day: cell.day, hour, type: 'cell' });
          }
        } else if (cell.type === 'col') {
          // 选中整列
          newSelection = [];
          for (let day = 0; day < this.options.rowCount; day++) {
            newSelection.push({ day, hour: cell.hour, type: 'cell' });
          }
        } else {
          newSelection = [cell];
        }
      }
    }

    console.log('[Heatmap] New selection:', newSelection.length, 'cells');
    this.emitSelect(cell, ctrlKey, newSelection);
  }

  private setToArray(set: Set<string>): CellSelection[] {
    const result: CellSelection[] = [];
    set.forEach((key) => {
      if (key.startsWith('cell-')) {
        const [, day, hour] = key.split('-');
        result.push({ day: parseInt(day), hour: parseInt(hour), type: 'cell' });
      } else if (key.startsWith('row-')) {
        result.push({ day: parseInt(key.split('-')[1]), hour: -1, type: 'row' });
      } else if (key.startsWith('col-')) {
        result.push({ day: -1, hour: parseInt(key.split('-')[1]), type: 'col' });
      }
    });
    return result;
  }

  private emitSelect(
    cell: CellSelection,
    ctrlKey: boolean,
    selectedCells: CellSelection[]
  ): void {
    this.options.handlers.onCellSelect?.({
      cell,
      isDragging: false,
      ctrlKey,
      selectedCells
    });
  }
}
