import { defaultTreeOptions, defaultFieldMapper } from './types';
import { buildFlatTree } from './algorithms/flatten';
import { computeVisibleNodes, computeFilteredVisibleNodes, toggleExpand, expandToNode, expandMultiple, collapseSiblings } from './algorithms/visibility';
import { toggleCheck, getCheckState, checkAll, uncheckAll, getCheckedLeafIds } from './algorithms/checkbox';
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
    constructor(options) {
        // ========== 大数据：普通变量 ==========
        this._flatNodes = [];
        this._index = {
            nodeMap: new Map(),
            indexMap: new Map(),
            childrenMap: new Map(),
            rootIds: []
        };
        // ========== 状态管理 ==========
        this._expandedSet = new Set();
        this._checkedSet = new Set();
        this._filterSet = new Set(); // 过滤显示集合（匹配节点 + 祖先）
        this._matchSet = new Set(); // 精确匹配的节点
        // ========== 订阅系统 ==========
        this._subscribers = new Set();
        // ========== 可见性缓存 ==========
        this._visibleList = [];
        this._visibleIndexMap = new Map(); // id → visibleIndex
        this._options = {
            checkable: options?.checkable ?? defaultTreeOptions.checkable,
            accordion: options?.accordion ?? defaultTreeOptions.accordion,
            filterable: options?.filterable ?? defaultTreeOptions.filterable,
            defaultExpandedIds: options?.defaultExpandedIds ?? defaultTreeOptions.defaultExpandedIds,
            defaultCheckedIds: options?.defaultCheckedIds ?? defaultTreeOptions.defaultCheckedIds,
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
        // 重置状态
        this._expandedSet = new Set(this._options.defaultExpandedIds);
        this._checkedSet = new Set(this._options.defaultCheckedIds);
        this._filterSet = new Set();
        this._matchSet = new Set();
        // 计算可见性
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
    _notify() {
        for (const fn of this._subscribers) {
            fn();
        }
    }
    // ========== 可见性计算 ==========
    _recomputeVisibility() {
        if (this._filterSet.size > 0) {
            this._visibleList = computeFilteredVisibleNodes(this._flatNodes, this._expandedSet, this._filterSet);
        }
        else {
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
        if (!node)
            return null;
        const visibleIndex = this._visibleIndexMap.get(nodeId) ?? -1;
        return {
            isExpanded: this._expandedSet.has(nodeId),
            isChecked: this._checkedSet.has(nodeId),
            isIndeterminate: this._options.checkable
                ? getCheckState(node, this._flatNodes, this._checkedSet) === 'indeterminate'
                : false,
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
        if (!node || !node.hasChildren)
            return;
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
    setExpanded(index, value) {
        const node = this._flatNodes[index];
        if (!node || !node.hasChildren)
            return;
        // 手风琴模式：收起同级其他节点
        if (value && this._options.accordion) {
            this._expandedSet = collapseSiblings(node.id, this._flatNodes, this._expandedSet, this._index.nodeMap);
        }
        if (value) {
            this._expandedSet.add(node.id);
        }
        else {
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
        const newSet = new Set();
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
        this._expandedSet = new Set();
        this._recomputeVisibility();
        this._notify();
    }
    /**
     * 展开到指定深度
     */
    expandToDepth(depth) {
        const newSet = new Set();
        for (const node of this._flatNodes) {
            if (node.hasChildren && node.depth < depth) {
                newSet.add(node.id);
            }
        }
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
        if (!node)
            return;
        if (value) {
            // 批量选中子树
            const start = node.index;
            const end = node.subtreeEnd;
            for (let i = start; i <= end; i++) {
                this._checkedSet.add(this._flatNodes[i].id);
            }
            // 更新祖先
            this._updateAncestorsCheckState(node.parentId);
        }
        else {
            // 批量取消子树
            const start = node.index;
            const end = node.subtreeEnd;
            for (let i = start; i <= end; i++) {
                this._checkedSet.delete(this._flatNodes[i].id);
            }
            // 更新祖先
            this._updateAncestorsCheckState(node.parentId);
        }
        this._notify();
    }
    /**
     * 切换节点勾选状态
     */
    toggleCheck(index) {
        const node = this._flatNodes[index];
        if (!node)
            return;
        this._checkedSet = toggleCheck(node.id, this._flatNodes, this._checkedSet, this._index);
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
        if (!node)
            return 'unchecked';
        return getCheckState(node, this._flatNodes, this._checkedSet);
    }
    _updateAncestorsCheckState(parentId) {
        let currentParentId = parentId;
        while (currentParentId !== null) {
            const parent = this._index.nodeMap.get(currentParentId);
            if (!parent)
                break;
            // 检查所有子节点是否都完全勾选
            let allChildrenFullyChecked = true;
            for (let i = parent.index; i <= parent.subtreeEnd; i++) {
                if (!this._checkedSet.has(this._flatNodes[i].id)) {
                    allChildrenFullyChecked = false;
                    break;
                }
            }
            if (allChildrenFullyChecked) {
                this._checkedSet.add(currentParentId);
            }
            else {
                this._checkedSet.delete(currentParentId);
            }
            currentParentId = parent.parentId;
        }
    }
    // ========== 过滤/搜索操作 ==========
    /**
     * 设置过滤函数
     * @param predicate 返回 true 表示节点应显示
     */
    setFilter(predicate) {
        if (!this._options.filterable || !predicate) {
            this._filterSet = new Set();
            this._matchSet = new Set();
            this._recomputeVisibility();
            this._notify();
            return;
        }
        // 过滤逻辑：匹配节点 + 所有祖先节点
        const matchIds = new Set();
        const filterIds = new Set();
        for (const node of this._flatNodes) {
            if (predicate(node)) {
                matchIds.add(node.id);
                // 向上追溯添加所有祖先
                let parentId = node.parentId;
                while (parentId !== null) {
                    filterIds.add(parentId);
                    const parent = this._index.nodeMap.get(parentId);
                    parentId = parent?.parentId ?? null;
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
    // ========== 导航操作 ==========
    /**
     * 获取下一个匹配节点的位置
     */
    navigateNext(fromVisibleIndex) {
        if (this._matchSet.size === 0)
            return null;
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
        if (this._matchSet.size === 0)
            return null;
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
}
