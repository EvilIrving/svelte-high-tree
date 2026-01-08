import type { FlatNode, TreeIndex, CheckState } from '../types';
/**
 * 切换节点勾选状态
 * 规则：勾选/取消会同时影响整棵子树
 */
export declare function toggleCheck(nodeId: string, flatNodes: FlatNode[], checkedSet: Set<string>, index: TreeIndex): Set<string>;
/**
 * 获取单个节点的显示状态（只在渲染时调用）
 */
export declare function getCheckState(node: FlatNode, flatNodes: FlatNode[], checkedSet: Set<string>): CheckState;
/**
 * 批量选中节点
 */
export declare function checkNodes(nodeIds: string[], flatNodes: FlatNode[], checkedSet: Set<string>, index: TreeIndex): Set<string>;
/**
 * 批量取消选中节点
 */
export declare function uncheckNodes(nodeIds: string[], flatNodes: FlatNode[], checkedSet: Set<string>, index: TreeIndex): Set<string>;
/**
 * 全选
 */
export declare function checkAll(flatNodes: FlatNode[]): Set<string>;
/**
 * 全不选
 */
export declare function uncheckAll(): Set<string>;
/**
 * 获取所有已选中的叶子节点 ID
 */
export declare function getCheckedLeafIds(flatNodes: FlatNode[], checkedSet: Set<string>): string[];
