/**
 * Canvas 引擎 - 提供渲染和事件处理的核心抽象
 * 
 * 架构设计:
 * 1. CanvasEngine - 核心引擎类，管理 canvas 上下文、渲染循环、事件绑定
 * 2. Renderer - 渲染器接口，由具体组件实现绘制逻辑
 * 3. EventHandler - 事件处理器，将鼠标坐标转换为逻辑坐标并触发事件
 */

// ========== Types ==========

export interface CanvasEngineOptions {
  dpr?: number;                    // 设备像素比
  width: number;                   // 逻辑宽度
  height: number;                  // 逻辑高度
}

export interface RenderContext {
  ctx: CanvasRenderingContext2D;
  width: number;
  height: number;
  dpr: number;
}

export interface MouseEvent {
  x: number;                       // 逻辑 X 坐标
  y: number;                       // 逻辑 Y 坐标
  rawX: number;                    // 原始 X 坐标
  rawY: number;                    // 原始 Y 坐标
}

export interface ClickEvent extends MouseEvent {
  clickCount: number;              // 点击次数 (1=单击，2=双击)
}

export interface DragEvent extends MouseEvent {
  startX: number;                  // 拖拽起始 X
  startY: number;                  // 拖拽起始 Y
  deltaX: number;                  // X 位移
  deltaY: number;                  // Y 位移
  isDragging: boolean;
}

// ========== Renderer Interface ==========

/**
 * 渲染器接口 - 由具体组件实现
 */
export interface Renderer {
  /** 渲染入口 */
  render(ctx: RenderContext): void;

  /** 可选：清理资源 */
  destroy?(): void;
}

// ========== Event Handler Interface ==========

/**
 * 事件处理器接口
 */
export interface EventHandler {
  /** 处理点击事件 */
  onClick?(event: ClickEvent): void;
  
  /** 处理拖拽开始 */
  onDragStart?(event: MouseEvent): void;
  
  /** 处理拖拽中 */
  onDrag?(event: DragEvent): void;
  
  /** 处理拖拽结束 */
  onDragEnd?(event: MouseEvent): void;
  
  /** 处理鼠标移动 */
  onMouseMove?(event: MouseEvent): void;
  
  /** 处理鼠标离开 */
  onMouseLeave?(): void;
}

// ========== Canvas Engine ==========

export class CanvasEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private options: Required<CanvasEngineOptions>;
  private renderer: Renderer | null = null;
  private eventHandler: EventHandler | null = null;
  private isDragging = false;
  private dragStartX = 0;
  private dragStartY = 0;
  private clickTimer: ReturnType<typeof setTimeout> | null = null;
  private lastClickPos: { x: number; y: number } | null = null;
  private lastClickTime = 0;

  constructor(canvas: HTMLCanvasElement, options: CanvasEngineOptions) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.options = {
      dpr: options.dpr ?? (typeof window !== 'undefined' ? window.devicePixelRatio : 1) ?? 1,
      width: options.width,
      height: options.height
    };

    this.setupCanvas();
    this.bindEvents();
  }

  private setupCanvas(): void {
    const { width, height, dpr } = this.options;
    
    // 设置实际像素
    this.canvas.width = width * dpr;
    this.canvas.height = height * dpr;
    
    // 设置 CSS 尺寸
    this.canvas.style.width = `${width}px`;
    this.canvas.style.height = `${height}px`;
    
    // 缩放上下文
    this.ctx.scale(dpr, dpr);
  }

  private bindEvents(): void {
    this.canvas.addEventListener('click', this.handleClick.bind(this));
    this.canvas.addEventListener('mousedown', this.handleMouseDown.bind(this));
    this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
    this.canvas.addEventListener('mouseup', this.handleMouseUp.bind(this));
    this.canvas.addEventListener('mouseleave', this.handleMouseLeave.bind(this));
  }

  private getLogicalCoords(e: globalThis.MouseEvent): MouseEvent {
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      rawX: e.clientX,
      rawY: e.clientY
    };
  }

  private handleClick(e: globalThis.MouseEvent): void {
    if (!this.eventHandler?.onClick) return;

    const pos = this.getLogicalCoords(e);
    const now = Date.now();
    
    // 判断双击
    const isDoubleClick = this.lastClickPos &&
      Math.abs(pos.x - this.lastClickPos.x) < 5 &&
      Math.abs(pos.y - this.lastClickPos.y) < 5 &&
      now - this.lastClickTime < 300;
    
    if (isDoubleClick) {
      if (this.clickTimer) {
        clearTimeout(this.clickTimer);
        this.clickTimer = null;
      }
      this.eventHandler.onClick({ ...pos, clickCount: 2 });
      this.lastClickPos = null;
      this.lastClickTime = 0;
    } else {
      // 延迟触发单击
      if (this.clickTimer) {
        clearTimeout(this.clickTimer);
      }
      this.lastClickPos = { x: pos.x, y: pos.y };
      this.lastClickTime = now;
      this.clickTimer = setTimeout(() => {
        this.eventHandler?.onClick?.({ ...pos, clickCount: 1 });
        this.clickTimer = null;
        this.lastClickPos = null;
      }, 300);
    }
  }

  private handleMouseDown(e: globalThis.MouseEvent): void {
    const pos = this.getLogicalCoords(e);
    this.isDragging = true;
    this.dragStartX = pos.x;
    this.dragStartY = pos.y;
    this.eventHandler?.onDragStart?.(pos);
  }

  private handleMouseMove(e: globalThis.MouseEvent): void {
    const pos = this.getLogicalCoords(e);

    if (this.isDragging) {
      const deltaX = pos.x - this.dragStartX;
      const deltaY = pos.y - this.dragStartY;
      this.eventHandler?.onDrag?.({
        ...pos,
        startX: this.dragStartX,
        startY: this.dragStartY,
        deltaX,
        deltaY,
        isDragging: true
      });
    } else {
      this.eventHandler?.onMouseMove?.(pos);
    }
  }

  private handleMouseUp(e: globalThis.MouseEvent): void {
    if (!this.isDragging) return;
    const pos = this.getLogicalCoords(e);
    this.isDragging = false;
    this.eventHandler?.onDragEnd?.(pos);
  }

  private handleMouseLeave(): void {
    this.isDragging = false;
    this.eventHandler?.onMouseLeave?.();
  }

  // ========== Public API ==========

  setRenderer(renderer: Renderer): void {
    this.renderer = renderer;
    this.render();
  }

  setEventHandler(handler: EventHandler): void {
    this.eventHandler = handler;
  }

  render(): void {
    if (!this.renderer) return;
    
    const renderCtx: RenderContext = {
      ctx: this.ctx,
      width: this.options.width,
      height: this.options.height,
      dpr: this.options.dpr
    };
    
    // 清空画布
    this.ctx.clearRect(0, 0, this.options.width, this.options.height);
    
    this.renderer.render(renderCtx);
  }

  resize(width: number, height: number): void {
    this.options.width = width;
    this.options.height = height;
    this.setupCanvas();
    this.render();
  }

  destroy(): void {
    this.renderer?.destroy?.();
    this.canvas.removeEventListener('click', this.handleClick.bind(this));
    this.canvas.removeEventListener('mousedown', this.handleMouseDown.bind(this));
    this.canvas.removeEventListener('mousemove', this.handleMouseMove.bind(this));
    this.canvas.removeEventListener('mouseup', this.handleMouseUp.bind(this));
    this.canvas.removeEventListener('mouseleave', this.handleMouseLeave.bind(this));
  }

  // ========== Helpers ==========

  /** 获取 Canvas 元素 */
  getCanvas(): HTMLCanvasElement {
    return this.canvas;
  }

  /** 获取渲染上下文 */
  getContext(): CanvasRenderingContext2D {
    return this.ctx;
  }

  /** 获取尺寸 */
  getSize(): { width: number; height: number } {
    return { width: this.options.width, height: this.options.height };
  }
}

// ========== Utility Functions ==========

export function roundRect(
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

export function drawText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  options: {
    align?: CanvasTextAlign;
    baseline?: CanvasTextBaseline;
    font?: string;
    color?: string;
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
