// src/types.ts
var defaultFieldMapper = {
  id: "id",
  parentId: "parentId",
  name: "name",
  children: "children"
};
var defaultTreeOptions = {
  checkable: false,
  accordion: false,
  filterable: false,
  searchable: false,
  defaultExpandedIds: [],
  defaultCheckedIds: [],
  checkStrictly: false,
  defaultSelectedIds: [],
  fieldMapper: { ...defaultFieldMapper }
};

// src/algorithms/flatten.ts
function buildFlatTree(rawNodes, fieldMapper) {
  const mapper = { ...defaultFieldMapper, ...fieldMapper };
  const idKey = mapper.id;
  const parentIdKey = mapper.parentId;
  const nameKey = mapper.name;
  const childrenMap = /* @__PURE__ */ new Map();
  const rawMap = /* @__PURE__ */ new Map();
  for (const node of rawNodes) {
    const id = String(node[idKey]);
    const parentId = node[parentIdKey];
    rawMap.set(id, node);
    const siblings = childrenMap.get(parentId) ?? [];
    siblings.push(id);
    childrenMap.set(parentId, siblings);
  }
  const rootIds = childrenMap.get(null) ?? [];
  const flatNodes = [];
  const nodeMap = /* @__PURE__ */ new Map();
  const indexMap = /* @__PURE__ */ new Map();
  const stack = [];
  for (let i = rootIds.length - 1; i >= 0; i--) {
    stack.push({ id: rootIds[i], depth: 0, phase: "enter" });
  }
  while (stack.length > 0) {
    const item = stack.pop();
    const { id, depth, phase } = item;
    if (phase === "enter") {
      const raw = rawMap.get(id);
      const children = childrenMap.get(id) ?? [];
      const index = flatNodes.length;
      const flatNode = {
        id: String(raw[idKey]),
        name: String(raw[nameKey]),
        parentId: raw[parentIdKey],
        depth,
        index,
        subtreeEnd: index,
        // 先设为自己，后面更新
        hasChildren: children.length > 0
      };
      flatNodes.push(flatNode);
      nodeMap.set(id, flatNode);
      indexMap.set(id, index);
      stack.push({ id, depth, phase: "exit" });
      for (let i = children.length - 1; i >= 0; i--) {
        stack.push({ id: children[i], depth: depth + 1, phase: "enter" });
      }
    } else {
      const node = nodeMap.get(id);
      node.subtreeEnd = flatNodes.length - 1;
    }
  }
  return {
    flatNodes,
    index: {
      nodeMap,
      indexMap,
      childrenMap,
      rootIds
    }
  };
}
function getAncestorIds(nodeId, index) {
  const ancestors = [];
  let currentId = index.nodeMap.get(nodeId)?.parentId ?? null;
  while (currentId !== null) {
    ancestors.push(currentId);
    currentId = index.nodeMap.get(currentId)?.parentId ?? null;
  }
  return ancestors;
}
function getAncestorSet(nodeId, index) {
  return new Set(getAncestorIds(nodeId, index));
}
function getSubtreeIds(nodeId, flatNodes, index) {
  const node = index.nodeMap.get(nodeId);
  if (!node) return [];
  const ids = [];
  for (let i = node.index; i <= node.subtreeEnd; i++) {
    ids.push(flatNodes[i].id);
  }
  return ids;
}

// src/algorithms/visibility.ts
function computeVisibleNodes(flatNodes, expandedSet) {
  const visible = [];
  let i = 0;
  while (i < flatNodes.length) {
    const node = flatNodes[i];
    visible.push(node);
    if (node.hasChildren && !expandedSet.has(node.id)) {
      i = node.subtreeEnd + 1;
    } else {
      i++;
    }
  }
  return visible;
}
function computeFilteredVisibleNodes(flatNodes, expandedSet, filterSet) {
  if (filterSet.size === 0) {
    return computeVisibleNodes(flatNodes, expandedSet);
  }
  const visible = [];
  let i = 0;
  while (i < flatNodes.length) {
    const node = flatNodes[i];
    if (filterSet.has(node.id)) {
      visible.push(node);
      if (node.hasChildren && !expandedSet.has(node.id)) {
        i = node.subtreeEnd + 1;
      } else {
        i++;
      }
    } else {
      i = node.subtreeEnd + 1;
    }
  }
  return visible;
}
function toggleExpand(nodeId, expandedSet) {
  const newSet = new Set(expandedSet);
  if (newSet.has(nodeId)) {
    newSet.delete(nodeId);
  } else {
    newSet.add(nodeId);
  }
  return newSet;
}
function expandToNode(nodeId, expandedSet, nodeMap) {
  const newSet = new Set(expandedSet);
  if (!nodeMap.has(nodeId)) return newSet;
  const ancestors = getAncestorIds(nodeId, { nodeMap });
  for (const id of ancestors) {
    newSet.add(id);
  }
  return newSet;
}
function expandMultiple(nodeIds, expandedSet) {
  return /* @__PURE__ */ new Set([...expandedSet, ...nodeIds]);
}
function collapseSiblings(nodeId, flatNodes, expandedSet, nodeMap) {
  const newSet = new Set(expandedSet);
  const node = nodeMap.get(nodeId);
  if (!node || node.parentId === null) return newSet;
  const parent = nodeMap.get(node.parentId);
  if (!parent) return newSet;
  for (let i = parent.index + 1; i <= parent.subtreeEnd; i++) {
    const sibling = flatNodes[i];
    if (sibling.depth === node.depth + 1 && sibling.id !== nodeId) {
      newSet.delete(sibling.id);
    }
  }
  return newSet;
}

// src/algorithms/checkbox.ts
function toggleCheck(nodeId, flatNodes, checkedSet, index) {
  const newSet = new Set(checkedSet);
  const node = index.nodeMap.get(nodeId);
  if (!node) return newSet;
  const isCurrentlyChecked = newSet.has(nodeId);
  const start = node.index;
  const end = node.subtreeEnd;
  for (let i = start; i <= end; i++) {
    const n = flatNodes[i];
    if (isCurrentlyChecked) {
      newSet.delete(n.id);
    } else {
      newSet.add(n.id);
    }
  }
  updateAncestorsCheckState(node.parentId, flatNodes, newSet, index);
  return newSet;
}
function updateAncestorsCheckState(parentId, flatNodes, checkedSet, index) {
  let currentParentId = parentId;
  while (currentParentId !== null) {
    const parent = index.nodeMap.get(currentParentId);
    if (!parent) break;
    const allChildrenFullyChecked = isSubtreeFullyChecked(parent, flatNodes, checkedSet);
    if (allChildrenFullyChecked) {
      checkedSet.add(currentParentId);
    } else {
      checkedSet.delete(currentParentId);
    }
    currentParentId = parent.parentId;
  }
}
function isSubtreeFullyChecked(node, flatNodes, checkedSet) {
  for (let i = node.index; i <= node.subtreeEnd; i++) {
    if (!checkedSet.has(flatNodes[i].id)) {
      return false;
    }
  }
  return true;
}
function isSubtreeHasAnyChecked(node, flatNodes, checkedSet) {
  for (let i = node.index + 1; i <= node.subtreeEnd; i++) {
    if (checkedSet.has(flatNodes[i].id)) {
      return true;
    }
  }
  return false;
}
function getCheckState(node, flatNodes, checkedSet) {
  if (checkedSet.has(node.id)) {
    return "checked";
  }
  if (!node.hasChildren) {
    return "unchecked";
  }
  if (isSubtreeHasAnyChecked(node, flatNodes, checkedSet)) {
    return "indeterminate";
  }
  return "unchecked";
}
function checkAll(flatNodes) {
  return new Set(flatNodes.map((n) => n.id));
}
function uncheckAll() {
  return /* @__PURE__ */ new Set();
}
function getCheckedLeafIds(flatNodes, checkedSet) {
  return flatNodes.filter((n) => !n.hasChildren && checkedSet.has(n.id)).map((n) => n.id);
}

// src/TreeEngine.ts
var TreeEngine = class {
  // id → visibleIndex
  constructor(options) {
    // ========== 大数据：普通变量 ==========
    this._flatNodes = [];
    this._index = {
      nodeMap: /* @__PURE__ */ new Map(),
      indexMap: /* @__PURE__ */ new Map(),
      childrenMap: /* @__PURE__ */ new Map(),
      rootIds: []
    };
    // ========== 状态管理 ==========
    this._expandedSet = /* @__PURE__ */ new Set();
    this._checkedSet = /* @__PURE__ */ new Set();
    this._selectedId = null;
    // 当前选中的节点（单选）
    this._filterSet = /* @__PURE__ */ new Set();
    // 过滤显示集合（匹配节点 + 祖先）
    this._matchSet = /* @__PURE__ */ new Set();
    // ========== 订阅系统 ==========
    this._subscribers = /* @__PURE__ */ new Set();
    // ========== 事务模式 ==========
    this._batchMode = false;
    this._pendingNotify = false;
    // ========== 可见性缓存 ==========
    this._visibleList = [];
    this._visibleIndexMap = /* @__PURE__ */ new Map();
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
  get flatNodes() {
    return this._flatNodes;
  }
  get index() {
    return this._index;
  }
  get visibleList() {
    return this._visibleList;
  }
  get totalCount() {
    return this._flatNodes.length;
  }
  get visibleCount() {
    return this._visibleList.length;
  }
  get checkedCount() {
    return this._checkedSet.size;
  }
  get expandedSet() {
    return this._expandedSet;
  }
  get checkedSet() {
    return this._checkedSet;
  }
  get matchSet() {
    return this._matchSet;
  }
  get filterSet() {
    return this._filterSet;
  }
  get isAccordionMode() {
    return this._options.accordion;
  }
  get isCheckStrictly() {
    return this._options.checkStrictly;
  }
  /** 当前选中的节点 ID（单选） */
  get selectedId() {
    return this._selectedId;
  }
  // ========== 初始化 ==========
  /**
   * 初始化树数据
   * @param rawNodes 原始节点数据
   * @param fieldMapper 字段映射配置（可选，使用构造函数中的配置）
   */
  init(rawNodes, fieldMapper) {
    const mapper = fieldMapper ?? this._fieldMapper;
    const result = buildFlatTree(rawNodes, mapper);
    this._flatNodes = result.flatNodes;
    this._index = result.index;
    this._expandedSet = new Set(this._options.defaultExpandedIds);
    this._checkedSet = new Set(this._options.defaultCheckedIds);
    this._selectedId = this._options.defaultSelectedIds[0] ?? null;
    this._filterSet = /* @__PURE__ */ new Set();
    this._matchSet = /* @__PURE__ */ new Set();
    this._recomputeVisibility();
    this._notify();
  }
  /**
   * 更新配置
   */
  setOptions(options) {
    this._options = { ...this._options, ...options };
    this._notify();
  }
  // ========== 订阅机制 ==========
  /**
   * 订阅状态变化
   * @returns 取消订阅函数
   */
  subscribe(fn) {
    this._subscribers.add(fn);
    return () => this._subscribers.delete(fn);
  }
  /**
   * 开启事务模式
   * 在事务模式下，多次状态变更会合并为一次通知
   */
  startBatch() {
    this._batchMode = true;
  }
  /**
   * 提交事务
   * 合并所有pending的状态变更并通知订阅者
   */
  commit() {
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
  batch(fn) {
    this.startBatch();
    try {
      fn();
    } finally {
      this.commit();
    }
  }
  _notify() {
    if (this._batchMode) {
      this._pendingNotify = true;
    } else {
      this._recomputeVisibility();
      this._notifySubscribers();
    }
  }
  _notifySubscribers() {
    for (const fn of this._subscribers) {
      fn();
    }
  }
  // ========== 可见性计算 ==========
  _recomputeVisibility() {
    if (this._filterSet.size > 0) {
      this._visibleList = computeFilteredVisibleNodes(
        this._flatNodes,
        this._expandedSet,
        this._filterSet
      );
    } else {
      this._visibleList = computeVisibleNodes(this._flatNodes, this._expandedSet);
    }
    this._visibleIndexMap.clear();
    for (let i = 0; i < this._visibleList.length; i++) {
      this._visibleIndexMap.set(this._visibleList[i].id, i);
    }
  }
  // ========== 节点查询 ==========
  /**
   * 根据 id 获取节点
   */
  getNode(nodeId) {
    return this._index.nodeMap.get(nodeId);
  }
  /**
   * 根据 visibleIndex 获取节点
   */
  getNodeByVisibleIndex(visibleIndex) {
    return this._visibleList[visibleIndex];
  }
  /**
   * 根据 visibleIndex 获取对应的 flatIndex（用于引擎操作）
   * @returns flatIndex，如果找不到返回 -1
   */
  getFlatIndexByVisibleIndex(visibleIndex) {
    const node = this._visibleList[visibleIndex];
    if (!node) return -1;
    return this._index.indexMap.get(node.id) ?? -1;
  }
  /**
   * 获取节点在可见列表中的索引
   */
  getVisibleIndex(nodeId) {
    return this._visibleIndexMap.get(nodeId) ?? -1;
  }
  /**
   * 获取节点状态（供 UI 渲染使用）
   */
  getNodeStatus(nodeId) {
    const node = this._index.nodeMap.get(nodeId);
    if (!node) return null;
    const visibleIndex = this._visibleIndexMap.get(nodeId) ?? -1;
    let isIndeterminate = false;
    if (this._options.checkable && !this._options.checkStrictly) {
      isIndeterminate = getCheckState(node, this._flatNodes, this._checkedSet) === "indeterminate";
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
  toggle(index) {
    const node = this._flatNodes[index];
    if (!node || !node.hasChildren) return;
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
  setExpanded(index, value) {
    const node = this._flatNodes[index];
    if (!node || !node.hasChildren) return;
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
  expandToNode(nodeId) {
    this._expandedSet = expandToNode(nodeId, this._expandedSet, this._index.nodeMap);
    this._recomputeVisibility();
    this._notify();
  }
  /**
   * 展开所有节点
   */
  expandAll() {
    const newSet = /* @__PURE__ */ new Set();
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
  collapseAll() {
    this._expandedSet = /* @__PURE__ */ new Set();
    this._recomputeVisibility();
    this._notify();
  }
  /**
   * 展开到指定深度
   */
  expandToDepth(depth) {
    const newSet = /* @__PURE__ */ new Set();
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
  setExpandedSet(newSet) {
    this._expandedSet = newSet;
    this._recomputeVisibility();
    this._notify();
  }
  // ========== Checkbox 操作 ==========
  /**
   * 设置节点勾选状态
   */
  setChecked(index, value) {
    const node = this._flatNodes[index];
    if (!node) return;
    if (this._options.checkStrictly) {
      if (value) {
        this._checkedSet.add(node.id);
      } else {
        this._checkedSet.delete(node.id);
      }
    } else {
      if (value) {
        const start = node.index;
        const end = node.subtreeEnd;
        for (let i = start; i <= end; i++) {
          this._checkedSet.add(this._flatNodes[i].id);
        }
        this._updateAncestorsCheckState(node.parentId);
      } else {
        const start = node.index;
        const end = node.subtreeEnd;
        for (let i = start; i <= end; i++) {
          this._checkedSet.delete(this._flatNodes[i].id);
        }
        this._updateAncestorsCheckState(node.parentId);
      }
    }
    this._notify();
  }
  /**
   * 切换节点勾选状态
   */
  toggleCheck(index) {
    const node = this._flatNodes[index];
    if (!node) return;
    if (this._options.checkStrictly) {
      if (this._checkedSet.has(node.id)) {
        this._checkedSet.delete(node.id);
      } else {
        this._checkedSet.add(node.id);
      }
    } else {
      this._checkedSet = toggleCheck(node.id, this._flatNodes, this._checkedSet, this._index);
    }
    this._notify();
  }
  /**
   * 全选
   */
  checkAll() {
    this._checkedSet = checkAll(this._flatNodes);
    this._notify();
  }
  /**
   * 全不选
   */
  uncheckAll() {
    this._checkedSet = uncheckAll();
    this._notify();
  }
  /**
   * 获取所有已选中的叶子节点 ID
   */
  getCheckedLeafIds() {
    return getCheckedLeafIds(this._flatNodes, this._checkedSet);
  }
  /**
   * 获取节点的勾选状态
   */
  getCheckState(index) {
    const node = this._flatNodes[index];
    if (!node) return "unchecked";
    if (this._options.checkStrictly) {
      return this._checkedSet.has(node.id) ? "checked" : "unchecked";
    }
    return getCheckState(node, this._flatNodes, this._checkedSet);
  }
  /**
   * 根据节点 ID 获取勾选状态（供 UI 层使用）
   */
  getCheckStateByNodeId(nodeId) {
    const node = this.getNode(nodeId);
    if (!node) return "unchecked";
    return this.getCheckState(node.index);
  }
  _updateAncestorsCheckState(parentId) {
    updateAncestorsCheckState(parentId, this._flatNodes, this._checkedSet, this._index);
  }
  // ========== 过滤/搜索操作 ==========
  /**
   * 设置过滤函数
   * @param predicate 返回 true 表示节点应显示
   */
  setFilter(predicate) {
    if (!this._options.filterable || !predicate) {
      this._filterSet = /* @__PURE__ */ new Set();
      this._matchSet = /* @__PURE__ */ new Set();
      this._recomputeVisibility();
      this._notify();
      return;
    }
    const matchIds = /* @__PURE__ */ new Set();
    const filterIds = /* @__PURE__ */ new Set();
    for (const node of this._flatNodes) {
      if (predicate(node)) {
        matchIds.add(node.id);
        const ancestors = getAncestorIds(node.id, this._index);
        for (const ancestorId of ancestors) {
          filterIds.add(ancestorId);
        }
      }
    }
    this._filterSet = /* @__PURE__ */ new Set([...filterIds, ...matchIds]);
    this._matchSet = matchIds;
    this._expandedSet = expandMultiple(filterIds, this._expandedSet);
    this._recomputeVisibility();
    this._notify();
  }
  /**
   * 设置搜索关键词（使用内置过滤）
   */
  setSearch(query) {
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
  isMatch(nodeId) {
    return this._matchSet.has(nodeId);
  }
  /**
   * 清除过滤/搜索
   */
  clearFilter() {
    this.setFilter(null);
  }
  /**
   * 直接设置搜索匹配结果（用于异步搜索，如 Web Worker）
   * @param matchIds 匹配的节点 ID 集合
   * @param expandIds 需要展开的祖先节点 ID 集合
   */
  setMatchResult(matchIds, expandIds) {
    if (matchIds.size === 0) {
      this._filterSet = /* @__PURE__ */ new Set();
      this._matchSet = /* @__PURE__ */ new Set();
      this._recomputeVisibility();
      this._notify();
      return;
    }
    this._filterSet = /* @__PURE__ */ new Set([...matchIds, ...expandIds]);
    this._matchSet = matchIds;
    this._expandedSet = expandMultiple(expandIds, this._expandedSet);
    this._recomputeVisibility();
    this._notify();
  }
  // ========== 导航操作 ==========
  /**
   * 获取下一个匹配节点的位置
   */
  navigateNext(fromVisibleIndex) {
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
  navigatePrev(fromVisibleIndex) {
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
  get matchCount() {
    return this._matchSet.size;
  }
  // ========== 选中操作（单选） ==========
  /**
   * 选中指定节点（单选）
   */
  select(nodeId) {
    if (nodeId !== null && !this._index.nodeMap.has(nodeId)) {
      return;
    }
    this._selectedId = nodeId;
    this._notify();
  }
  /**
   * 清除选中
   */
  clearSelection() {
    if (this._selectedId !== null) {
      this._selectedId = null;
      this._notify();
    }
  }
};

// src/virtual-list.ts
var VirtualListController = class {
  constructor(options) {
    this.container = null;
    this.topSentinel = null;
    this.bottomSentinel = null;
    this.observer = null;
    this.visibleList = [];
    this.state = {
      startIndex: 0,
      endIndex: 0,
      offsetTop: 0
    };
    this.scrollHandler = null;
    /**
     * 查找节点索引的回调（用于 scrollToNode）
     */
    this.findIndexById = null;
    this.itemHeight = options.itemHeight;
    this.bufferSize = options.bufferSize ?? 10;
    this.onStateChange = options.onStateChange;
  }
  /**
   * 初始化
   */
  init(container, topSentinel, bottomSentinel) {
    this.container = container;
    this.topSentinel = topSentinel;
    this.bottomSentinel = bottomSentinel;
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
    this.scrollHandler = () => this.recalculate();
    container.addEventListener("scroll", this.scrollHandler, { passive: true });
    this.recalculate();
  }
  /**
   * 更新可见列表
   */
  updateVisibleList(list) {
    this.visibleList = list;
    this.recalculate();
  }
  /**
   * 设置查找节点索引的回调（用于 scrollToNode）
   */
  setFindIndexById(fn) {
    this.findIndexById = fn;
  }
  /**
   * 处理交叉观察
   */
  handleIntersection(entries) {
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
  recalculate() {
    if (!this.container) return;
    const viewportHeight = this.container.clientHeight;
    const viewportNodes = Math.ceil(viewportHeight / this.itemHeight);
    const totalNodes = this.visibleList.length;
    const scrollTop = this.container.scrollTop;
    const scrollIndex = Math.floor(scrollTop / this.itemHeight);
    const startIndex = Math.max(0, scrollIndex - this.bufferSize);
    const endIndex = Math.min(totalNodes, scrollIndex + viewportNodes + this.bufferSize);
    const newState = {
      startIndex,
      endIndex,
      offsetTop: startIndex * this.itemHeight
    };
    if (newState.startIndex !== this.state.startIndex || newState.endIndex !== this.state.endIndex) {
      this.state = newState;
      this.onStateChange(this.state);
    }
  }
  /**
   * 滚动到指定节点（需要先设置 setFindIndexById）
   */
  scrollToNode(nodeId) {
    if (!this.findIndexById || !this.container) return;
    const index = this.findIndexById(nodeId);
    if (index === -1) return;
    const targetTop = index * this.itemHeight;
    const viewportHeight = this.container.clientHeight;
    const currentScrollTop = this.container.scrollTop;
    if (targetTop < currentScrollTop || targetTop > currentScrollTop + viewportHeight) {
      this.container.scrollTop = targetTop - viewportHeight / 2 + this.itemHeight / 2;
    }
    this.recalculate();
  }
  /**
   * 滚动到指定索引
   */
  scrollToIndex(index) {
    if (index < 0 || index >= this.visibleList.length || !this.container) return;
    const targetTop = index * this.itemHeight;
    const viewportHeight = this.container.clientHeight;
    const currentScrollTop = this.container.scrollTop;
    if (targetTop < currentScrollTop || targetTop > currentScrollTop + viewportHeight) {
      this.container.scrollTop = targetTop - viewportHeight / 2 + this.itemHeight / 2;
    }
    this.recalculate();
  }
  /**
   * 滚动到顶部
   */
  scrollToTop() {
    if (!this.container) return;
    this.container.scrollTop = 0;
    this.recalculate();
  }
  /**
   * 滚动到底部
   */
  scrollToBottom() {
    if (!this.container) return;
    this.container.scrollTop = this.visibleList.length * this.itemHeight;
    this.recalculate();
  }
  /**
   * 获取当前状态
   */
  getState() {
    return { ...this.state };
  }
  /**
   * 获取总高度
   */
  getTotalHeight() {
    return this.visibleList.length * this.itemHeight;
  }
  /**
   * 销毁
   */
  destroy() {
    this.observer?.disconnect();
    this.observer = null;
    if (this.container && this.scrollHandler) {
      this.container.removeEventListener("scroll", this.scrollHandler);
    }
    this.scrollHandler = null;
    this.container = null;
  }
};
function calculateVisibleRange(scrollTop, viewportHeight, itemHeight, totalCount, bufferSize = 10) {
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

// src/search.ts
var SearchController = class {
  constructor(options) {
    this.worker = null;
    this.debounceTimer = null;
    this.isReady = false;
    this.pendingSearch = null;
    this.debounceMs = options.debounceMs ?? 200;
    this.onResult = options.onResult;
  }
  /**
   * 初始化 Worker
   * @param searchData 搜索数据，需要包含 id, name, parentId 字段
   */
  init(searchData, workerUrl) {
    const url = workerUrl ?? new URL("./search.worker.ts", import.meta.url);
    const urlObj = typeof url === "string" ? new URL(url) : url;
    if (urlObj.protocol === "data:") {
      this.worker = new Worker(urlObj, { type: "module" });
    } else {
      this.worker = new Worker(urlObj, { type: "module" });
    }
    this.worker.onmessage = (e) => {
      const { type, payload } = e.data;
      if (type === "init-done") {
        this.isReady = true;
        if (this.pendingSearch !== null) {
          this.searchImmediate(this.pendingSearch);
          this.pendingSearch = null;
        }
      }
      if (type === "search-result" && payload) {
        this.onResult({
          matchIds: new Set(payload.matchIds),
          expandIds: new Set(payload.expandIds)
        });
      }
    };
    this.worker.onerror = (e) => {
      console.error("Search worker error:", e);
    };
    this.worker.postMessage({
      type: "init",
      payload: {
        data: searchData.map((n) => ({
          id: n.id,
          name: n.name,
          parentId: n.parentId
        }))
      }
    });
  }
  /**
   * 执行搜索（带防抖）
   */
  search(keyword) {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }
    if (keyword.trim() === "") {
      this.clear();
      return;
    }
    this.debounceTimer = setTimeout(() => {
      this.searchImmediate(keyword);
    }, this.debounceMs);
  }
  /**
   * 立即搜索（不防抖）
   */
  searchImmediate(keyword) {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }
    if (keyword.trim() === "") {
      this.clear();
      return;
    }
    if (!this.isReady) {
      this.pendingSearch = keyword;
      return;
    }
    this.worker?.postMessage({
      type: "search",
      payload: { keyword }
    });
  }
  /**
   * 清除搜索
   */
  clear() {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }
    this.onResult({
      matchIds: /* @__PURE__ */ new Set(),
      expandIds: /* @__PURE__ */ new Set()
    });
  }
  /**
   * 检查是否就绪
   */
  get ready() {
    return this.isReady;
  }
  /**
   * 销毁
   */
  destroy() {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }
    this.worker?.terminate();
    this.worker = null;
    this.isReady = false;
  }
};
function searchSync(keyword, nodes) {
  if (!keyword || keyword.trim() === "") {
    return { matchIds: /* @__PURE__ */ new Set(), expandIds: /* @__PURE__ */ new Set() };
  }
  const lowerKeyword = keyword.toLowerCase().trim();
  const matchIds = /* @__PURE__ */ new Set();
  const expandIds = /* @__PURE__ */ new Set();
  const parentMap = new Map(nodes.map((n) => [n.id, n.parentId]));
  for (const node of nodes) {
    if (node.name.toLowerCase().includes(lowerKeyword)) {
      matchIds.add(node.id);
      let currentParentId = node.parentId;
      while (currentParentId !== null) {
        expandIds.add(currentParentId);
        currentParentId = parentMap.get(currentParentId) ?? null;
      }
    }
  }
  return { matchIds, expandIds };
}

// src/search-config.ts
var defaultSearchConfig = {
  enableNavigation: true,
  enableLoop: true,
  showCount: true,
  debounceMs: 200
};
function createSearchConfig(overrides) {
  return { ...defaultSearchConfig, ...overrides };
}
export {
  SearchController,
  TreeEngine,
  VirtualListController,
  buildFlatTree,
  calculateVisibleRange,
  checkAll,
  collapseSiblings,
  computeFilteredVisibleNodes,
  computeVisibleNodes,
  createSearchConfig,
  defaultSearchConfig,
  defaultTreeOptions,
  expandMultiple,
  expandToNode,
  getAncestorIds,
  getAncestorSet,
  getCheckState,
  getCheckedLeafIds,
  getCheckState as getNodeCheckState,
  getSubtreeIds,
  searchSync,
  toggleCheck,
  toggleExpand,
  uncheckAll
};
