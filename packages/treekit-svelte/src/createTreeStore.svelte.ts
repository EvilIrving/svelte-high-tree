import { TreeEngine, type RawNode, type TreeOptions, type FlatNode, type NodeStatus, type TreeIndex } from '@light-cat/treekit-core';

/**
 * Svelte 适配器 - 将 TreeEngine 转换为 Svelte 响应式状态
 *
 * 特点：
 * - 分离大数据（非响应式）和小状态（响应式）
 * - 通过 subscribe 实现框架无关的订阅机制
 */
export function createTreeStore(nodes?: RawNode[], options?: TreeOptions) {
  const engine = new TreeEngine(options);

  // 大数据：普通数组，不进入响应式系统
  let flatNodes: FlatNode[] = $state.raw([]);
  let totalCount = $state.raw(0);

  // 小状态：响应式
  let visibleList: FlatNode[] = $state.raw([]);
  let visibleCount = $state.raw(0);
  let checkedCount = $state.raw(0);
  let matchCount = $state.raw(0);

  // 内部状态同步
  const syncState = () => {
    flatNodes = engine.flatNodes as FlatNode[];
    totalCount = engine.totalCount;
    visibleList = engine.visibleList as FlatNode[];
    visibleCount = engine.visibleCount;
    checkedCount = engine.checkedCount;
    matchCount = engine.matchCount;
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

    // 索引
    get index(): TreeIndex { return engine.index; },

    // 状态集
    get expandedSet() { return engine.expandedSet; },
    get checkedSet() { return engine.checkedSet; },
    get matchSet() { return engine.matchSet; },
    get filterSet() { return engine.filterSet; },

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
        const idx = engine.flatNodes.findIndex((n: FlatNode) => n.id === node.id);
        if (idx >= 0) engine.toggle(idx);
      }
    },

    setExpanded(visibleIndex: number, value: boolean) {
      const node = engine.getNodeByVisibleIndex(visibleIndex);
      if (node) {
        const idx = engine.flatNodes.findIndex((n: FlatNode) => n.id === node.id);
        if (idx >= 0) engine.setExpanded(idx, value);
      }
    },

    setChecked(visibleIndex: number, value: boolean) {
      const node = engine.getNodeByVisibleIndex(visibleIndex);
      if (node) {
        const idx = engine.flatNodes.findIndex((n: FlatNode) => n.id === node.id);
        if (idx >= 0) engine.setChecked(idx, value);
      }
    },

    toggleCheck(visibleIndex: number) {
      const node = engine.getNodeByVisibleIndex(visibleIndex);
      if (node) {
        const idx = engine.flatNodes.findIndex((n: FlatNode) => n.id === node.id);
        if (idx >= 0) engine.toggleCheck(idx);
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

    getCheckState(visibleIndex: number): 'checked' | 'unchecked' | 'indeterminate' {
      const node = engine.getNodeByVisibleIndex(visibleIndex);
      if (!node) return 'unchecked';
      const idx = engine.flatNodes.findIndex((n: FlatNode) => n.id === node.id);
      return engine.getCheckState(idx);
    },

    getCheckedLeafIds() {
      return engine.getCheckedLeafIds();
    },

    getVisibleIndex(nodeId: string): number {
      return engine.getVisibleIndex(nodeId);
    },

    // 销毁
    destroy() {
      unsubscribe();
    }
  };
}
