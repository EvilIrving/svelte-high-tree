import type { RawNode, FlatNode, TreeIndex, FieldMapper } from '../types';
/**
 * 将邻接表转换为扁平化数组 + 索引结构
 * 时间复杂度: O(n)，空间复杂度: O(n)
 *
 * @param rawNodes 原始节点数据（邻接表格式）
 * @param fieldMapper 字段映射配置（可选，默认使用 id/parentId/name）
 */
export declare function buildFlatTree(rawNodes: RawNode[], fieldMapper?: FieldMapper): {
    flatNodes: FlatNode[];
    index: TreeIndex;
};
/**
 * 获取节点的所有祖先 ID（从父节点到根节点）
 */
export declare function getAncestorIds(nodeId: string, index: TreeIndex): string[];
/**
 * 获取子树中所有节点 ID（利用 subtreeEnd）
 */
export declare function getSubtreeIds(nodeId: string, flatNodes: FlatNode[], index: TreeIndex): string[];
