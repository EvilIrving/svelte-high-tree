import type { RawNode, NodeStatus, FieldMapper, CheckState } from '../types';
import { DEFAULT_FIELD_MAPPER } from '../types';
import type { TreeNode, TreeIndex, TreeOptions } from './types';
import { DEFAULT_TREE_OPTIONS } from './types';
import { buildFlatTree, getAncestorIDs } from '../algorithms/flatten';
import {
  computeVisibleNodes,
  computeFilteredVisibleNodes,
  toggleExpand,
  expandToNode,
  expandMultiple,
  collapseSiblings
} from '../algorithms/visibility';
import {
  toggleCheck,
  getCheckState,
  checkAll,
  uncheckAll,
  getCheckedLeafIDs,
  updateAncestorsCheckState
} from '../algorithms/checkbox';

/**
 * TreeEngine - 树形数据结构引擎
 *
 * 职责：
 * 1. 管理树形数据的扁平化表示
 * 2. 处理展开/折叠、勾选、过滤等状态变更
 * 3. 提供订阅机制通知外部状态变化
 *
 * 特点：
 * - 完全框架无关
 * - 使用可变数据结构（拒绝 immutable）
 * - 所有重算允许 O(n)
 */
export class TreeEngine {
  // ========== 大数据：普通变量 ==========
  #flatNodes: TreeNode[] = [];
  #index: TreeIndex = {
    nodeMap: new Map(),
    indexMap: new Map(),
    childrenMap: new Map(),
    rootIds: []
  };

  // ========== 状态管理 ==========
  #expandedSet = new Set<string>();
  #checkedSet = new Set<string>();
  #selectedId: string | null = null; // 当前选中的节点（单选）
  #filterSet = new Set<string>(); // 过滤显示集合（匹配节点 + 祖先）
  #matchSet = new Set<string>(); // 精确匹配的节点
  #options: Required<TreeOptions>;
  #fieldMapper: Required<FieldMapper>;

  // ========== 订阅系统 ==========
  #subscribers: Set<() => void> = new Set();

  // ========== 事务模式 ==========
  #batchMode = false;
  #pendingNotify = false;

  // ========== 可见性缓存 ==========
  #visibleList: TreeNode[] = [];
  #visibleIndexMap = new Map<string, number>(); // id → visibleIndex

  constructor(options?: TreeOptions) {
    this.#options = {
      checkable: options?.checkable ?? DEFAULT_TREE_OPTIONS.checkable,
      accordion: options?.accordion ?? DEFAULT_TREE_OPTIONS.accordion,
      filterable: options?.filterable ?? DEFAULT_TREE_OPTIONS.filterable,
      searchable: options?.searchable ?? DEFAULT_TREE_OPTIONS.searchable,
      defaultExpandedKeys: options?.defaultExpandedKeys ?? DEFAULT_TREE_OPTIONS.defaultExpandedKeys,
      defaultCheckedKeys: options?.defaultCheckedKeys ?? DEFAULT_TREE_OPTIONS.defaultCheckedKeys,
      checkStrictly: options?.checkStrictly ?? DEFAULT_TREE_OPTIONS.checkStrictly,
      defaultSelectedKeys: options?.defaultSelectedKeys ?? DEFAULT_TREE_OPTIONS.defaultSelectedKeys,
      fieldMapper: options?.fieldMapper ?? DEFAULT_TREE_OPTIONS.fieldMapper
    };
    const mapper = options?.fieldMapper ?? {};
    this.#fieldMapper = {
      id: mapper.id ?? DEFAULT_FIELD_MAPPER.id,
      parentId: mapper.parentId ?? DEFAULT_FIELD_MAPPER.parentId,
      name: mapper.name ?? DEFAULT_FIELD_MAPPER.name,
      children: mapper.children ?? DEFAULT_FIELD_MAPPER.children
    };
  }

  // ========== 公共只读属性 ==========

  get flatNodes(): readonly TreeNode[] {
    return this.#flatNodes;
  }

  get index(): TreeIndex {
    return this.#index;
  }

  get visibleList(): readonly TreeNode[] {
    return this.#visibleList;
  }

  get totalCount(): number {
    return this.#flatNodes.length;
  }

  get visibleCount(): number {
    return this.#visibleList.length;
  }

  get checkedCount(): number {
    return this.#checkedSet.size;
  }

  get expandedSet(): ReadonlySet<string> {
    return this.#expandedSet;
  }

  get checkedSet(): ReadonlySet<string> {
    return this.#checkedSet;
  }

  get matchSet(): ReadonlySet<string> {
    return this.#matchSet;
  }

  get filterSet(): ReadonlySet<string> {
    return this.#filterSet;
  }

  get isAccordionMode(): boolean {
    return this.#options.accordion;
  }

  get isCheckStrictly(): boolean {
    return this.#options.checkStrictly;
  }

  /** 当前选中的节点 ID（单选） */
  get selectedId(): string | null {
    return this.#selectedId;
  }

  // ========== 初始化 ==========

  /**
   * 初始化树数据
   * @param rawNodes 原始节点数据
   * @param fieldMapper 字段映射配置（可选，使用构造函数中的配置）
   */
  init(rawNodes: RawNode[], fieldMapper?: FieldMapper): void {
    const mapper = fieldMapper ?? this.#fieldMapper;
    const result = buildFlatTree(rawNodes, mapper);
    this.#flatNodes = result.flatNodes;
    this.#index = result.index;

    // 重置状态
    this.#expandedSet = new Set(this.#options.defaultExpandedKeys);
    this.#checkedSet = new Set(this.#options.defaultCheckedKeys);
    this.#selectedId = this.#options.defaultSelectedKeys[0] ?? null;
    this.#filterSet = new Set();
    this.#matchSet = new Set();

    // 计算可见性
    this.#recomputeVisibility();
    this.#notify();
  }

  /**
   * 更新配置
   */
  setOptions(options: Partial<TreeOptions>): void {
    this.#options = { ...this.#options, ...options };
    this.#notify();
  }

  // ========== 订阅机制 ==========

  /**
   * 订阅状态变化
   * @returns 取消订阅函数
   */
  subscribe(fn: () => void): () => void {
    this.#subscribers.add(fn);
    return () => this.#subscribers.delete(fn);
  }

  /**
   * 开启事务模式
   * 在事务模式下，多次状态变更会合并为一次通知
   */
  startBatch(): void {
    this.#batchMode = true;
  }

  /**
   * 提交事务
   * 合并所有pending的状态变更并通知订阅者
   */
  commit(): void {
    if (!this.#batchMode) return;
    this.#batchMode = false;
    if (this.#pendingNotify) {
      this.#pendingNotify = false;
      this.#recomputeVisibility();
      this.#notifySubscribers();
    }
  }

  /**
   * 在事务中执行操作
   * @example
   * engine.batch(() => {
   *   engine.expandAll();
   *   engine.checkAll();
   * });
   */
  batch(fn: () => void): void {
    this.startBatch();
    try {
      fn();
    } finally {
      this.commit();
    }
  }

  #notify(): void {
    if (this.#batchMode) {
      this.#pendingNotify = true;
    } else {
      this.#recomputeVisibility();
      this.#notifySubscribers();
    }
  }

  #notifySubscribers(): void {
    for (const fn of this.#subscribers) {
      fn();
    }
  }

  // ========== 可见性计算 ==========

  #recomputeVisibility(): void {
    if (this.#filterSet.size > 0) {
      this.#visibleList = computeFilteredVisibleNodes(
        this.#flatNodes,
        this.#expandedSet,
        this.#filterSet
      );
    } else {
      this.#visibleList = computeVisibleNodes(this.#flatNodes, this.#expandedSet);
    }

    // 重建 visibleIndexMap
    this.#visibleIndexMap.clear();
    for (let i = 0; i < this.#visibleList.length; i++) {
      this.#visibleIndexMap.set(this.#visibleList[i].id, i);
    }
  }

  // ========== 节点查询 ==========

  /**
   * 根据 id 获取节点
   */
  getNode(nodeId: string): TreeNode | undefined {
    return this.#index.nodeMap.get(nodeId);
  }

  /**
   * 根据 visibleIndex 获取节点
   */
  getNodeByVisibleIndex(visibleIndex: number): TreeNode | undefined {
    return this.#visibleList[visibleIndex];
  }

  /**
   * 根据 visibleIndex 获取对应的 flatIndex（用于引擎操作）
   * @returns flatIndex，如果找不到返回 -1
   */
  getFlatIndexByVisibleIndex(visibleIndex: number): number {
    const node = this.#visibleList[visibleIndex];
    if (!node) return -1;
    return this.#index.indexMap.get(node.id) ?? -1;
  }

  /**
   * 获取节点在可见列表中的索引
   */
  getVisibleIndex(nodeId: string): number | -1 {
    return this.#visibleIndexMap.get(nodeId) ?? -1;
  }

  /**
   * 获取节点状态（供 UI 渲染使用）
   */
  getNodeStatus(nodeId: string): NodeStatus | null {
    const node = this.#index.nodeMap.get(nodeId);
    if (!node) return null;

    const visibleIndex = this.#visibleIndexMap.get(nodeId) ?? -1;

    // checkStrictly 模式下无半选状态
    let isIndeterminate = false;
    if (this.#options.checkable && !this.#options.checkStrictly) {
      isIndeterminate = getCheckState(node, this.#flatNodes, this.#checkedSet) === 'indeterminate';
    }

    return {
      isExpanded: this.#expandedSet.has(nodeId),
      isChecked: this.#checkedSet.has(nodeId),
      isIndeterminate,
      isVisible: visibleIndex >= 0,
      visibleIndex
    };
  }

  // ========== 展开/折叠操作 ==========

  /**
   * 切换节点展开状态
   */
  toggle(index: number): void {
    const node = this.#flatNodes[index];
    if (!node || !node.hasChildren) return;

    // 手风琴模式：收起同级其他节点
    if (this.#options.accordion && !this.#expandedSet.has(node.id)) {
      this.#expandedSet = collapseSiblings(node.id, this.#flatNodes, this.#expandedSet, this.#index.nodeMap);
    }

    this.#expandedSet = toggleExpand(node.id, this.#expandedSet);
    this.#recomputeVisibility();
    this.#notify();
  }

  /**
   * 设置节点展开状态
   */
  setExpanded(index: number, value: boolean): void {
    const node = this.#flatNodes[index];
    if (!node || !node.hasChildren) return;

    // 手风琴模式：收起同级其他节点
    if (value && this.#options.accordion) {
      this.#expandedSet = collapseSiblings(node.id, this.#flatNodes, this.#expandedSet, this.#index.nodeMap);
    }

    if (value) {
      this.#expandedSet.add(node.id);
    } else {
      this.#expandedSet.delete(node.id);
    }

    this.#recomputeVisibility();
    this.#notify();
  }

  /**
   * 展开到指定节点（展开所有祖先）
   */
  expandToNode(nodeId: string): void {
    this.#expandedSet = expandToNode(nodeId, this.#expandedSet, this.#index.nodeMap);
    this.#recomputeVisibility();
    this.#notify();
  }

  /**
   * 展开所有节点
   */
  expandAll(): void {
    const newSet = new Set<string>();
    for (const node of this.#flatNodes) {
      if (node.hasChildren) {
        newSet.add(node.id);
      }
    }
    this.#expandedSet = newSet;
    this.#recomputeVisibility();
    this.#notify();
  }

  /**
   * 折叠所有节点
   */
  collapseAll(): void {
    this.#expandedSet = new Set();
    this.#recomputeVisibility();
    this.#notify();
  }

  /**
   * 展开到指定深度
   */
  expandToDepth(depth: number): void {
    const newSet = new Set<string>();
    for (const node of this.#flatNodes) {
      if (node.hasChildren && node.depth < depth) {
        newSet.add(node.id);
      }
    }
    this.#expandedSet = newSet;
    this.#recomputeVisibility();
    this.#notify();
  }

  /**
   * 直接设置展开集合（用于搜索结果定位等场景）
   */
  setExpandedSet(newSet: Set<string>): void {
    this.#expandedSet = newSet;
    this.#recomputeVisibility();
    this.#notify();
  }

  // ========== Checkbox 操作 ==========

  /**
   * 设置节点勾选状态
   */
  setChecked(index: number, value: boolean): void {
    const node = this.#flatNodes[index];
    if (!node) return;

    if (this.#options.checkStrictly) {
      // 严格模式：只影响当前节点，不联动父子
      if (value) {
        this.#checkedSet.add(node.id);
      } else {
        this.#checkedSet.delete(node.id);
      }
    } else {
      // 非严格模式：父子联动
      if (value) {
        // 批量选中子树
        const start = node.index;
        const end = node.subtreeEnd;
        for (let i = start; i <= end; i++) {
          this.#checkedSet.add(this.#flatNodes[i].id);
        }
        // 更新祖先
        this.#updateAncestorsCheckState(node.parentId);
      } else {
        // 批量取消子树
        const start = node.index;
        const end = node.subtreeEnd;
        for (let i = start; i <= end; i++) {
          this.#checkedSet.delete(this.#flatNodes[i].id);
        }
        // 更新祖先
        this.#updateAncestorsCheckState(node.parentId);
      }
    }

    this.#notify();
  }

  /**
   * 切换节点勾选状态
   */
  toggleCheck(index: number): void {
    const node = this.#flatNodes[index];
    if (!node) return;

    if (this.#options.checkStrictly) {
      // 严格模式：只切换当前节点，不联动父子
      if (this.#checkedSet.has(node.id)) {
        this.#checkedSet.delete(node.id);
      } else {
        this.#checkedSet.add(node.id);
      }
    } else {
      // 非严格模式：使用父子联动算法
      this.#checkedSet = toggleCheck(node.id, this.#flatNodes, this.#checkedSet, this.#index);
    }
    this.#notify();
  }

  /**
   * 全选
   */
  checkAll(): void {
    this.#checkedSet = checkAll(this.#flatNodes);
    this.#notify();
  }

  /**
   * 全不选
   */
  uncheckAll(): void {
    this.#checkedSet = uncheckAll();
    this.#notify();
  }

  /**
   * 获取所有已选中的叶子节点 ID
   */
  getCheckedLeafIDs(): string[] {
    return getCheckedLeafIDs(this.#flatNodes, this.#checkedSet);
  }

  /**
   * 获取节点的勾选状态
   */
  getCheckState(index: number): CheckState {
    const node = this.#flatNodes[index];
    if (!node) return 'unchecked';

    if (this.#options.checkStrictly) {
      // 严格模式：只看自身是否在 checkedSet 中，无半选
      return this.#checkedSet.has(node.id) ? 'checked' : 'unchecked';
    }
    return getCheckState(node, this.#flatNodes, this.#checkedSet);
  }

  /**
   * 根据节点 ID 获取勾选状态（供 UI 层使用）
   */
  getCheckStateByNodeId(nodeId: string): CheckState {
    const node = this.getNode(nodeId);
    if (!node) return 'unchecked';
    return this.getCheckState(node.index);
  }

  #updateAncestorsCheckState(parentId: string | null): void {
    updateAncestorsCheckState(parentId, this.#flatNodes, this.#checkedSet, this.#index);
  }

  // ========== 过滤/搜索操作 ==========

  /**
   * 设置过滤函数
   * @param predicate 返回 true 表示节点应显示
   */
  setFilter(predicate: ((node: TreeNode) => boolean) | null): void {
    if (!this.#options.filterable || !predicate) {
      this.#filterSet = new Set();
      this.#matchSet = new Set();
      this.#recomputeVisibility();
      this.#notify();
      return;
    }

    // 过滤逻辑：匹配节点 + 所有祖先节点
    const matchIds = new Set<string>();
    const filterIds = new Set<string>();

    for (const node of this.#flatNodes) {
      if (predicate(node)) {
        matchIds.add(node.id);
        // 使用公共函数收集祖先
        const ancestors = getAncestorIDs(node.id, this.#index);
        for (const ancestorId of ancestors) {
          filterIds.add(ancestorId);
        }
      }
    }

    // filterIds = matchIds + ancestors, matchIds = only matches
    this.#filterSet = new Set([...filterIds, ...matchIds]);
    this.#matchSet = matchIds;

    // 自动展开所有匹配路径
    this.#expandedSet = expandMultiple(filterIds, this.#expandedSet);
    this.#recomputeVisibility();
    this.#notify();
  }

  /**
   * 设置搜索关键词（使用内置过滤）
   */
  setSearch(query: string): void {
    if (!query.trim()) {
      this.setFilter(null);
      return;
    }

    const lowerQuery = query.toLowerCase();
    this.setFilter((node) => node.name.toLowerCase().includes(lowerQuery));
  }

  /**
   * 检查节点是否匹配搜索/过滤
   */
  isMatch(nodeId: string): boolean {
    return this.#matchSet.has(nodeId);
  }

  /**
   * 清除过滤/搜索
   */
  clearFilter(): void {
    this.setFilter(null);
  }

  /**
   * 直接设置搜索匹配结果（用于异步搜索，如 Web Worker）
   * @param matchIds 匹配的节点 ID 集合
   * @param expandIds 需要展开的祖先节点 ID 集合
   */
  setMatchResult(matchIds: Set<string>, expandIds: Set<string>): void {
    if (matchIds.size === 0) {
      this.#filterSet = new Set();
      this.#matchSet = new Set();
      this.#recomputeVisibility();
      this.#notify();
      return;
    }

    // filterSet = matchIds + expandIds（祖先）
    this.#filterSet = new Set([...matchIds, ...expandIds]);
    this.#matchSet = matchIds;

    // 自动展开所有匹配路径
    this.#expandedSet = expandMultiple(expandIds, this.#expandedSet);
    this.#recomputeVisibility();
    this.#notify();
  }

  // ========== 导航操作 ==========

  /**
   * 获取下一个匹配节点的位置
   */
  navigateNext(fromVisibleIndex?: number): number | null {
    if (this.#matchSet.size === 0) return null;

    const start = fromVisibleIndex ?? -1;
    for (let i = start + 1; i < this.#visibleList.length; i++) {
      if (this.#matchSet.has(this.#visibleList[i].id)) {
        return i;
      }
    }
    return null;
  }

  /**
   * 获取上一个匹配节点的位置
   */
  navigatePrev(fromVisibleIndex?: number): number | null {
    if (this.#matchSet.size === 0) return null;

    const start = fromVisibleIndex ?? this.#visibleList.length;
    for (let i = start - 1; i >= 0; i--) {
      if (this.#matchSet.has(this.#visibleList[i].id)) {
        return i;
      }
    }
    return null;
  }

  /**
   * 获取匹配节点的总数
   */
  get matchCount(): number {
    return this.#matchSet.size;
  }

  // ========== 选中操作（单选） ==========

  /**
   * 选中指定节点（单选）
   */
  select(nodeId: string | null): void {
    if (nodeId !== null && !this.#index.nodeMap.has(nodeId)) {
      return;
    }
    this.#selectedId = nodeId;
    this.#notify();
  }

  /**
   * 清除选中
   */
  clearSelection(): void {
    if (this.#selectedId !== null) {
      this.#selectedId = null;
      this.#notify();
    }
  }
}
