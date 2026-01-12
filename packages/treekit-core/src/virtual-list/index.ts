import type { FlatNode } from '../core/types';
import { getCheckState } from '../algorithms';

// 重新导出 core 的 getCheckState 作为 getNodeCheckState（兼容旧代码）
export { getCheckState as getNodeCheckState };

/**
 * 虚拟列表状态
 */
export interface VirtualListState {
  startIndex: number;
  endIndex: number;
  offsetTop: number;
}

/**
 * 虚拟列表控制器
 * 使用 IntersectionObserver 实现高性能虚拟滚动
 */
export class VirtualListController<T = FlatNode> {
  private container: HTMLElement | null = null;
  private topSentinel: HTMLElement | null = null;
  private bottomSentinel: HTMLElement | null = null;
  private observer: IntersectionObserver | null = null;

  private itemHeight: number;
  private bufferSize: number;
  private visibleList: T[] = [];

  private state: VirtualListState = {
    startIndex: 0,
    endIndex: 0,
    offsetTop: 0
  };

  private onStateChange: (state: VirtualListState) => void;
  private scrollHandler: (() => void) | null = null;

  constructor(options: {
    itemHeight: number;
    bufferSize?: number;
    onStateChange: (state: VirtualListState) => void;
  }) {
    this.itemHeight = options.itemHeight;
    this.bufferSize = options.bufferSize ?? 10;
    this.onStateChange = options.onStateChange;
  }

  /**
   * 初始化
   */
  init(container: HTMLElement, topSentinel: HTMLElement, bottomSentinel: HTMLElement): void {
    this.container = container;
    this.topSentinel = topSentinel;
    this.bottomSentinel = bottomSentinel;

    // 使用 IntersectionObserver 检测边界
    this.observer = new IntersectionObserver(
      (entries) => this.handleIntersection(entries),
      {
        root: container,
        rootMargin: `${this.bufferSize * this.itemHeight}px 0px`,
        threshold: 0
      }
    );

    this.observer.observe(topSentinel);
    this.observer.observe(bottomSentinel);

    // 同时监听滚动事件（用于更精确的位置计算）
    this.scrollHandler = () => this.recalculate();
    container.addEventListener('scroll', this.scrollHandler, { passive: true });

    this.recalculate();
  }

  /**
   * 更新可见列表
   */
  updateVisibleList(list: T[]): void {
    this.visibleList = list;
    this.recalculate();
  }

  /**
   * 查找节点索引的回调（用于 scrollToNode）
   */
  private findIndexById: ((id: string) => number) | null = null;

  /**
   * 设置查找节点索引的回调（用于 scrollToNode）
   */
  setFindIndexById(fn: (id: string) => number): void {
    this.findIndexById = fn;
  }

  /**
   * 处理交叉观察
   */
  private handleIntersection(entries: IntersectionObserverEntry[]): void {
    let needsRecalc = false;

    for (const entry of entries) {
      if (entry.isIntersecting) {
        needsRecalc = true;
      }
    }

    if (needsRecalc) {
      this.recalculate();
    }
  }

  /**
   * 重新计算渲染范围
   */
  private recalculate(): void {
    if (!this.container) return;

    const viewportHeight = this.container.clientHeight;
    const viewportNodes = Math.ceil(viewportHeight / this.itemHeight);
    const totalNodes = this.visibleList.length;

    // 计算当前滚动位置对应的起始索引
    const scrollTop = this.container.scrollTop;
    const scrollIndex = Math.floor(scrollTop / this.itemHeight);

    // 计算渲染范围（包含缓冲区）
    const startIndex = Math.max(0, scrollIndex - this.bufferSize);
    const endIndex = Math.min(totalNodes, scrollIndex + viewportNodes + this.bufferSize);

    const newState: VirtualListState = {
      startIndex,
      endIndex,
      offsetTop: startIndex * this.itemHeight
    };

    // 只有当状态变化时才通知
    if (
      newState.startIndex !== this.state.startIndex ||
      newState.endIndex !== this.state.endIndex
    ) {
      this.state = newState;
      this.onStateChange(this.state);
    }
  }

  /**
   * 滚动到指定节点（需要先设置 setFindIndexById）
   */
  scrollToNode(nodeId: string): void {
    if (!this.findIndexById || !this.container) return;

    const index = this.findIndexById(nodeId);
    if (index === -1) return;

    const targetTop = index * this.itemHeight;
    const viewportHeight = this.container.clientHeight;

    // 如果节点在视口外，滚动到居中位置
    const currentScrollTop = this.container.scrollTop;
    if (targetTop < currentScrollTop || targetTop > currentScrollTop + viewportHeight) {
      this.container.scrollTop = targetTop - viewportHeight / 2 + this.itemHeight / 2;
    }

    this.recalculate();
  }

  /**
   * 滚动到指定索引
   */
  scrollToIndex(index: number): void {
    if (index < 0 || index >= this.visibleList.length || !this.container) return;

    const targetTop = index * this.itemHeight;
    const viewportHeight = this.container.clientHeight;

    // 如果节点在视口外，滚动到居中位置
    const currentScrollTop = this.container.scrollTop;
    if (targetTop < currentScrollTop || targetTop > currentScrollTop + viewportHeight) {
      this.container.scrollTop = targetTop - viewportHeight / 2 + this.itemHeight / 2;
    }

    this.recalculate();
  }

  /**
   * 滚动到顶部
   */
  scrollToTop(): void {
    if (!this.container) return;
    this.container.scrollTop = 0;
    this.recalculate();
  }

  /**
   * 滚动到底部
   */
  scrollToBottom(): void {
    if (!this.container) return;
    this.container.scrollTop = this.visibleList.length * this.itemHeight;
    this.recalculate();
  }

  /**
   * 获取当前状态
   */
  getState(): VirtualListState {
    return { ...this.state };
  }

  /**
   * 获取总高度
   */
  getTotalHeight(): number {
    return this.visibleList.length * this.itemHeight;
  }

  /**
   * 销毁
   */
  destroy(): void {
    this.observer?.disconnect();
    this.observer = null;

    if (this.container && this.scrollHandler) {
      this.container.removeEventListener('scroll', this.scrollHandler);
    }
    this.scrollHandler = null;
    this.container = null;
  }
}

/**
 * 简化版：基于 scroll 事件的虚拟列表计算
 * 适用于不需要 IntersectionObserver 的场景
 */
export function calculateVisibleRange(
  scrollTop: number,
  viewportHeight: number,
  itemHeight: number,
  totalCount: number,
  bufferSize: number = 10
): VirtualListState {
  const scrollIndex = Math.floor(scrollTop / itemHeight);
  const viewportNodes = Math.ceil(viewportHeight / itemHeight);

  const startIndex = Math.max(0, scrollIndex - bufferSize);
  const endIndex = Math.min(totalCount, scrollIndex + viewportNodes + bufferSize);

  return {
    startIndex,
    endIndex,
    offsetTop: startIndex * itemHeight
  };
}
