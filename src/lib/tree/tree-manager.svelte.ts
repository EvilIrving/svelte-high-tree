import type { RawNode, FlatNode, TreeIndex, CheckState, SearchResult } from './types';
import { buildFlatTree } from './flatten';
import { computeVisibleNodes, toggleExpand, expandMultiple } from './visibility';
import { toggleCheck, getCheckState, checkAll, uncheckAll, getCheckedLeafIds } from './checkbox';

/**
 * Tree 管理器
 * 分离大数据（非响应式）和小状态（响应式）
 *
 * 使用 Svelte 5 的 runes 进行状态管理
 */
export class TreeManager {
  // ========== 大数据：普通变量，不进入响应式系统 ==========
  private _flatNodes: FlatNode[] = [];
  private _index: TreeIndex = {
    nodeMap: new Map(),
    indexMap: new Map(),
    childrenMap: new Map(),
    rootIds: []
  };
  private _rawNodes: RawNode[] = [];

  // ========== 小状态：使用 $state ==========
  expandedSet = $state<Set<string>>(new Set());
  checkedSet = $state<Set<string>>(new Set());
  searchMatchSet = $state<Set<string>>(new Set());
  searchKeyword = $state('');
  isLoading = $state(false);

  // ========== 派生状态：使用 $derived ==========
  visibleList = $derived.by(() => {
    return computeVisibleNodes(this._flatNodes, this.expandedSet);
  });

  totalNodeCount = $derived.by(() => {
    return this._flatNodes.length;
  });

  visibleNodeCount = $derived.by(() => {
    return this.visibleList.length;
  });

  checkedCount = $derived.by(() => {
    return this.checkedSet.size;
  });

  // ========== 只读访问器 ==========
  get flatNodes(): FlatNode[] {
    return this._flatNodes;
  }

  get index(): TreeIndex {
    return this._index;
  }

  get rawNodes(): RawNode[] {
    return this._rawNodes;
  }

  /**
   * 初始化数据
   */
  init(rawNodes: RawNode[]): void {
    this.isLoading = true;

    try {
      this._rawNodes = rawNodes;
      const result = buildFlatTree(rawNodes);
      this._flatNodes = result.flatNodes;
      this._index = result.index;

      // 重置状态
      this.expandedSet = new Set();
      this.checkedSet = new Set();
      this.searchMatchSet = new Set();
      this.searchKeyword = '';
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * 切换展开
   */
  toggleExpand(nodeId: string): void {
    this.expandedSet = toggleExpand(nodeId, this.expandedSet);
  }

  /**
   * 展开到指定深度
   */
  expandToDepth(depth: number): void {
    const newSet = new Set<string>();
    for (const node of this._flatNodes) {
      if (node.hasChildren && node.depth < depth) {
        newSet.add(node.id);
      }
    }
    this.expandedSet = newSet;
  }

  /**
   * 全部展开
   */
  expandAll(): void {
    const newSet = new Set<string>();
    for (const node of this._flatNodes) {
      if (node.hasChildren) {
        newSet.add(node.id);
      }
    }
    this.expandedSet = newSet;
  }

  /**
   * 全部收起
   */
  collapseAll(): void {
    this.expandedSet = new Set();
  }

  /**
   * 切换勾选
   */
  toggleCheck(nodeId: string): void {
    this.checkedSet = toggleCheck(nodeId, this._flatNodes, this.checkedSet, this._index);
  }

  /**
   * 全选
   */
  checkAll(): void {
    this.checkedSet = checkAll(this._flatNodes);
  }

  /**
   * 全不选
   */
  uncheckAll(): void {
    this.checkedSet = uncheckAll();
  }

  /**
   * 获取节点的勾选状态
   */
  getCheckState(node: FlatNode): CheckState {
    return getCheckState(node, this._flatNodes, this.checkedSet);
  }

  /**
   * 获取所有已选中的叶子节点 ID
   */
  getCheckedLeafIds(): string[] {
    return getCheckedLeafIds(this._flatNodes, this.checkedSet);
  }

  /**
   * 应用搜索结果
   */
  applySearchResult(result: SearchResult): void {
    this.searchMatchSet = result.matchIds;

    if (result.matchIds.size > 0) {
      // 合并现有展开 + 搜索需要展开的
      this.expandedSet = expandMultiple(result.expandIds, this.expandedSet);
    }
  }

  /**
   * 清除搜索
   */
  clearSearch(): void {
    this.searchMatchSet = new Set();
    this.searchKeyword = '';
  }

  /**
   * 检查节点是否匹配搜索
   */
  isSearchMatch(nodeId: string): boolean {
    return this.searchMatchSet.has(nodeId);
  }

  /**
   * 获取节点
   */
  getNode(nodeId: string): FlatNode | undefined {
    return this._index.nodeMap.get(nodeId);
  }

  /**
   * 获取节点在可见列表中的索引
   */
  getVisibleIndex(nodeId: string): number {
    return this.visibleList.findIndex((n) => n.id === nodeId);
  }
}

/**
 * 创建 TreeManager 实例
 */
export function createTreeManager(): TreeManager {
  return new TreeManager();
}
