interface FieldMapper {
    /** 节点唯一标识字段名，默认 'id' */
    id?: string;
    /** 父节点标识字段名，默认 'parentId' */
    parentId?: string;
    /** 节点显示名称字段名，默认 'name' */
    name?: string;
    /** 子节点列表字段名，默认 'children'（可选） */
    children?: string;
}
interface RawNode {
    [key: string]: unknown;
    id: string;
    name: string;
    parentId: string | null;
}
interface FlatNode {
    id: string;
    name: string;
    parentId: string | null;
    depth: number;
    index: number;
    subtreeEnd: number;
    hasChildren: boolean;
}
interface TreeIndex {
    nodeMap: Map<string, FlatNode>;
    indexMap: Map<string, number>;
    childrenMap: Map<string | null, string[]>;
    rootIds: string[];
}
type CheckState = 'checked' | 'unchecked' | 'indeterminate';
interface TreeOptions {
    /** 启用 checkbox 功能 */
    checkable?: boolean;
    /** 手风琴模式（同级只展开一个） */
    accordion?: boolean;
    /** 启用过滤/搜索功能 */
    filterable?: boolean;
    /** 启用搜索功能（Web Worker 异步搜索） */
    searchable?: boolean;
    /** 默认展开的节点 ID 列表 */
    defaultExpandedIds?: string[];
    /** 默认勾选的节点 ID 列表（checkbox） */
    defaultCheckedIds?: string[];
    /** checkStrictly 模式：父子勾选不再联动，无半选状态 */
    checkStrictly?: boolean;
    /** 默认选中的节点 ID（单选，只取第一个） */
    defaultSelectedIds?: string[];
    /** 字段映射配置 */
    fieldMapper?: FieldMapper;
}
declare const defaultTreeOptions: Required<TreeOptions>;
interface NodeStatus {
    isExpanded: boolean;
    isChecked: boolean;
    isIndeterminate: boolean;
    isVisible: boolean;
    visibleIndex: number;
}

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
declare class TreeEngine {
    private _flatNodes;
    private _index;
    private _expandedSet;
    private _checkedSet;
    private _selectedId;
    private _filterSet;
    private _matchSet;
    private _options;
    private _fieldMapper;
    private _subscribers;
    private _batchMode;
    private _pendingNotify;
    private _visibleList;
    private _visibleIndexMap;
    constructor(options?: TreeOptions);
    get flatNodes(): readonly FlatNode[];
    get index(): TreeIndex;
    get visibleList(): readonly FlatNode[];
    get totalCount(): number;
    get visibleCount(): number;
    get checkedCount(): number;
    get expandedSet(): ReadonlySet<string>;
    get checkedSet(): ReadonlySet<string>;
    get matchSet(): ReadonlySet<string>;
    get filterSet(): ReadonlySet<string>;
    get isAccordionMode(): boolean;
    get isCheckStrictly(): boolean;
    /** 当前选中的节点 ID（单选） */
    get selectedId(): string | null;
    /**
     * 初始化树数据
     * @param rawNodes 原始节点数据
     * @param fieldMapper 字段映射配置（可选，使用构造函数中的配置）
     */
    init(rawNodes: RawNode[], fieldMapper?: FieldMapper): void;
    /**
     * 更新配置
     */
    setOptions(options: Partial<TreeOptions>): void;
    /**
     * 订阅状态变化
     * @returns 取消订阅函数
     */
    subscribe(fn: () => void): () => void;
    /**
     * 开启事务模式
     * 在事务模式下，多次状态变更会合并为一次通知
     */
    startBatch(): void;
    /**
     * 提交事务
     * 合并所有pending的状态变更并通知订阅者
     */
    commit(): void;
    /**
     * 在事务中执行操作
     * @example
     * engine.batch(() => {
     *   engine.expandAll();
     *   engine.checkAll();
     * });
     */
    batch(fn: () => void): void;
    private _notify;
    private _notifySubscribers;
    private _recomputeVisibility;
    /**
     * 根据 id 获取节点
     */
    getNode(nodeId: string): FlatNode | undefined;
    /**
     * 根据 visibleIndex 获取节点
     */
    getNodeByVisibleIndex(visibleIndex: number): FlatNode | undefined;
    /**
     * 根据 visibleIndex 获取对应的 flatIndex（用于引擎操作）
     * @returns flatIndex，如果找不到返回 -1
     */
    getFlatIndexByVisibleIndex(visibleIndex: number): number;
    /**
     * 获取节点在可见列表中的索引
     */
    getVisibleIndex(nodeId: string): number | -1;
    /**
     * 获取节点状态（供 UI 渲染使用）
     */
    getNodeStatus(nodeId: string): NodeStatus | null;
    /**
     * 切换节点展开状态
     */
    toggle(index: number): void;
    /**
     * 设置节点展开状态
     */
    setExpanded(index: number, value: boolean): void;
    /**
     * 展开到指定节点（展开所有祖先）
     */
    expandToNode(nodeId: string): void;
    /**
     * 展开所有节点
     */
    expandAll(): void;
    /**
     * 折叠所有节点
     */
    collapseAll(): void;
    /**
     * 展开到指定深度
     */
    expandToDepth(depth: number): void;
    /**
     * 直接设置展开集合（用于搜索结果定位等场景）
     */
    setExpandedSet(newSet: Set<string>): void;
    /**
     * 设置节点勾选状态
     */
    setChecked(index: number, value: boolean): void;
    /**
     * 切换节点勾选状态
     */
    toggleCheck(index: number): void;
    /**
     * 全选
     */
    checkAll(): void;
    /**
     * 全不选
     */
    uncheckAll(): void;
    /**
     * 获取所有已选中的叶子节点 ID
     */
    getCheckedLeafIds(): string[];
    /**
     * 获取节点的勾选状态
     */
    getCheckState(index: number): CheckState;
    /**
     * 根据节点 ID 获取勾选状态（供 UI 层使用）
     */
    getCheckStateByNodeId(nodeId: string): CheckState;
    private _updateAncestorsCheckState;
    /**
     * 设置过滤函数
     * @param predicate 返回 true 表示节点应显示
     */
    setFilter(predicate: ((node: FlatNode) => boolean) | null): void;
    /**
     * 设置搜索关键词（使用内置过滤）
     */
    setSearch(query: string): void;
    /**
     * 检查节点是否匹配搜索/过滤
     */
    isMatch(nodeId: string): boolean;
    /**
     * 清除过滤/搜索
     */
    clearFilter(): void;
    /**
     * 直接设置搜索匹配结果（用于异步搜索，如 Web Worker）
     * @param matchIds 匹配的节点 ID 集合
     * @param expandIds 需要展开的祖先节点 ID 集合
     */
    setMatchResult(matchIds: Set<string>, expandIds: Set<string>): void;
    /**
     * 获取下一个匹配节点的位置
     */
    navigateNext(fromVisibleIndex?: number): number | null;
    /**
     * 获取上一个匹配节点的位置
     */
    navigatePrev(fromVisibleIndex?: number): number | null;
    /**
     * 获取匹配节点的总数
     */
    get matchCount(): number;
    /**
     * 选中指定节点（单选）
     */
    select(nodeId: string | null): void;
    /**
     * 清除选中
     */
    clearSelection(): void;
}

/**
 * 将邻接表转换为扁平化数组 + 索引结构
 * 时间复杂度: O(n)，空间复杂度: O(n)
 *
 * @param rawNodes 原始节点数据（邻接表格式）
 * @param fieldMapper 字段映射配置（可选，默认使用 id/parentId/name）
 */
declare function buildFlatTree(rawNodes: RawNode[], fieldMapper?: FieldMapper): {
    flatNodes: FlatNode[];
    index: TreeIndex;
};
/**
 * 获取节点的所有祖先 ID（从父节点到根节点）
 */
declare function getAncestorIds(nodeId: string, index: TreeIndex): string[];
/**
 * 获取节点的所有祖先 ID 集合
 */
declare function getAncestorSet(nodeId: string, index: TreeIndex): Set<string>;
/**
 * 获取子树中所有节点 ID（利用 subtreeEnd）
 */
declare function getSubtreeIds(nodeId: string, flatNodes: FlatNode[], index: TreeIndex): string[];

/**
 * 计算可见节点列表
 * 利用 subtreeEnd 跳过折叠的子树，时间复杂度 O(visibleCount)
 */
declare function computeVisibleNodes(flatNodes: FlatNode[], expandedSet: Set<string>): FlatNode[];
/**
 * 计算过滤后的可见节点列表（搜索模式）
 * 只显示匹配节点 + 其祖先路径
 */
declare function computeFilteredVisibleNodes(flatNodes: FlatNode[], expandedSet: Set<string>, filterSet: Set<string>): FlatNode[];
/**
 * 切换节点展开状态
 */
declare function toggleExpand(nodeId: string, expandedSet: Set<string>): Set<string>;
/**
 * 展开到指定节点（展开所有祖先）
 */
declare function expandToNode(nodeId: string, expandedSet: Set<string>, nodeMap: Map<string, FlatNode>): Set<string>;
/**
 * 展开多个节点（用于搜索结果定位）
 */
declare function expandMultiple(nodeIds: Iterable<string>, expandedSet: Set<string>): Set<string>;
/**
 * 收起同级其他节点（手风琴模式）
 */
declare function collapseSiblings(nodeId: string, flatNodes: FlatNode[], expandedSet: Set<string>, nodeMap: Map<string, FlatNode>): Set<string>;

/**
 * 切换节点勾选状态
 * 规则：勾选/取消会同时影响整棵子树
 */
declare function toggleCheck(nodeId: string, flatNodes: FlatNode[], checkedSet: Set<string>, index: TreeIndex): Set<string>;
/**
 * 获取单个节点的显示状态（只在渲染时调用）
 */
declare function getCheckState(node: FlatNode, flatNodes: FlatNode[], checkedSet: Set<string>): CheckState;
/**
 * 全选
 */
declare function checkAll(flatNodes: FlatNode[]): Set<string>;
/**
 * 全不选
 */
declare function uncheckAll(): Set<string>;
/**
 * 获取所有已选中的叶子节点 ID
 */
declare function getCheckedLeafIds(flatNodes: FlatNode[], checkedSet: Set<string>): string[];

/**
 * 虚拟列表状态
 */
interface VirtualListState {
    startIndex: number;
    endIndex: number;
    offsetTop: number;
}
/**
 * 虚拟列表控制器
 * 使用 IntersectionObserver 实现高性能虚拟滚动
 */
declare class VirtualListController<T = FlatNode> {
    private container;
    private topSentinel;
    private bottomSentinel;
    private observer;
    private itemHeight;
    private bufferSize;
    private visibleList;
    private state;
    private onStateChange;
    private scrollHandler;
    constructor(options: {
        itemHeight: number;
        bufferSize?: number;
        onStateChange: (state: VirtualListState) => void;
    });
    /**
     * 初始化
     */
    init(container: HTMLElement, topSentinel: HTMLElement, bottomSentinel: HTMLElement): void;
    /**
     * 更新可见列表
     */
    updateVisibleList(list: T[]): void;
    /**
     * 查找节点索引的回调（用于 scrollToNode）
     */
    private findIndexById;
    /**
     * 设置查找节点索引的回调（用于 scrollToNode）
     */
    setFindIndexById(fn: (id: string) => number): void;
    /**
     * 处理交叉观察
     */
    private handleIntersection;
    /**
     * 重新计算渲染范围
     */
    private recalculate;
    /**
     * 滚动到指定节点（需要先设置 setFindIndexById）
     */
    scrollToNode(nodeId: string): void;
    /**
     * 滚动到指定索引
     */
    scrollToIndex(index: number): void;
    /**
     * 滚动到顶部
     */
    scrollToTop(): void;
    /**
     * 滚动到底部
     */
    scrollToBottom(): void;
    /**
     * 获取当前状态
     */
    getState(): VirtualListState;
    /**
     * 获取总高度
     */
    getTotalHeight(): number;
    /**
     * 销毁
     */
    destroy(): void;
}
/**
 * 简化版：基于 scroll 事件的虚拟列表计算
 * 适用于不需要 IntersectionObserver 的场景
 */
declare function calculateVisibleRange(scrollTop: number, viewportHeight: number, itemHeight: number, totalCount: number, bufferSize?: number): VirtualListState;

interface SearchResult {
    matchIds: Set<string>;
    expandIds: Set<string>;
}
type SearchCallback = (result: SearchResult) => void;
/**
 * 搜索控制器
 * 管理 Web Worker 通信和防抖
 */
declare class SearchController {
    private worker;
    private debounceTimer;
    private debounceMs;
    private onResult;
    private isReady;
    private pendingSearch;
    constructor(options: {
        debounceMs?: number;
        onResult: SearchCallback;
    });
    /**
     * 初始化 Worker
     * @param searchData 搜索数据，需要包含 id, name, parentId 字段
     */
    init(searchData: Array<{
        id: string;
        name: string;
        parentId: string | null;
    }>, workerUrl?: string): void;
    /**
     * 执行搜索（带防抖）
     */
    search(keyword: string): void;
    /**
     * 立即搜索（不防抖）
     */
    searchImmediate(keyword: string): void;
    /**
     * 清除搜索
     */
    clear(): void;
    /**
     * 检查是否就绪
     */
    get ready(): boolean;
    /**
     * 销毁
     */
    destroy(): void;
}
/**
 * 同步搜索（用于数据量较小或不支持 Worker 的场景）
 * 直接在主线程执行，适用于 < 5000 节点
 */
declare function searchSync(keyword: string, nodes: Array<{
    id: string;
    name: string;
    parentId: string | null;
}>): SearchResult;

/**
 * 搜索配置
 */
interface SearchConfig {
    /** 是否启用搜索结果跳转导航（关闭时不初始化导航相关逻辑） */
    enableNavigation: boolean;
    /** 上一个/下一个是否支持循环（关闭时到边界返回 false） */
    enableLoop: boolean;
    /** 是否提供计数（current/total） */
    showCount: boolean;
    /** 搜索防抖时间（ms） */
    debounceMs: number;
}
/**
 * 默认配置
 */
declare const defaultSearchConfig: SearchConfig;
/**
 * 创建搜索配置（合并默认值）
 */
declare function createSearchConfig(overrides?: Partial<SearchConfig>): SearchConfig;

export { type CheckState, type FieldMapper, type FlatNode, type NodeStatus, type RawNode, type SearchConfig, SearchController, type SearchResult, TreeEngine, type TreeIndex, type TreeOptions, VirtualListController, type VirtualListState, buildFlatTree, calculateVisibleRange, checkAll, collapseSiblings, computeFilteredVisibleNodes, computeVisibleNodes, createSearchConfig, defaultSearchConfig, defaultTreeOptions, expandMultiple, expandToNode, getAncestorIds, getAncestorSet, getCheckState, getCheckedLeafIds, getCheckState as getNodeCheckState, getSubtreeIds, searchSync, toggleCheck, toggleExpand, uncheckAll };
