import type { RawNode, FlatNode, TreeIndex, TreeOptions, NodeStatus, FieldMapper, CheckState } from './types';
import { defaultTreeOptions, defaultFieldMapper } from './types';
import { buildFlatTree } from './algorithms/flatten';
import {
  computeVisibleNodes,
  computeFilteredVisibleNodes,
  toggleExpand,
  expandToNode,
  expandMultiple,
  collapseSiblings
} from './algorithms/visibility';
import { getAncestorIds } from './algorithms/flatten';
import {
  toggleCheck,
  getCheckState,
  checkAll,
  uncheckAll,
  getCheckedLeafIds,
  updateAncestorsCheckState
} from './algorithms/checkbox';

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
  private _flatNodes: FlatNode[] = [];
  private _index: TreeIndex = {
    nodeMap: new Map(),
    indexMap: new Map(),
    childrenMap: new Map(),
    rootIds: []
  };

  // ========== 状态管理 ==========
  private _expandedSet = new Set<string>();
  private _checkedSet = new Set<string>();
  private _selectedId: string | null = null; // 当前选中的节点（单选）
  private _filterSet = new Set<string>(); // 过滤显示集合（匹配节点 + 祖先）
  private _matchSet = new Set<string>(); // 精确匹配的节点
  private _options: Required<TreeOptions>;
  private _fieldMapper: Required<FieldMapper>;

  // ========== 订阅系统 ==========
  private _subscribers: Set<() => void> = new Set();

  // ========== 事务模式 ==========
  private _batchMode = false;
  private _pendingNotify = false;

  // ========== 可见性缓存 ==========
  private _visibleList: FlatNode[] = [];
  private _visibleIndexMap = new Map<string, number>(); // id → visibleIndex

  constructor(options?: TreeOptions) {
    this._options = {
      checkable: options?.checkable ?? defaultTreeOptions.checkable,
      accordion: options?.accordion ?? defaultTreeOptions.accordion,
      filterable: options?.filterable ?? defaultTreeOptions.filterable,
      searchable: options?.searchable ?? defaultTreeOptions.searchable,
      defaultExpandedIds: options?.defaultExpandedIds ?? defaultTreeOptions.defaultExpandedIds,
      defaultCheckedIds: options?.defaultCheckedIds ?? defaultTreeOptions.defaultCheckedIds,
      checkStrictly: options?.checkStrictly ?? defaultTreeOptions.checkStrictly,
      defaultSelectedIds: options?.defaultSelectedIds ?? defaultTreeOptions.defaultSelectedIds,
      fieldMapper: options?.fieldMapper ?? defaultTreeOptions.fieldMapper
    };
    const mapper = options?.fieldMapper ?? {};
    this._fieldMapper = {
      id: mapper.id ?? defaultFieldMapper.id,
      parentId: mapper.parentId ?? defaultFieldMapper.parentId,
      name: mapper.name ?? defaultFieldMapper.name,
      children: mapper.children ?? defaultFieldMapper.children
    };
  }

  // ========== 公共只读属性 ==========

  get flatNodes(): readonly FlatNode[] {
    return this._flatNodes;
  }

  get index(): TreeIndex {
    return this._index;
  }

  get visibleList(): readonly FlatNode[] {
    return this._visibleList;
  }

  get totalCount(): number {
    return this._flatNodes.length;
  }

  get visibleCount(): number {
    return this._visibleList.length;
  }

  get checkedCount(): number {
    return this._checkedSet.size;
  }

  get expandedSet(): ReadonlySet<string> {
    return this._expandedSet;
  }

  get checkedSet(): ReadonlySet<string> {
    return this._checkedSet;
  }

  get matchSet(): ReadonlySet<string> {
    return this._matchSet;
  }

  get filterSet(): ReadonlySet<string> {
    return this._filterSet;
  }

  get isAccordionMode(): boolean {
    return this._options.accordion;
  }

  get isCheckStrictly(): boolean {
    return this._options.checkStrictly;
  }

  /** 当前选中的节点 ID（单选） */
  get selectedId(): string | null {
    return this._selectedId;
  }

  // ========== 初始化 ==========

  /**
   * 初始化树数据
   * @param rawNodes 原始节点数据
   * @param fieldMapper 字段映射配置（可选，使用构造函数中的配置）
   */
  init(rawNodes: RawNode[], fieldMapper?: FieldMapper): void {
    const mapper = fieldMapper ?? this._fieldMapper;
    const result = buildFlatTree(rawNodes, mapper);
    this._flatNodes = result.flatNodes;
    this._index = result.index;

    // 重置状态
    this._expandedSet = new Set(this._options.defaultExpandedIds);
    this._checkedSet = new Set(this._options.defaultCheckedIds);
    this._selectedId = this._options.defaultSelectedIds[0] ?? null;
    this._filterSet = new Set();
    this._matchSet = new Set();

    // 计算可见性
    this._recomputeVisibility();
    this._notify();
  }

  /**
   * 更新配置
   */
  setOptions(options: Partial<TreeOptions>): void {
    this._options = { ...this._options, ...options };
    this._notify();
  }

  // ========== 订阅机制 ==========

  /**
   * 订阅状态变化
   * @returns 取消订阅函数
   */
  subscribe(fn: () => void): () => void {
    this._subscribers.add(fn);
    return () => this._subscribers.delete(fn);
  }

  /**
   * 开启事务模式
   * 在事务模式下，多次状态变更会合并为一次通知
   */
  startBatch(): void {
    this._batchMode = true;
  }

  /**
   * 提交事务
   * 合并所有pending的状态变更并通知订阅者
   */
  commit(): void {
    if (!this._batchMode) return;
    this._batchMode = false;
    if (this._pendingNotify) {
      this._pendingNotify = false;
      this._recomputeVisibility();
      this._notifySubscribers();
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

  private _notify(): void {
    if (this._batchMode) {
      this._pendingNotify = true;
    } else {
      this._recomputeVisibility();
      this._notifySubscribers();
    }
  }

  private _notifySubscribers(): void {
    for (const fn of this._subscribers) {
      fn();
    }
  }

  // ========== 可见性计算 ==========

  private _recomputeVisibility(): void {
    if (this._filterSet.size > 0) {
      this._visibleList = computeFilteredVisibleNodes(
        this._flatNodes,
        this._expandedSet,
        this._filterSet
      );
    } else {
      this._visibleList = computeVisibleNodes(this._flatNodes, this._expandedSet);
    }

    // 重建 visibleIndexMap
    this._visibleIndexMap.clear();
    for (let i = 0; i < this._visibleList.length; i++) {
      this._visibleIndexMap.set(this._visibleList[i].id, i);
    }
  }

  // ========== 节点查询 ==========

  /**
   * 根据 id 获取节点
   */
  getNode(nodeId: string): FlatNode | undefined {
    return this._index.nodeMap.get(nodeId);
  }

  /**
   * 根据 visibleIndex 获取节点
   */
  getNodeByVisibleIndex(visibleIndex: number): FlatNode | undefined {
    return this._visibleList[visibleIndex];
  }

  /**
   * 根据 visibleIndex 获取对应的 flatIndex（用于引擎操作）
   * @returns flatIndex，如果找不到返回 -1
   */
  getFlatIndexByVisibleIndex(visibleIndex: number): number {
    const node = this._visibleList[visibleIndex];
    if (!node) return -1;
    return this._index.indexMap.get(node.id) ?? -1;
  }

  /**
   * 获取节点在可见列表中的索引
   */
  getVisibleIndex(nodeId: string): number | -1 {
    return this._visibleIndexMap.get(nodeId) ?? -1;
  }

  /**
   * 获取节点状态（供 UI 渲染使用）
   */
  getNodeStatus(nodeId: string): NodeStatus | null {
    const node = this._index.nodeMap.get(nodeId);
    if (!node) return null;

    const visibleIndex = this._visibleIndexMap.get(nodeId) ?? -1;

    // checkStrictly 模式下无半选状态
    let isIndeterminate = false;
    if (this._options.checkable && !this._options.checkStrictly) {
      isIndeterminate = getCheckState(node, this._flatNodes, this._checkedSet) === 'indeterminate';
    }

    return {
      isExpanded: this._expandedSet.has(nodeId),
      isChecked: this._checkedSet.has(nodeId),
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
    const node = this._flatNodes[index];
    if (!node || !node.hasChildren) return;

    // 手风琴模式：收起同级其他节点
    if (this._options.accordion && !this._expandedSet.has(node.id)) {
      this._expandedSet = collapseSiblings(node.id, this._flatNodes, this._expandedSet, this._index.nodeMap);
    }

    this._expandedSet = toggleExpand(node.id, this._expandedSet);
    this._recomputeVisibility();
    this._notify();
  }

  /**
   * 设置节点展开状态
   */
  setExpanded(index: number, value: boolean): void {
    const node = this._flatNodes[index];
    if (!node || !node.hasChildren) return;

    // 手风琴模式：收起同级其他节点
    if (value && this._options.accordion) {
      this._expandedSet = collapseSiblings(node.id, this._flatNodes, this._expandedSet, this._index.nodeMap);
    }

    if (value) {
      this._expandedSet.add(node.id);
    } else {
      this._expandedSet.delete(node.id);
    }

    this._recomputeVisibility();
    this._notify();
  }

  /**
   * 展开到指定节点（展开所有祖先）
   */
  expandToNode(nodeId: string): void {
    this._expandedSet = expandToNode(nodeId, this._expandedSet, this._index.nodeMap);
    this._recomputeVisibility();
    this._notify();
  }

  /**
   * 展开所有节点
   */
  expandAll(): void {
    const newSet = new Set<string>();
    for (const node of this._flatNodes) {
      if (node.hasChildren) {
        newSet.add(node.id);
      }
    }
    this._expandedSet = newSet;
    this._recomputeVisibility();
    this._notify();
  }

  /**
   * 折叠所有节点
   */
  collapseAll(): void {
    this._expandedSet = new Set();
    this._recomputeVisibility();
    this._notify();
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
    this._expandedSet = newSet;
    this._recomputeVisibility();
    this._notify();
  }

  /**
   * 直接设置展开集合（用于搜索结果定位等场景）
   */
  setExpandedSet(newSet: Set<string>): void {
    this._expandedSet = newSet;
    this._recomputeVisibility();
    this._notify();
  }

  // ========== Checkbox 操作 ==========

  /**
   * 设置节点勾选状态
   */
  setChecked(index: number, value: boolean): void {
    const node = this._flatNodes[index];
    if (!node) return;

    if (this._options.checkStrictly) {
      // 严格模式：只影响当前节点，不联动父子
      if (value) {
        this._checkedSet.add(node.id);
      } else {
        this._checkedSet.delete(node.id);
      }
    } else {
      // 非严格模式：父子联动
      if (value) {
        // 批量选中子树
        const start = node.index;
        const end = node.subtreeEnd;
        for (let i = start; i <= end; i++) {
          this._checkedSet.add(this._flatNodes[i].id);
        }
        // 更新祖先
        this._updateAncestorsCheckState(node.parentId);
      } else {
        // 批量取消子树
        const start = node.index;
        const end = node.subtreeEnd;
        for (let i = start; i <= end; i++) {
          this._checkedSet.delete(this._flatNodes[i].id);
        }
        // 更新祖先
        this._updateAncestorsCheckState(node.parentId);
      }
    }

    this._notify();
  }

  /**
   * 切换节点勾选状态
   */
  toggleCheck(index: number): void {
    const node = this._flatNodes[index];
    if (!node) return;

    if (this._options.checkStrictly) {
      // 严格模式：只切换当前节点，不联动父子
      if (this._checkedSet.has(node.id)) {
        this._checkedSet.delete(node.id);
      } else {
        this._checkedSet.add(node.id);
      }
    } else {
      // 非严格模式：使用父子联动算法
      this._checkedSet = toggleCheck(node.id, this._flatNodes, this._checkedSet, this._index);
    }
    this._notify();
  }

  /**
   * 全选
   */
  checkAll(): void {
    this._checkedSet = checkAll(this._flatNodes);
    this._notify();
  }

  /**
   * 全不选
   */
  uncheckAll(): void {
    this._checkedSet = uncheckAll();
    this._notify();
  }

  /**
   * 获取所有已选中的叶子节点 ID
   */
  getCheckedLeafIds(): string[] {
    return getCheckedLeafIds(this._flatNodes, this._checkedSet);
  }

  /**
   * 获取节点的勾选状态
   */
  getCheckState(index: number): CheckState {
    const node = this._flatNodes[index];
    if (!node) return 'unchecked';

    if (this._options.checkStrictly) {
      // 严格模式：只看自身是否在 checkedSet 中，无半选
      return this._checkedSet.has(node.id) ? 'checked' : 'unchecked';
    }
    return getCheckState(node, this._flatNodes, this._checkedSet);
  }

  /**
   * 根据节点 ID 获取勾选状态（供 UI 层使用）
   */
  getCheckStateByNodeId(nodeId: string): CheckState {
    const node = this.getNode(nodeId);
    if (!node) return 'unchecked';
    return this.getCheckState(node.index);
  }

  private _updateAncestorsCheckState(parentId: string | null): void {
    updateAncestorsCheckState(parentId, this._flatNodes, this._checkedSet, this._index);
  }

  // ========== 过滤/搜索操作 ==========

  /**
   * 设置过滤函数
   * @param predicate 返回 true 表示节点应显示
   */
  setFilter(predicate: ((node: FlatNode) => boolean) | null): void {
    if (!this._options.filterable || !predicate) {
      this._filterSet = new Set();
      this._matchSet = new Set();
      this._recomputeVisibility();
      this._notify();
      return;
    }

    // 过滤逻辑：匹配节点 + 所有祖先节点
    const matchIds = new Set<string>();
    const filterIds = new Set<string>();

    for (const node of this._flatNodes) {
      if (predicate(node)) {
        matchIds.add(node.id);
        // 使用公共函数收集祖先
        const ancestors = getAncestorIds(node.id, this._index);
        for (const ancestorId of ancestors) {
          filterIds.add(ancestorId);
        }
      }
    }

    // filterIds = matchIds + ancestors, matchIds = only matches
    this._filterSet = new Set([...filterIds, ...matchIds]);
    this._matchSet = matchIds;

    // 自动展开所有匹配路径
    this._expandedSet = expandMultiple(filterIds, this._expandedSet);
    this._recomputeVisibility();
    this._notify();
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
    return this._matchSet.has(nodeId);
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
      this._filterSet = new Set();
      this._matchSet = new Set();
      this._recomputeVisibility();
      this._notify();
      return;
    }

    // filterSet = matchIds + expandIds（祖先）
    this._filterSet = new Set([...matchIds, ...expandIds]);
    this._matchSet = matchIds;

    // 自动展开所有匹配路径
    this._expandedSet = expandMultiple(expandIds, this._expandedSet);
    this._recomputeVisibility();
    this._notify();
  }

  // ========== 导航操作 ==========

  /**
   * 获取下一个匹配节点的位置
   */
  navigateNext(fromVisibleIndex?: number): number | null {
    if (this._matchSet.size === 0) return null;

    const start = fromVisibleIndex ?? -1;
    for (let i = start + 1; i < this._visibleList.length; i++) {
      if (this._matchSet.has(this._visibleList[i].id)) {
        return i;
      }
    }
    return null;
  }

  /**
   * 获取上一个匹配节点的位置
   */
  navigatePrev(fromVisibleIndex?: number): number | null {
    if (this._matchSet.size === 0) return null;

    const start = fromVisibleIndex ?? this._visibleList.length;
    for (let i = start - 1; i >= 0; i--) {
      if (this._matchSet.has(this._visibleList[i].id)) {
        return i;
      }
    }
    return null;
  }

  /**
   * 获取匹配节点的总数
   */
  get matchCount(): number {
    return this._matchSet.size;
  }

  // ========== 选中操作（单选） ==========

  /**
   * 选中指定节点（单选）
   */
  select(nodeId: string | null): void {
    if (nodeId !== null && !this._index.nodeMap.has(nodeId)) {
      return;
    }
    this._selectedId = nodeId;
    this._notify();
  }

  /**
   * 清除选中
   */
  clearSelection(): void {
    if (this._selectedId !== null) {
      this._selectedId = null;
      this._notify();
    }
  }
}
