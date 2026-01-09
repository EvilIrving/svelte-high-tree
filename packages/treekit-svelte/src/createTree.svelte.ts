import { TreeEngine, type RawNode, type TreeOptions, type FlatNode, type NodeStatus, type TreeIndex, type CheckState } from '@light-cat/treekit-core';

/**
 * createTree - Svelte 状态适配器
 *
 * 将 TreeEngine 转换为 Svelte 响应式状态
 *
 * 特点：
 * - 分离大数据（非响应式）和小状态（响应式）
 * - 通过 subscribe 实现框架无关的订阅机制
 */
export function createTree(nodes?: RawNode[], options?: TreeOptions) {
  const engine = new TreeEngine(options);

  // 大数据：普通数组，不进入响应式系统
  let flatNodes: FlatNode[] = $state.raw([]);
  let totalCount = $state.raw(0);

  // 小状态：响应式
  let visibleList: FlatNode[] = $state.raw([]);
  let visibleCount = $state.raw(0);
  let checkedCount = $state.raw(0);
  let matchCount = $state.raw(0);
  let selectedId: string | null = $state.raw(null);
  // 响应式的状态集 - 必须同步引擎的变化
  let checkedSet: ReadonlySet<string> = $state.raw(new Set());
  let expandedSet: ReadonlySet<string> = $state.raw(new Set());
  let matchSet: ReadonlySet<string> = $state.raw(new Set());

  // 内部状态同步
  const syncState = () => {
    flatNodes = engine.flatNodes as FlatNode[];
    totalCount = engine.totalCount;
    visibleList = engine.visibleList as FlatNode[];
    visibleCount = engine.visibleCount;
    checkedCount = engine.checkedCount;
    matchCount = engine.matchCount;
    selectedId = engine.selectedId;
    // 同步状态集（关键：确保引用变化时触发响应式更新）
    checkedSet = engine.checkedSet;
    expandedSet = engine.expandedSet;
    matchSet = engine.matchSet;
  };

  // 订阅引擎变化
  const unsubscribe = engine.subscribe(() => {
    syncState();
  });

  // 初始化
  if (nodes && nodes.length > 0) {
    engine.init(nodes);
  }

  return {
    // 原始数据
    get flatNodes() { return flatNodes; },
    get visibleList() { return visibleList; },

    // 统计
    get totalCount() { return totalCount; },
    get visibleCount() { return visibleCount; },
    get checkedCount() { return checkedCount; },
    get matchCount() { return matchCount; },
    get selectedId() { return selectedId; },

    // 索引
    get index(): TreeIndex { return engine.index; },

    // 状态集（使用同步后的响应式状态）
    get expandedSet() { return expandedSet; },
    get checkedSet() { return checkedSet; },
    get matchSet() { return matchSet; },

    // 初始化
    init(rawNodes: RawNode[]) {
      engine.init(rawNodes);
    },

    setOptions(options: TreeOptions) {
      engine.setOptions(options);
    },

    // 节点操作（接受 visibleIndex）
    toggle(visibleIndex: number) {
      const node = engine.getNodeByVisibleIndex(visibleIndex);
      if (node) {
        const flatIndex = engine.index.indexMap.get(node.id);
        if (flatIndex != null) engine.toggle(flatIndex);
      }
    },

    setExpanded(visibleIndex: number, value: boolean) {
      const node = engine.getNodeByVisibleIndex(visibleIndex);
      if (node) {
        const flatIndex = engine.index.indexMap.get(node.id);
        if (flatIndex != null) engine.setExpanded(flatIndex, value);
      }
    },

    setChecked(visibleIndex: number, value: boolean) {
      const node = engine.getNodeByVisibleIndex(visibleIndex);
      if (node) {
        const flatIndex = engine.index.indexMap.get(node.id);
        if (flatIndex != null) engine.setChecked(flatIndex, value);
      }
    },

    toggleCheck(visibleIndex: number) {
      const node = engine.getNodeByVisibleIndex(visibleIndex);
      if (node) {
        const flatIndex = engine.index.indexMap.get(node.id);
        if (flatIndex != null) engine.toggleCheck(flatIndex);
      }
    },

    /** 直接通过 nodeId 切换勾选状态 */
    toggleCheckById(nodeId: string) {
      const flatIndex = engine.index.indexMap.get(nodeId);
      if (flatIndex != null) {
        engine.toggleCheck(flatIndex);
      }
    },

    // 批量操作
    expandAll() {
      engine.expandAll();
    },

    collapseAll() {
      engine.collapseAll();
    },

    expandToDepth(depth: number) {
      engine.expandToDepth(depth);
    },

    setExpandedSet(newSet: Set<string>) {
      engine.setExpandedSet(newSet);
    },

    checkAll() {
      engine.checkAll();
    },

    uncheckAll() {
      engine.uncheckAll();
    },

    // 过滤/搜索
    setFilter(predicate: ((node: FlatNode) => boolean) | null) {
      engine.setFilter(predicate);
    },

    setSearch(query: string) {
      engine.setSearch(query);
    },

    clearFilter() {
      engine.clearFilter();
    },

    /** 直接设置搜索匹配结果（用于异步搜索，如 Web Worker） */
    setMatchResult(matchIds: Set<string>, expandIds: Set<string>) {
      engine.setMatchResult(matchIds, expandIds);
    },

    isMatch(nodeId: string) {
      return engine.isMatch(nodeId);
    },

    // 导航
    navigateNext(fromVisibleIndex?: number): number | null {
      return engine.navigateNext(fromVisibleIndex);
    },

    navigatePrev(fromVisibleIndex?: number): number | null {
      return engine.navigatePrev(fromVisibleIndex);
    },

    // 查询
    getNode(nodeId: string) {
      return engine.getNode(nodeId);
    },

    getNodeStatus(nodeId: string): NodeStatus | null {
      return engine.getNodeStatus(nodeId);
    },

    getCheckState(visibleIndex: number): CheckState {
      const node = engine.getNodeByVisibleIndex(visibleIndex);
      if (!node) return 'unchecked';
      const flatIndex = engine.index.indexMap.get(node.id);
      if (flatIndex == null) return 'unchecked';
      return engine.getCheckState(flatIndex);
    },

    getCheckedLeafIds() {
      return engine.getCheckedLeafIds();
    },

    getVisibleIndex(nodeId: string): number {
      return engine.getVisibleIndex(nodeId);
    },

    // 选中操作（单选）
    select(nodeId: string | null) {
      engine.select(nodeId);
    },

    clearSelection() {
      engine.clearSelection();
    },

    // 展开到指定节点
    expandToNode(nodeId: string) {
      engine.expandToNode(nodeId);
    },

    // 销毁
    destroy() {
      unsubscribe();
    }
  };
}
