import type { FlatNode } from '../types';
/**
 * 计算可见节点列表
 * 利用 subtreeEnd 跳过折叠的子树，时间复杂度 O(visibleCount)
 */
export declare function computeVisibleNodes(flatNodes: FlatNode[], expandedSet: Set<string>): FlatNode[];
/**
 * 计算过滤后的可见节点列表（搜索模式）
 * 只显示匹配节点 + 其祖先路径
 */
export declare function computeFilteredVisibleNodes(flatNodes: FlatNode[], expandedSet: Set<string>, filterSet: Set<string>): FlatNode[];
/**
 * 切换节点展开状态
 */
export declare function toggleExpand(nodeId: string, expandedSet: Set<string>): Set<string>;
/**
 * 展开到指定节点（展开所有祖先）
 */
export declare function expandToNode(nodeId: string, expandedSet: Set<string>, nodeMap: Map<string, FlatNode>): Set<string>;
/**
 * 展开/收起整棵子树
 * 利用 subtreeEnd 批量操作
 */
export declare function toggleSubtree(nodeId: string, expand: boolean, flatNodes: FlatNode[], expandedSet: Set<string>, nodeMap: Map<string, FlatNode>): Set<string>;
/**
 * 展开多个节点（用于搜索结果定位）
 */
export declare function expandMultiple(nodeIds: Iterable<string>, expandedSet: Set<string>): Set<string>;
/**
 * 收起同级其他节点（手风琴模式）
 */
export declare function collapseSiblings(nodeId: string, flatNodes: FlatNode[], expandedSet: Set<string>, nodeMap: Map<string, FlatNode>): Set<string>;
