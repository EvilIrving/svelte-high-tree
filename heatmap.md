# 热力图组件架构文档

## 概述

本文档详细说明了 `ActivityHeatmap` 组件的架构设计、Canvas 引擎实现和交互逻辑。

---

## 目录结构

```
src/lib/components/
└── ActivityHeatmap.svelte      # Svelte 组件入口

src/lib/canvas/
├── CanvasEngine.ts             # Canvas 核心引擎
├── HeatmapRenderer.ts          # 热力图渲染器
└── HeatmapEventHandler.ts      # 热力图事件处理器
```

---

## 架构设计

### 三层架构

```
┌─────────────────────────────────────────────────────────┐
│  ActivityHeatmap.svelte (视图层)                        │
│  - Svelte 组件                                          │
│  - 状态管理 (activityLevels, selectedCells)             │
│  - 生命周期管理                                         │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│  CanvasEngine (引擎层)                                  │
│  - Canvas 上下文管理                                    │
│  - 渲染循环                                             │
│  - 事件绑定与分发                                       │
└─────────────────────────────────────────────────────────┘
                          ↓
        ┌─────────────────┴─────────────────┐
        ↓                                   ↓
┌──────────────────┐              ┌──────────────────┐
│ HeatmapRenderer  │              │HeatmapEventHandler│
│ (渲染实现)        │              │ (交互逻辑)        │
│ - 绘制网格        │              │ - 坐标转换        │
│ - 绘制标签        │              │ - 选择逻辑        │
│ - 绘制图例        │              │ - 事件触发        │
│ - 绘制总计        │              │                  │
└──────────────────┘              └──────────────────┘
```

---

## Canvas 引擎 (`CanvasEngine.ts`)

### 核心职责

1. **Canvas 上下文管理** - 创建和管理 2D 渲染上下文
2. **设备像素比适配** - 支持 HiDPI/Retina 显示屏
3. **渲染循环** - 提供 `render()` 方法触发渲染
4. **事件系统** - 统一处理鼠标事件并分发给事件处理器

### 关键类型

```typescript
interface CanvasEngineOptions {
  dpr?: number;        // 设备像素比 (默认 window.devicePixelRatio)
  width: number;       // 逻辑宽度 (CSS 像素)
  height: number;      // 逻辑高度 (CSS 像素)
}

interface RenderContext {
  ctx: CanvasRenderingContext2D;
  width: number;
  height: number;
  dpr: number;
}

interface MouseEvent {
  x: number;           // 逻辑 X 坐标
  y: number;           // 逻辑 Y 坐标
  rawX: number;        // 原始 X 坐标 (屏幕像素)
  rawY: number;        // 原始 Y 坐标 (屏幕像素)
}

interface ClickEvent extends MouseEvent {
  clickCount: number;  // 1=单击，2=双击
}

interface DragEvent extends MouseEvent {
  startX: number;      // 拖拽起始 X
  startY: number;      // 拖拽起始 Y
  deltaX: number;      // X 位移
  deltaY: number;      // Y 位移
  isDragging: boolean;
}
```

### 双击检测逻辑

```typescript
private handleClick(e: MouseEvent): void {
  const pos = this.getLogicalCoords(e);
  const now = Date.now();

  // 判断双击条件:
  // 1. 位置偏差 < 5px
  // 2. 时间间隔 < 300ms
  const isDoubleClick = this.lastClickPos &&
    Math.abs(pos.x - this.lastClickPos.x) < 5 &&
    Math.abs(pos.y - this.lastClickPos.y) < 5 &&
    now - this.lastClickTime < 300;

  if (isDoubleClick) {
    // 触发双击事件
    this.eventHandler.onClick({ ...pos, clickCount: 2 });
  } else {
    // 延迟 300ms 触发单击事件
    this.clickTimer = setTimeout(() => {
      this.eventHandler?.onClick?.({ ...pos, clickCount: 1 });
    }, 300);
  }
}
```

### 公共 API

| 方法 | 说明 |
|------|------|
| `setRenderer(renderer)` | 设置渲染器并触发渲染 |
| `setEventHandler(handler)` | 设置事件处理器 |
| `render()` | 清空画布并调用渲染器 |
| `resize(width, height)` | 调整画布尺寸 |
| `destroy()` | 清理资源和事件监听 |

---

## 热力图渲染器 (`HeatmapRenderer.ts`)

### 布局常量

```typescript
const LAYOUT = {
  CELL_WIDTH: 50,        // 单元格宽度
  CELL_HEIGHT: 26,       // 单元格高度
  ROW_LABEL_WIDTH: 40,   // 行标签宽度
  COL_LABEL_HEIGHT: 20,  // 列标签高度
  LEGEND_WIDTH: 280,     // 图例宽度
  PADDING: 20,           // 画布内边距
  GAP: 2                 // 单元格间距
};
```

### 画布布局

```
┌────────────────────────────────────────────────────────────┐
│  PADDING (20px)                                            │
│  ┌────────────────────────────────────────────────────┐    │
│  │ 列标签 (小时 0-23)                                  │    │
│  ├────────────────────────────────────────────────────┤    │
│  │行│  ┌──┬──┬──┬──┬──┬──┬──┬──┬──┬──┬──┬──┐         │    │
│  │标│  │  │  │  │  │  │  │  │  │  │  │  │  │ 行总计  │    │
│  │签│  ├──┼──┼──┼──┼──┼──┼──┼──┼──┼──┼──┼──┤         │    │
│  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │         │ 图 │
│  │周│  ├──┼──┼──┼──┼──┼──┼──┼──┼──┼──┼──┼──┤         │ 例 │
│  │一│  │  │  │  │  │  │  │  │  │  │  │  │  │         │    │
│  │  │  └──┴──┴──┴──┴──┴──┴──┴──┴──┴──┴──┴──┘         │    │
│  │                    列总计 (0-23 点)                 │    │
│  └────────────────────────────────────────────────────┘    │
└────────────────────────────────────────────────────────────┘
```

### 渲染流程

```typescript
render(ctx: RenderContext): void {
  // 1. 绘制列标签 (小时 0-23)
  this.drawColumnLabels(ctx, ...);

  // 2. 绘制行标签 (周一至周日)
  this.drawRowLabels(ctx, ...);

  // 3. 绘制网格单元格 (7×24)
  this.drawGridCells(ctx, ...);

  // 4. 绘制行总计 (右侧)
  this.drawRowTotals(ctx, ...);

  // 5. 绘制列总计 (底部)
  this.drawColumnTotals(ctx, ...);

  // 6. 绘制图例 (活动水平)
  this.drawLegend(ctx, ...);

  // 7. 绘制设置提示 (可选)
  if (showFilter) {
    this.drawSettingsHint(ctx, ...);
  }
}
```

### 单元格着色逻辑

```typescript
// 根据数值获取背景色
function getCellColor(count: number, levels: ActivityLevel[]): string {
  if (count === 0) return '#f5f5f5';  // 无数据
  for (const level of levels) {
    if (count >= level.min && count <= level.max) {
      return level.color;
    }
  }
  return '#f5f5f5';
}

// 根据背景色获取文字颜色
function getCellTextColor(count: number, levels: ActivityLevel[]): string {
  if (count === 0) return '#999';
  for (const level of levels) {
    if (count >= level.min && count <= level.max) {
      // 浅色背景用深色文字
      if (level.color === '#fff566' || level.color === '#b7eb8f') 
        return '#333';
      return '#fff';  // 深色背景用白色文字
    }
  }
  return '#fff';
}
```

### 活动水平图例

| 级别 | 颜色 | 默认阈值 |
|------|------|----------|
| 低活跃 | `#b7eb8f` (浅绿) | 0 - 2000 |
| 中等活跃 | `#fff566` (黄色) | 2001 - 8000 |
| 高活跃 | `#ffbb96` (橙色) | 8001 - 14000 |
| 极度活跃 | `#ff7875` (红色) | 14001+ |

### 设置图标

图例标题旁绘制蓝色齿轮图标 (⚙️)，点击可打开活动水平设置弹窗。

```typescript
// 绘制设置图标
const settingsIconX = legendX + 70;
const settingsIconY = legendY + 14;
ctx.ctx.font = '16px -apple-system';
ctx.ctx.fillStyle = '#1890ff';
ctx.ctx.fillText('⚙', settingsIconX, settingsIconY);

// 点击检测
isClickOnSettingsIcon(x, y, totalsX, offsetY, cellWidth): boolean {
  const iconSize = 20;
  return x >= settingsIconX && x <= settingsIconX + iconSize &&
         y >= settingsIconY - iconSize && y <= settingsIconY + iconSize;
}
```

---

## 热力图事件处理器 (`HeatmapEventHandler.ts`)

### 坐标转换

将鼠标点击坐标转换为网格单元格索引：

```typescript
getCellFromCoords(x: number, y: number): CellSelection | null {
  // 1. 检查列总计 (底部)
  if (y >= totalsY && x >= offsetX + ROW_LABEL_WIDTH) {
    const hour = Math.floor((x - offsetX - ROW_LABEL_WIDTH) / (CELL_WIDTH + GAP));
    return { day: -1, hour, type: 'col' };
  }

  // 2. 检查行总计 (右侧)
  if (x >= totalsX && y >= offsetY + COL_LABEL_HEIGHT) {
    const day = Math.floor((y - offsetY - COL_LABEL_HEIGHT) / (CELL_HEIGHT + GAP));
    return { day, hour: -1, type: 'row' };
  }

  // 3. 检查主网格
  const hour = Math.floor((x - offsetX - ROW_LABEL_WIDTH) / (CELL_WIDTH + GAP));
  const day = Math.floor((y - offsetY - COL_LABEL_HEIGHT) / (CELL_HEIGHT + GAP));
  
  if (day >= 0 && day < 7 && hour >= 0 && hour < 24) {
    return { day, hour, type: 'cell' };
  }

  return null;
}
```

### 选择逻辑

#### 单击行为

| 操作 | 结果 |
|------|------|
| 单击单元格 | 选中/取消选中该单元格 |
| 单击行总计 | 选中整行所有单元格 |
| 单击列总计 | 选中整列所有单元格 |
| Ctrl+ 单击 | 切换选中状态 (不取消其他选中) |
| 单击设置图标 | 打开活动水平设置弹窗 |

#### 双击行为

双击目前为占位功能，暂不执行任何操作。

### 事件处理流程

```typescript
onClick(event: ClickEvent): void {
  // 1. 检测是否点击设置图标
  if (this.renderer.isClickOnSettingsIcon(event.x, event.y, ...)) {
    this.options.handlers.onSettingsOpen?.();
    return;
  }

  // 2. 获取点击的单元格
  const cell = this.getCellFromCoords(event.x, event.y);
  if (!cell) return;

  // 3. 双击占位
  if (event.clickCount === 2) {
    console.log('[Heatmap] Double click - reserved');
    return;
  }

  // 4. 处理选择逻辑
  this.handleCellSelection(cell, ctrlKey);
}

private handleCellSelection(cell: CellSelection, ctrlKey: boolean): void {
  const selectedSet = this.buildSelectedSet(currentSelection);
  const key = this.getCellKey(cell);

  if (ctrlKey) {
    // Ctrl+ 点击：切换
    if (selectedSet.has(key)) {
      selectedSet.delete(key);
    } else {
      selectedSet.add(key);
    }
  } else {
    // 普通点击
    if (selectedSet.has(key)) {
      newSelection = [];  // 取消选中
    } else {
      if (cell.type === 'row') {
        // 选中整行
        newSelection = this.getRowCells(cell.day);
      } else if (cell.type === 'col') {
        // 选中整列
        newSelection = this.getColCells(cell.hour);
      } else {
        newSelection = [cell];
      }
    }
  }

  // 5. 触发自定义事件
  this.emitSelect(cell, ctrlKey, newSelection);
}
```

---

## Svelte 组件 (`ActivityHeatmap.svelte`)

### Props 接口

```typescript
interface Props {
  data: HeatmapData;              // 热力图数据
  activityLevels?: ActivityLevel[]; // 活动水平配置
  selectedCells?: CellSelection[];  // 选中的单元格
  showFilter?: boolean;           // 是否显示过滤器提示
}
```

### 自定义事件

| 事件名 | 详情 |
|--------|------|
| `cellselect` | 单元格选择变化时触发 |
| `activitylevelschange` | 活动水平配置变化时触发 |

### 状态管理

```typescript
// 本地活动水平配置 (响应式快照)
let localActivityLevels = $state<ActivityLevel[]>([...activityLevels]);

// Canvas 引擎实例
let engine: CanvasEngine | null = null;
let renderer: HeatmapRenderer | null = null;
let eventHandler: HeatmapEventHandler | null = null;

// UI 状态
let settingsOpen = $state(false);  // 设置弹窗
let ctrlKey = $state(false);       // Ctrl 键状态
```

### 生命周期

```typescript
onMount(() => {
  // 1. 创建 Canvas 引擎
  engine = new CanvasEngine(canvasRef, {
    width: canvasWidth,
    height: canvasHeight
  });

  // 2. 创建渲染器
  renderer = new HeatmapRenderer({
    data,
    activityLevels: localActivityLevels,
    selectedCells,
    showFilter
  });

  // 3. 创建事件处理器
  eventHandler = new HeatmapEventHandler({
    handlers: {
      onCellSelect: handleCellSelect,
      onSettingsOpen: () => { settingsOpen = true; }
    },
    getCtrlKey: () => ctrlKey,
    getSelectedCells: () => selectedCells
  });

  // 4. 建立 renderer 引用 (用于设置图标检测)
  eventHandler.setRenderer(renderer);

  // 5. 设置引擎
  engine.setRenderer(renderer);
  engine.setEventHandler(eventHandler);

  // 6. 绑定键盘事件
  window.addEventListener('keydown', handleKeyDown);
  window.addEventListener('keyup', handleKeyUp);
});

onDestroy(() => {
  engine?.destroy();
  window.removeEventListener('keydown', handleKeyDown);
  window.removeEventListener('keyup', handleKeyUp);
});
```

### 响应式更新

```typescript
// 当数据或配置变化时，更新渲染器
$effect(() => {
  if (renderer && engine) {
    renderer.updateOptions({
      data,
      activityLevels: localActivityLevels,
      selectedCells,
      showFilter
    });
    engine.render();
  }
});
```

---

## 交互流程图

```
用户操作
   │
   ▼
┌─────────────────┐
│  CanvasEngine   │  ← 捕获原始鼠标事件
│  (事件绑定)     │
└────────┬────────
         │
         ▼
┌─────────────────┐
│ HeatmapEvent    │  ← 坐标转换
│ Handler         │  ← 选择逻辑判断
└────────┬────────┘
         │
         ├──────────────┐
         │              │
         ▼              ▼
┌─────────────────┐  ┌─────────────────┐
│ onCellSelect    │  │ onSettingsOpen  │
│ (单元格选择)    │  │ (打开设置)      │
└────────┬────────┘  └────────┬────────┘
         │                    │
         ▼                    ▼
┌─────────────────┐  ┌─────────────────┐
│ ActivityHeatmap │  │  settingsOpen   │
│ (状态更新)      │  │  = true         │
└────────┬────────┘  └────────┬────────┘
         │                    │
         ▼                    ▼
┌─────────────────┐  ┌─────────────────┐
│ engine.render() │  │  显示设置弹窗   │
└─────────────────┘  └─────────────────┘
```

---

## 工具函数

### `roundRect()` - 绘制圆角矩形

```typescript
function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number = 4
): void {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}
```

### `drawText()` - 绘制文字

```typescript
function drawText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  options: {
    align?: CanvasTextAlign;      // 默认 'center'
    baseline?: CanvasTextBaseline; // 默认 'middle'
    font?: string;                 // 默认 '12px sans-serif'
    color?: string;                // 默认 '#333'
  } = {}
): void {
  ctx.save();
  ctx.textAlign = options.align ?? 'center';
  ctx.textBaseline = options.baseline ?? 'middle';
  ctx.font = options.font ?? '12px sans-serif';
  ctx.fillStyle = options.color ?? '#333';
  ctx.fillText(text, x, y);
  ctx.restore();
}
```

---

## 扩展指南

### 添加新的渲染元素

1. 在 `HeatmapRenderer` 中添加新的绘制方法
2. 在 `render()` 方法中调用新方法

```typescript
render(ctx: RenderContext): void {
  // ... 现有绘制
  this.drawNewElement(ctx, ...);
}

private drawNewElement(ctx: RenderContext, ...): void {
  // 自定义绘制逻辑
}
```

### 添加新的交互行为

1. 在 `HeatmapEventHandlers` 接口中添加新的事件回调
2. 在 `HeatmapEventHandler.onClick/onDrag` 中处理新逻辑
3. 在 `ActivityHeatmap.svelte` 中实现回调处理

### 修改布局尺寸

修改 `LAYOUT` 常量后，所有相关绘制和坐标转换会自动适配：

```typescript
export const LAYOUT = {
  CELL_WIDTH: 60,      // 增加单元格宽度
  CELL_HEIGHT: 30,     // 增加单元格高度
  // ... 其他常量
};
```

---

## 性能优化

1. **按需渲染** - 只在数据或状态变化时调用 `engine.render()`
2. **Set 数据结构** - 使用 `Set<string>` 存储选中状态，O(1) 查找
3. **延迟单击事件** - 300ms 延迟区分单击/双击，避免误触发
4. **设备像素比适配** - HiDPI 屏幕上保持清晰渲染

---

## 调试技巧

### 查看渲染日志

```typescript
// 在 HeatmapRenderer.ts 中
console.log('[Renderer] isCellSelected:', key, result);
```

### 查看事件日志

```typescript
// 在 HeatmapEventHandler.ts 中
console.log('[Heatmap] onClick:', { cell, clickCount });
```

### 检查 Canvas 状态

```typescript
// 在浏览器控制台中
const canvas = document.querySelector('canvas');
const ctx = canvas.getContext('2d');
ctx.fillRect(0, 0, 10, 10);  // 测试绘制
```

---

## 版本历史

| 版本 | 日期 | 变更 |
|------|------|------|
| 1.0 | 2026-03-08 | 初始实现：基础热力图渲染 |
| 1.1 | 2026-03-08 | 添加活动水平设置滑块 |
| 1.2 | 2026-03-08 | 添加设置图标点击交互 |
