import type { RawNode, FlatNode, TreeIndex, TreeOptions, NodeStatus, FieldMapper, CheckState } from './types';
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
export declare class TreeEngine {
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
    private _notify;
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
