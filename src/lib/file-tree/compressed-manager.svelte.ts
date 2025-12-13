import type { FileEvent, DisplayNode, FlatDisplayNode, DisplayTreeIndex } from './types';
import { SourceTreeStore } from './source-store';
import { buildDisplayTree } from './compress';
import { flattenDisplayNodes, computeVisibleDisplayNodes } from './flatten-display';

/**
 * 压缩文件树管理器
 * 整合源数据层 + 派生层 + 状态管理
 */
export class CompressedTreeManager {
  // ========== 源数据层 ==========
  private store = new SourceTreeStore();

  // ========== 派生层（非响应式） ==========
  private _displayNodes: DisplayNode[] = [];
  private _flatNodes: FlatDisplayNode[] = [];
  private _index: DisplayTreeIndex = {
    nodeMap: new Map(),
    indexMap: new Map(),
    childrenMap: new Map(),
    rootIds: []
  };

  // ========== sourceId → displayId 反向索引 ==========
  private sourceToDisplayMap = new Map<string, string>();

  // ========== 响应式状态（使用 Svelte 5 runes） ==========
  expandedSet = $state<Set<string>>(new Set());
  selectedId = $state<string | null>(null);

  // ========== 派生状态 ==========
  visibleList = $derived.by(() => {
    return computeVisibleDisplayNodes(this._flatNodes, this.expandedSet);
  });

  totalNodeCount = $derived.by(() => {
    return this._flatNodes.length;
  });

  visibleNodeCount = $derived.by(() => {
    return this.visibleList.length;
  });

  // ========== 只读访问器 ==========
  get flatNodes(): FlatDisplayNode[] {
    return this._flatNodes;
  }

  get index(): DisplayTreeIndex {
    return this._index;
  }

  get displayNodes(): DisplayNode[] {
    return this._displayNodes;
  }

  /**
   * 添加文件事件
   * 支持增量更新
   */
  addFile(event: FileEvent): void {
    // 1. 更新源数据
    this.store.addFile(event);

    // 2. 全量重建 DisplayNode 树（方案 A）
    this.rebuild();
  }

  /**
   * 批量添加文件事件
   */
  addFiles(events: FileEvent[]): void {
    for (const event of events) {
      this.store.addFile(event);
    }
    this.rebuild();
  }

  /**
   * 重建展示层
   */
  private rebuild(): void {
    // 1. 构建 DisplayNode 树
    this._displayNodes = buildDisplayTree(this.store);

    // 2. 构建反向索引
    this.sourceToDisplayMap.clear();
    for (const node of this._displayNodes) {
      for (const sourceId of node.sourceIds) {
        this.sourceToDisplayMap.set(sourceId, node.id);
      }
    }

    // 3. 扁平化
    const result = flattenDisplayNodes(this._displayNodes);
    this._flatNodes = result.flatNodes;
    this._index = result.index;

    // 4. 清理无效的展开状态
    const validIds = new Set(this._flatNodes.map((n) => n.id));
    const newExpanded = new Set<string>();
    for (const id of this.expandedSet) {
      if (validIds.has(id)) {
        newExpanded.add(id);
      }
    }
    this.expandedSet = newExpanded;
  }

  /**
   * 切换展开状态
   */
  toggleExpand(nodeId: string): void {
    const newSet = new Set(this.expandedSet);
    if (newSet.has(nodeId)) {
      newSet.delete(nodeId);
    } else {
      newSet.add(nodeId);
    }
    this.expandedSet = newSet;
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
   * 选中节点
   */
  selectNode(nodeId: string | null): void {
    this.selectedId = nodeId;
  }

  /**
   * 获取节点
   */
  getNode(nodeId: string): FlatDisplayNode | undefined {
    return this._index.nodeMap.get(nodeId);
  }

  /**
   * 通过 sourceId 获取 displayId
   */
  getDisplayIdBySourceId(sourceId: string): string | undefined {
    return this.sourceToDisplayMap.get(sourceId);
  }

  /**
   * 清空所有数据
   */
  clear(): void {
    this.store.clear();
    this._displayNodes = [];
    this._flatNodes = [];
    this._index = {
      nodeMap: new Map(),
      indexMap: new Map(),
      childrenMap: new Map(),
      rootIds: []
    };
    this.sourceToDisplayMap.clear();
    this.expandedSet = new Set();
    this.selectedId = null;
  }
}

/**
 * 创建 CompressedTreeManager 实例
 */
export function createCompressedTreeManager(): CompressedTreeManager {
  return new CompressedTreeManager();
}
