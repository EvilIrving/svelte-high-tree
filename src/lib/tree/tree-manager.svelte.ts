import type { RawNode, FlatNode, CheckState, SearchResult } from './types';
import { createTree, type TreeOptions } from '@light-cat/treekit-svelte';

/**
 * Tree 管理器
 * 使用 high-tree-svelte 适配器
 *
 * 职责：
 * - 提供 Svelte 响应式状态
 * - 桥接 UI 和 TreeEngine
 */
export class TreeManager {
  // 使用适配器创建的状态存储
  private store: ReturnType<typeof createTree>;

  constructor(options?: TreeOptions) {
    this.store = createTree(undefined, options);
  }

  /**
   * 初始化数据
   */
  init(rawNodes: RawNode[]): void {
    this.store.init(rawNodes);
  }

  // ========== 状态转发 ==========

  get flatNodes(): FlatNode[] {
    return this.store.flatNodes;
  }

  get visibleList(): FlatNode[] {
    return this.store.visibleList;
  }

  get index() {
    return this.store.index;
  }

  get totalNodeCount(): number {
    return this.store.totalCount;
  }

  get visibleNodeCount(): number {
    return this.store.visibleCount;
  }

  get checkedCount(): number {
    return this.store.checkedCount;
  }

  // ========== 状态集 ==========

  get expandedSet(): ReadonlySet<string> {
    return this.store.expandedSet;
  }

  get checkedSet(): ReadonlySet<string> {
    return this.store.checkedSet;
  }

  get searchMatchSet(): ReadonlySet<string> {
    return this.store.matchSet;
  }

  get filterSet(): ReadonlySet<string> {
    return this.store.filterSet;
  }

  // ========== 展开/折叠 ==========

  toggleExpand(nodeId: string): void {
    const idx = this.store.getVisibleIndex(nodeId);
    if (idx >= 0) {
      this.store.toggle(idx);
    }
  }

  setExpanded(nodeId: string, value: boolean): void {
    const idx = this.store.getVisibleIndex(nodeId);
    if (idx >= 0) {
      this.store.setExpanded(idx, value);
    }
  }

  expandToDepth(depth: number): void {
    this.store.expandToDepth(depth);
  }

  setExpandedSet(newSet: Set<string>): void {
    this.store.setExpandedSet(newSet);
  }

  expandAll(): void {
    this.store.expandAll();
  }

  collapseAll(): void {
    this.store.collapseAll();
  }

  // ========== Checkbox ==========

  toggleCheck(nodeId: string): void {
    const idx = this.store.getVisibleIndex(nodeId);
    if (idx >= 0) {
      this.store.toggleCheck(idx);
    }
  }

  setChecked(nodeId: string, value: boolean): void {
    const idx = this.store.getVisibleIndex(nodeId);
    if (idx >= 0) {
      this.store.setChecked(idx, value);
    }
  }

  checkAll(): void {
    this.store.checkAll();
  }

  uncheckAll(): void {
    this.store.uncheckAll();
  }

  getCheckState(node: FlatNode): CheckState {
    const idx = this.store.getVisibleIndex(node.id);
    if (idx >= 0) {
      return this.store.getCheckState(idx);
    }
    return 'unchecked';
  }

  getCheckedLeafIds(): string[] {
    return this.store.getCheckedLeafIds();
  }

  // ========== 过滤/搜索 ==========

  applySearchResult(result: SearchResult): void {
    if (result.matchIds.size > 0) {
      this.store.setFilter(() => true); // 先显示所有匹配
      // 这里需要配合 SearchController 使用
    } else {
      this.store.clearFilter();
    }
  }

  clearSearch(): void {
    this.store.clearFilter();
  }

  isSearchMatch(nodeId: string): boolean {
    return this.store.isMatch(nodeId);
  }

  setFilter(predicate: (node: FlatNode) => boolean): void {
    this.store.setFilter(predicate);
  }

  setSearch(query: string): void {
    this.store.setSearch(query);
  }

  // ========== 查询 ==========

  getNode(nodeId: string): FlatNode | undefined {
    return this.store.getNode(nodeId);
  }

  getVisibleIndex(nodeId: string): number {
    return this.store.getVisibleIndex(nodeId);
  }

  // ========== 导航 ==========

  navigateNext(): number | null {
    return this.store.navigateNext();
  }

  navigatePrev(): number | null {
    return this.store.navigatePrev();
  }

  // ========== 销毁 ==========

  destroy(): void {
    this.store.destroy();
  }
}

/**
 * 创建 TreeManager 实例
 */
export function createTreeManager(options?: TreeOptions): TreeManager {
  return new TreeManager(options);
}
