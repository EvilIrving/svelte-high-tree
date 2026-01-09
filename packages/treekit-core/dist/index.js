var __typeError = (msg) => {
  throw TypeError(msg);
};
var __accessCheck = (obj, member, msg) => member.has(obj) || __typeError("Cannot " + msg);
var __privateGet = (obj, member, getter) => (__accessCheck(obj, member, "read from private field"), getter ? getter.call(obj) : member.get(obj));
var __privateAdd = (obj, member, value) => member.has(obj) ? __typeError("Cannot add the same private member more than once") : member instanceof WeakSet ? member.add(obj) : member.set(obj, value);
var __privateSet = (obj, member, value, setter) => (__accessCheck(obj, member, "write to private field"), setter ? setter.call(obj, value) : member.set(obj, value), value);
var __privateMethod = (obj, member, method) => (__accessCheck(obj, member, "access private method"), method);

// src/types.ts
var DEFAULT_FIELD_MAPPER = {
  id: "id",
  parentId: "parentId",
  name: "name",
  children: "children"
};
var DEFAULT_TREE_OPTIONS = {
  checkable: false,
  accordion: false,
  filterable: false,
  searchable: false,
  defaultExpandedKeys: [],
  defaultCheckedKeys: [],
  checkStrictly: false,
  defaultSelectedKeys: [],
  fieldMapper: { ...DEFAULT_FIELD_MAPPER }
};

// src/algorithms/flatten.ts
function buildFlatTree(rawNodes, fieldMapper) {
  const mapper = { ...DEFAULT_FIELD_MAPPER, ...fieldMapper };
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
function getAncestorIDs(nodeId, index) {
  const ancestors = [];
  let currentId = index.nodeMap.get(nodeId)?.parentId ?? null;
  while (currentId !== null) {
    ancestors.push(currentId);
    currentId = index.nodeMap.get(currentId)?.parentId ?? null;
  }
  return ancestors;
}
function getAncestorSet(nodeId, index) {
  return new Set(getAncestorIDs(nodeId, index));
}
function getSubtreeIDs(nodeId, flatNodes, index) {
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
  const ancestors = getAncestorIDs(nodeId, { nodeMap });
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
function getCheckedLeafIDs(flatNodes, checkedSet) {
  return flatNodes.filter((n) => !n.hasChildren && checkedSet.has(n.id)).map((n) => n.id);
}

// src/TreeEngine.ts
var _flatNodes, _index, _expandedSet, _checkedSet, _selectedId, _filterSet, _matchSet, _options, _fieldMapper, _subscribers, _batchMode, _pendingNotify, _visibleList, _visibleIndexMap, _TreeEngine_instances, notify_fn, notifySubscribers_fn, recomputeVisibility_fn, updateAncestorsCheckState_fn;
var TreeEngine = class {
  // id → visibleIndex
  constructor(options) {
    __privateAdd(this, _TreeEngine_instances);
    // ========== 大数据：普通变量 ==========
    __privateAdd(this, _flatNodes, []);
    __privateAdd(this, _index, {
      nodeMap: /* @__PURE__ */ new Map(),
      indexMap: /* @__PURE__ */ new Map(),
      childrenMap: /* @__PURE__ */ new Map(),
      rootIds: []
    });
    // ========== 状态管理 ==========
    __privateAdd(this, _expandedSet, /* @__PURE__ */ new Set());
    __privateAdd(this, _checkedSet, /* @__PURE__ */ new Set());
    __privateAdd(this, _selectedId, null);
    // 当前选中的节点（单选）
    __privateAdd(this, _filterSet, /* @__PURE__ */ new Set());
    // 过滤显示集合（匹配节点 + 祖先）
    __privateAdd(this, _matchSet, /* @__PURE__ */ new Set());
    // 精确匹配的节点
    __privateAdd(this, _options);
    __privateAdd(this, _fieldMapper);
    // ========== 订阅系统 ==========
    __privateAdd(this, _subscribers, /* @__PURE__ */ new Set());
    // ========== 事务模式 ==========
    __privateAdd(this, _batchMode, false);
    __privateAdd(this, _pendingNotify, false);
    // ========== 可见性缓存 ==========
    __privateAdd(this, _visibleList, []);
    __privateAdd(this, _visibleIndexMap, /* @__PURE__ */ new Map());
    __privateSet(this, _options, {
      checkable: options?.checkable ?? DEFAULT_TREE_OPTIONS.checkable,
      accordion: options?.accordion ?? DEFAULT_TREE_OPTIONS.accordion,
      filterable: options?.filterable ?? DEFAULT_TREE_OPTIONS.filterable,
      searchable: options?.searchable ?? DEFAULT_TREE_OPTIONS.searchable,
      defaultExpandedKeys: options?.defaultExpandedKeys ?? DEFAULT_TREE_OPTIONS.defaultExpandedKeys,
      defaultCheckedKeys: options?.defaultCheckedKeys ?? DEFAULT_TREE_OPTIONS.defaultCheckedKeys,
      checkStrictly: options?.checkStrictly ?? DEFAULT_TREE_OPTIONS.checkStrictly,
      defaultSelectedKeys: options?.defaultSelectedKeys ?? DEFAULT_TREE_OPTIONS.defaultSelectedKeys,
      fieldMapper: options?.fieldMapper ?? DEFAULT_TREE_OPTIONS.fieldMapper
    });
    const mapper = options?.fieldMapper ?? {};
    __privateSet(this, _fieldMapper, {
      id: mapper.id ?? DEFAULT_FIELD_MAPPER.id,
      parentId: mapper.parentId ?? DEFAULT_FIELD_MAPPER.parentId,
      name: mapper.name ?? DEFAULT_FIELD_MAPPER.name,
      children: mapper.children ?? DEFAULT_FIELD_MAPPER.children
    });
  }
  // ========== 公共只读属性 ==========
  get flatNodes() {
    return __privateGet(this, _flatNodes);
  }
  get index() {
    return __privateGet(this, _index);
  }
  get visibleList() {
    return __privateGet(this, _visibleList);
  }
  get totalCount() {
    return __privateGet(this, _flatNodes).length;
  }
  get visibleCount() {
    return __privateGet(this, _visibleList).length;
  }
  get checkedCount() {
    return __privateGet(this, _checkedSet).size;
  }
  get expandedSet() {
    return __privateGet(this, _expandedSet);
  }
  get checkedSet() {
    return __privateGet(this, _checkedSet);
  }
  get matchSet() {
    return __privateGet(this, _matchSet);
  }
  get filterSet() {
    return __privateGet(this, _filterSet);
  }
  get isAccordionMode() {
    return __privateGet(this, _options).accordion;
  }
  get isCheckStrictly() {
    return __privateGet(this, _options).checkStrictly;
  }
  /** 当前选中的节点 ID（单选） */
  get selectedId() {
    return __privateGet(this, _selectedId);
  }
  // ========== 初始化 ==========
  /**
   * 初始化树数据
   * @param rawNodes 原始节点数据
   * @param fieldMapper 字段映射配置（可选，使用构造函数中的配置）
   */
  init(rawNodes, fieldMapper) {
    const mapper = fieldMapper ?? __privateGet(this, _fieldMapper);
    const result = buildFlatTree(rawNodes, mapper);
    __privateSet(this, _flatNodes, result.flatNodes);
    __privateSet(this, _index, result.index);
    __privateSet(this, _expandedSet, new Set(__privateGet(this, _options).defaultExpandedKeys));
    __privateSet(this, _checkedSet, new Set(__privateGet(this, _options).defaultCheckedKeys));
    __privateSet(this, _selectedId, __privateGet(this, _options).defaultSelectedKeys[0] ?? null);
    __privateSet(this, _filterSet, /* @__PURE__ */ new Set());
    __privateSet(this, _matchSet, /* @__PURE__ */ new Set());
    __privateMethod(this, _TreeEngine_instances, recomputeVisibility_fn).call(this);
    __privateMethod(this, _TreeEngine_instances, notify_fn).call(this);
  }
  /**
   * 更新配置
   */
  setOptions(options) {
    __privateSet(this, _options, { ...__privateGet(this, _options), ...options });
    __privateMethod(this, _TreeEngine_instances, notify_fn).call(this);
  }
  // ========== 订阅机制 ==========
  /**
   * 订阅状态变化
   * @returns 取消订阅函数
   */
  subscribe(fn) {
    __privateGet(this, _subscribers).add(fn);
    return () => __privateGet(this, _subscribers).delete(fn);
  }
  /**
   * 开启事务模式
   * 在事务模式下，多次状态变更会合并为一次通知
   */
  startBatch() {
    __privateSet(this, _batchMode, true);
  }
  /**
   * 提交事务
   * 合并所有pending的状态变更并通知订阅者
   */
  commit() {
    if (!__privateGet(this, _batchMode)) return;
    __privateSet(this, _batchMode, false);
    if (__privateGet(this, _pendingNotify)) {
      __privateSet(this, _pendingNotify, false);
      __privateMethod(this, _TreeEngine_instances, recomputeVisibility_fn).call(this);
      __privateMethod(this, _TreeEngine_instances, notifySubscribers_fn).call(this);
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
  // ========== 节点查询 ==========
  /**
   * 根据 id 获取节点
   */
  getNode(nodeId) {
    return __privateGet(this, _index).nodeMap.get(nodeId);
  }
  /**
   * 根据 visibleIndex 获取节点
   */
  getNodeByVisibleIndex(visibleIndex) {
    return __privateGet(this, _visibleList)[visibleIndex];
  }
  /**
   * 根据 visibleIndex 获取对应的 flatIndex（用于引擎操作）
   * @returns flatIndex，如果找不到返回 -1
   */
  getFlatIndexByVisibleIndex(visibleIndex) {
    const node = __privateGet(this, _visibleList)[visibleIndex];
    if (!node) return -1;
    return __privateGet(this, _index).indexMap.get(node.id) ?? -1;
  }
  /**
   * 获取节点在可见列表中的索引
   */
  getVisibleIndex(nodeId) {
    return __privateGet(this, _visibleIndexMap).get(nodeId) ?? -1;
  }
  /**
   * 获取节点状态（供 UI 渲染使用）
   */
  getNodeStatus(nodeId) {
    const node = __privateGet(this, _index).nodeMap.get(nodeId);
    if (!node) return null;
    const visibleIndex = __privateGet(this, _visibleIndexMap).get(nodeId) ?? -1;
    let isIndeterminate = false;
    if (__privateGet(this, _options).checkable && !__privateGet(this, _options).checkStrictly) {
      isIndeterminate = getCheckState(node, __privateGet(this, _flatNodes), __privateGet(this, _checkedSet)) === "indeterminate";
    }
    return {
      isExpanded: __privateGet(this, _expandedSet).has(nodeId),
      isChecked: __privateGet(this, _checkedSet).has(nodeId),
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
    const node = __privateGet(this, _flatNodes)[index];
    if (!node || !node.hasChildren) return;
    if (__privateGet(this, _options).accordion && !__privateGet(this, _expandedSet).has(node.id)) {
      __privateSet(this, _expandedSet, collapseSiblings(node.id, __privateGet(this, _flatNodes), __privateGet(this, _expandedSet), __privateGet(this, _index).nodeMap));
    }
    __privateSet(this, _expandedSet, toggleExpand(node.id, __privateGet(this, _expandedSet)));
    __privateMethod(this, _TreeEngine_instances, recomputeVisibility_fn).call(this);
    __privateMethod(this, _TreeEngine_instances, notify_fn).call(this);
  }
  /**
   * 设置节点展开状态
   */
  setExpanded(index, value) {
    const node = __privateGet(this, _flatNodes)[index];
    if (!node || !node.hasChildren) return;
    if (value && __privateGet(this, _options).accordion) {
      __privateSet(this, _expandedSet, collapseSiblings(node.id, __privateGet(this, _flatNodes), __privateGet(this, _expandedSet), __privateGet(this, _index).nodeMap));
    }
    if (value) {
      __privateGet(this, _expandedSet).add(node.id);
    } else {
      __privateGet(this, _expandedSet).delete(node.id);
    }
    __privateMethod(this, _TreeEngine_instances, recomputeVisibility_fn).call(this);
    __privateMethod(this, _TreeEngine_instances, notify_fn).call(this);
  }
  /**
   * 展开到指定节点（展开所有祖先）
   */
  expandToNode(nodeId) {
    __privateSet(this, _expandedSet, expandToNode(nodeId, __privateGet(this, _expandedSet), __privateGet(this, _index).nodeMap));
    __privateMethod(this, _TreeEngine_instances, recomputeVisibility_fn).call(this);
    __privateMethod(this, _TreeEngine_instances, notify_fn).call(this);
  }
  /**
   * 展开所有节点
   */
  expandAll() {
    const newSet = /* @__PURE__ */ new Set();
    for (const node of __privateGet(this, _flatNodes)) {
      if (node.hasChildren) {
        newSet.add(node.id);
      }
    }
    __privateSet(this, _expandedSet, newSet);
    __privateMethod(this, _TreeEngine_instances, recomputeVisibility_fn).call(this);
    __privateMethod(this, _TreeEngine_instances, notify_fn).call(this);
  }
  /**
   * 折叠所有节点
   */
  collapseAll() {
    __privateSet(this, _expandedSet, /* @__PURE__ */ new Set());
    __privateMethod(this, _TreeEngine_instances, recomputeVisibility_fn).call(this);
    __privateMethod(this, _TreeEngine_instances, notify_fn).call(this);
  }
  /**
   * 展开到指定深度
   */
  expandToDepth(depth) {
    const newSet = /* @__PURE__ */ new Set();
    for (const node of __privateGet(this, _flatNodes)) {
      if (node.hasChildren && node.depth < depth) {
        newSet.add(node.id);
      }
    }
    __privateSet(this, _expandedSet, newSet);
    __privateMethod(this, _TreeEngine_instances, recomputeVisibility_fn).call(this);
    __privateMethod(this, _TreeEngine_instances, notify_fn).call(this);
  }
  /**
   * 直接设置展开集合（用于搜索结果定位等场景）
   */
  setExpandedSet(newSet) {
    __privateSet(this, _expandedSet, newSet);
    __privateMethod(this, _TreeEngine_instances, recomputeVisibility_fn).call(this);
    __privateMethod(this, _TreeEngine_instances, notify_fn).call(this);
  }
  // ========== Checkbox 操作 ==========
  /**
   * 设置节点勾选状态
   */
  setChecked(index, value) {
    const node = __privateGet(this, _flatNodes)[index];
    if (!node) return;
    if (__privateGet(this, _options).checkStrictly) {
      if (value) {
        __privateGet(this, _checkedSet).add(node.id);
      } else {
        __privateGet(this, _checkedSet).delete(node.id);
      }
    } else {
      if (value) {
        const start = node.index;
        const end = node.subtreeEnd;
        for (let i = start; i <= end; i++) {
          __privateGet(this, _checkedSet).add(__privateGet(this, _flatNodes)[i].id);
        }
        __privateMethod(this, _TreeEngine_instances, updateAncestorsCheckState_fn).call(this, node.parentId);
      } else {
        const start = node.index;
        const end = node.subtreeEnd;
        for (let i = start; i <= end; i++) {
          __privateGet(this, _checkedSet).delete(__privateGet(this, _flatNodes)[i].id);
        }
        __privateMethod(this, _TreeEngine_instances, updateAncestorsCheckState_fn).call(this, node.parentId);
      }
    }
    __privateMethod(this, _TreeEngine_instances, notify_fn).call(this);
  }
  /**
   * 切换节点勾选状态
   */
  toggleCheck(index) {
    const node = __privateGet(this, _flatNodes)[index];
    if (!node) return;
    if (__privateGet(this, _options).checkStrictly) {
      if (__privateGet(this, _checkedSet).has(node.id)) {
        __privateGet(this, _checkedSet).delete(node.id);
      } else {
        __privateGet(this, _checkedSet).add(node.id);
      }
    } else {
      __privateSet(this, _checkedSet, toggleCheck(node.id, __privateGet(this, _flatNodes), __privateGet(this, _checkedSet), __privateGet(this, _index)));
    }
    __privateMethod(this, _TreeEngine_instances, notify_fn).call(this);
  }
  /**
   * 全选
   */
  checkAll() {
    __privateSet(this, _checkedSet, checkAll(__privateGet(this, _flatNodes)));
    __privateMethod(this, _TreeEngine_instances, notify_fn).call(this);
  }
  /**
   * 全不选
   */
  uncheckAll() {
    __privateSet(this, _checkedSet, uncheckAll());
    __privateMethod(this, _TreeEngine_instances, notify_fn).call(this);
  }
  /**
   * 获取所有已选中的叶子节点 ID
   */
  getCheckedLeafIDs() {
    return getCheckedLeafIDs(__privateGet(this, _flatNodes), __privateGet(this, _checkedSet));
  }
  /**
   * 获取节点的勾选状态
   */
  getCheckState(index) {
    const node = __privateGet(this, _flatNodes)[index];
    if (!node) return "unchecked";
    if (__privateGet(this, _options).checkStrictly) {
      return __privateGet(this, _checkedSet).has(node.id) ? "checked" : "unchecked";
    }
    return getCheckState(node, __privateGet(this, _flatNodes), __privateGet(this, _checkedSet));
  }
  /**
   * 根据节点 ID 获取勾选状态（供 UI 层使用）
   */
  getCheckStateByNodeId(nodeId) {
    const node = this.getNode(nodeId);
    if (!node) return "unchecked";
    return this.getCheckState(node.index);
  }
  // ========== 过滤/搜索操作 ==========
  /**
   * 设置过滤函数
   * @param predicate 返回 true 表示节点应显示
   */
  setFilter(predicate) {
    if (!__privateGet(this, _options).filterable || !predicate) {
      __privateSet(this, _filterSet, /* @__PURE__ */ new Set());
      __privateSet(this, _matchSet, /* @__PURE__ */ new Set());
      __privateMethod(this, _TreeEngine_instances, recomputeVisibility_fn).call(this);
      __privateMethod(this, _TreeEngine_instances, notify_fn).call(this);
      return;
    }
    const matchIds = /* @__PURE__ */ new Set();
    const filterIds = /* @__PURE__ */ new Set();
    for (const node of __privateGet(this, _flatNodes)) {
      if (predicate(node)) {
        matchIds.add(node.id);
        const ancestors = getAncestorIDs(node.id, __privateGet(this, _index));
        for (const ancestorId of ancestors) {
          filterIds.add(ancestorId);
        }
      }
    }
    __privateSet(this, _filterSet, /* @__PURE__ */ new Set([...filterIds, ...matchIds]));
    __privateSet(this, _matchSet, matchIds);
    __privateSet(this, _expandedSet, expandMultiple(filterIds, __privateGet(this, _expandedSet)));
    __privateMethod(this, _TreeEngine_instances, recomputeVisibility_fn).call(this);
    __privateMethod(this, _TreeEngine_instances, notify_fn).call(this);
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
    return __privateGet(this, _matchSet).has(nodeId);
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
      __privateSet(this, _filterSet, /* @__PURE__ */ new Set());
      __privateSet(this, _matchSet, /* @__PURE__ */ new Set());
      __privateMethod(this, _TreeEngine_instances, recomputeVisibility_fn).call(this);
      __privateMethod(this, _TreeEngine_instances, notify_fn).call(this);
      return;
    }
    __privateSet(this, _filterSet, /* @__PURE__ */ new Set([...matchIds, ...expandIds]));
    __privateSet(this, _matchSet, matchIds);
    __privateSet(this, _expandedSet, expandMultiple(expandIds, __privateGet(this, _expandedSet)));
    __privateMethod(this, _TreeEngine_instances, recomputeVisibility_fn).call(this);
    __privateMethod(this, _TreeEngine_instances, notify_fn).call(this);
  }
  // ========== 导航操作 ==========
  /**
   * 获取下一个匹配节点的位置
   */
  navigateNext(fromVisibleIndex) {
    if (__privateGet(this, _matchSet).size === 0) return null;
    const start = fromVisibleIndex ?? -1;
    for (let i = start + 1; i < __privateGet(this, _visibleList).length; i++) {
      if (__privateGet(this, _matchSet).has(__privateGet(this, _visibleList)[i].id)) {
        return i;
      }
    }
    return null;
  }
  /**
   * 获取上一个匹配节点的位置
   */
  navigatePrev(fromVisibleIndex) {
    if (__privateGet(this, _matchSet).size === 0) return null;
    const start = fromVisibleIndex ?? __privateGet(this, _visibleList).length;
    for (let i = start - 1; i >= 0; i--) {
      if (__privateGet(this, _matchSet).has(__privateGet(this, _visibleList)[i].id)) {
        return i;
      }
    }
    return null;
  }
  /**
   * 获取匹配节点的总数
   */
  get matchCount() {
    return __privateGet(this, _matchSet).size;
  }
  // ========== 选中操作（单选） ==========
  /**
   * 选中指定节点（单选）
   */
  select(nodeId) {
    if (nodeId !== null && !__privateGet(this, _index).nodeMap.has(nodeId)) {
      return;
    }
    __privateSet(this, _selectedId, nodeId);
    __privateMethod(this, _TreeEngine_instances, notify_fn).call(this);
  }
  /**
   * 清除选中
   */
  clearSelection() {
    if (__privateGet(this, _selectedId) !== null) {
      __privateSet(this, _selectedId, null);
      __privateMethod(this, _TreeEngine_instances, notify_fn).call(this);
    }
  }
};
_flatNodes = new WeakMap();
_index = new WeakMap();
_expandedSet = new WeakMap();
_checkedSet = new WeakMap();
_selectedId = new WeakMap();
_filterSet = new WeakMap();
_matchSet = new WeakMap();
_options = new WeakMap();
_fieldMapper = new WeakMap();
_subscribers = new WeakMap();
_batchMode = new WeakMap();
_pendingNotify = new WeakMap();
_visibleList = new WeakMap();
_visibleIndexMap = new WeakMap();
_TreeEngine_instances = new WeakSet();
notify_fn = function() {
  if (__privateGet(this, _batchMode)) {
    __privateSet(this, _pendingNotify, true);
  } else {
    __privateMethod(this, _TreeEngine_instances, recomputeVisibility_fn).call(this);
    __privateMethod(this, _TreeEngine_instances, notifySubscribers_fn).call(this);
  }
};
notifySubscribers_fn = function() {
  for (const fn of __privateGet(this, _subscribers)) {
    fn();
  }
};
// ========== 可见性计算 ==========
recomputeVisibility_fn = function() {
  if (__privateGet(this, _filterSet).size > 0) {
    __privateSet(this, _visibleList, computeFilteredVisibleNodes(
      __privateGet(this, _flatNodes),
      __privateGet(this, _expandedSet),
      __privateGet(this, _filterSet)
    ));
  } else {
    __privateSet(this, _visibleList, computeVisibleNodes(__privateGet(this, _flatNodes), __privateGet(this, _expandedSet)));
  }
  __privateGet(this, _visibleIndexMap).clear();
  for (let i = 0; i < __privateGet(this, _visibleList).length; i++) {
    __privateGet(this, _visibleIndexMap).set(__privateGet(this, _visibleList)[i].id, i);
  }
};
updateAncestorsCheckState_fn = function(parentId) {
  updateAncestorsCheckState(parentId, __privateGet(this, _flatNodes), __privateGet(this, _checkedSet), __privateGet(this, _index));
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
var _worker, _debounceTimer, _debounceMs, _onResult, _isReady, _pendingSearch;
var SearchController = class {
  constructor(options) {
    __privateAdd(this, _worker, null);
    __privateAdd(this, _debounceTimer, null);
    __privateAdd(this, _debounceMs);
    __privateAdd(this, _onResult);
    __privateAdd(this, _isReady, false);
    __privateAdd(this, _pendingSearch, null);
    __privateSet(this, _debounceMs, options.debounceMs ?? 200);
    __privateSet(this, _onResult, options.onResult);
  }
  /**
   * 初始化 Worker
   * @param searchData 搜索数据，需要包含 id, name, parentId 字段
   */
  init(searchData, workerUrl) {
    const url = workerUrl ?? new URL("./search.worker.ts", import.meta.url);
    const urlObj = typeof url === "string" ? new URL(url) : url;
    if (urlObj.protocol === "data:") {
      __privateSet(this, _worker, new Worker(urlObj, { type: "module" }));
    } else {
      __privateSet(this, _worker, new Worker(urlObj, { type: "module" }));
    }
    __privateGet(this, _worker).onmessage = (e) => {
      const { type, payload } = e.data;
      if (type === "init-done") {
        __privateSet(this, _isReady, true);
        if (__privateGet(this, _pendingSearch) !== null) {
          this.searchImmediate(__privateGet(this, _pendingSearch));
          __privateSet(this, _pendingSearch, null);
        }
      }
      if (type === "search-result" && payload) {
        __privateGet(this, _onResult).call(this, {
          matchIds: new Set(payload.matchIds),
          expandIds: new Set(payload.expandIds)
        });
      }
    };
    __privateGet(this, _worker).onerror = (e) => {
      console.error("Search worker error:", e);
    };
    __privateGet(this, _worker).postMessage({
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
    if (__privateGet(this, _debounceTimer)) {
      clearTimeout(__privateGet(this, _debounceTimer));
    }
    if (keyword.trim() === "") {
      this.clear();
      return;
    }
    __privateSet(this, _debounceTimer, setTimeout(() => {
      this.searchImmediate(keyword);
    }, __privateGet(this, _debounceMs)));
  }
  /**
   * 立即搜索（不防抖）
   */
  searchImmediate(keyword) {
    if (__privateGet(this, _debounceTimer)) {
      clearTimeout(__privateGet(this, _debounceTimer));
      __privateSet(this, _debounceTimer, null);
    }
    if (keyword.trim() === "") {
      this.clear();
      return;
    }
    if (!__privateGet(this, _isReady)) {
      __privateSet(this, _pendingSearch, keyword);
      return;
    }
    __privateGet(this, _worker)?.postMessage({
      type: "search",
      payload: { keyword }
    });
  }
  /**
   * 清除搜索
   */
  clear() {
    if (__privateGet(this, _debounceTimer)) {
      clearTimeout(__privateGet(this, _debounceTimer));
      __privateSet(this, _debounceTimer, null);
    }
    __privateGet(this, _onResult).call(this, {
      matchIds: /* @__PURE__ */ new Set(),
      expandIds: /* @__PURE__ */ new Set()
    });
  }
  /**
   * 检查是否就绪
   */
  get ready() {
    return __privateGet(this, _isReady);
  }
  /**
   * 销毁
   */
  destroy() {
    if (__privateGet(this, _debounceTimer)) {
      clearTimeout(__privateGet(this, _debounceTimer));
      __privateSet(this, _debounceTimer, null);
    }
    __privateGet(this, _worker)?.terminate();
    __privateSet(this, _worker, null);
    __privateSet(this, _isReady, false);
  }
};
_worker = new WeakMap();
_debounceTimer = new WeakMap();
_debounceMs = new WeakMap();
_onResult = new WeakMap();
_isReady = new WeakMap();
_pendingSearch = new WeakMap();
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
var DEFAULT_SEARCH_CONFIG = {
  enableNavigation: true,
  enableLoop: true,
  showCount: true,
  debounceMs: 200
};
function createSearchConfig(overrides) {
  return { ...DEFAULT_SEARCH_CONFIG, ...overrides };
}
export {
  DEFAULT_FIELD_MAPPER,
  DEFAULT_SEARCH_CONFIG,
  DEFAULT_TREE_OPTIONS,
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
  expandMultiple,
  expandToNode,
  getAncestorIDs,
  getAncestorSet,
  getCheckState,
  getCheckedLeafIDs,
  getCheckState as getNodeCheckState,
  getSubtreeIDs,
  searchSync,
  toggleCheck,
  toggleExpand,
  uncheckAll
};
