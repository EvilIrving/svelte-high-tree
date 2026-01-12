import type { TreeNode, TreeIndex } from '../core/types';
import { getAncestorIDs } from './flatten';

/**
 * 计算可见节点列表
 * 利用 subtreeEnd 跳过折叠的子树，时间复杂度 O(visibleCount)
 */
export function computeVisibleNodes(
  flatNodes: TreeNode[],
  expandedSet: Set<string>
): TreeNode[] {
  const visible: TreeNode[] = [];
  let i = 0;

  while (i < flatNodes.length) {
    const node = flatNodes[i];
    visible.push(node);

    if (node.hasChildren && !expandedSet.has(node.id)) {
      // 节点未展开 → 跳过整个子树
      i = node.subtreeEnd + 1;
    } else {
      // 节点已展开或无子节点 → 继续下一个
      i++;
    }
  }

  return visible;
}

/**
 * 计算过滤后的可见节点列表（搜索模式）
 * 只显示匹配节点 + 其祖先路径
 */
export function computeFilteredVisibleNodes(
  flatNodes: TreeNode[],
  expandedSet: Set<string>,
  filterSet: Set<string>
): TreeNode[] {
  // 如果没有过滤条件，走正常逻辑
  if (filterSet.size === 0) {
    return computeVisibleNodes(flatNodes, expandedSet);
  }

  const visible: TreeNode[] = [];
  let i = 0;

  while (i < flatNodes.length) {
    const node = flatNodes[i];

    // 只显示在过滤集合中的节点
    if (filterSet.has(node.id)) {
      visible.push(node);

      // 如果节点未展开或不在展开集合中，跳过子树
      if (node.hasChildren && !expandedSet.has(node.id)) {
        i = node.subtreeEnd + 1;
      } else {
        i++;
      }
    } else {
      // 不在过滤集合中，跳过整个子树
      i = node.subtreeEnd + 1;
    }
  }

  return visible;
}

/**
 * 切换节点展开状态
 */
export function toggleExpand(nodeId: string, expandedSet: Set<string>): Set<string> {
  const newSet = new Set(expandedSet);

  if (newSet.has(nodeId)) {
    newSet.delete(nodeId);
  } else {
    newSet.add(nodeId);
  }

  return newSet;
}

/**
 * 展开到指定节点（展开所有祖先）
 */
export function expandToNode(
  nodeId: string,
  expandedSet: Set<string>,
  nodeMap: Map<string, TreeNode>
): Set<string> {
  const newSet = new Set(expandedSet);
  if (!nodeMap.has(nodeId)) return newSet;

  // 展开所有祖先
  const ancestors = getAncestorIDs(nodeId, { nodeMap } as TreeIndex);
  for (const id of ancestors) {
    newSet.add(id);
  }

  return newSet;
}

/**
 * 展开/收起整棵子树
 * 利用 subtreeEnd 批量操作
 */
export function toggleSubtree(
  nodeId: string,
  expand: boolean,
  flatNodes: TreeNode[],
  expandedSet: Set<string>,
  nodeMap: Map<string, TreeNode>
): Set<string> {
  const newSet = new Set(expandedSet);
  const node = nodeMap.get(nodeId);
  if (!node) return newSet;

  // 获取子树范围 [index, subtreeEnd]
  const start = node.index;
  const end = node.subtreeEnd;

  // 批量操作：不递归，直接遍历连续区间
  for (let i = start; i <= end; i++) {
    const n = flatNodes[i];
    if (n.hasChildren) {
      if (expand) {
        newSet.add(n.id);
      } else {
        newSet.delete(n.id);
      }
    }
  }

  return newSet;
}

/**
 * 展开多个节点（用于搜索结果定位）
 */
export function expandMultiple(nodeIds: Iterable<string>, expandedSet: Set<string>): Set<string> {
  return new Set([...expandedSet, ...nodeIds]);
}

/**
 * 收起同级其他节点（手风琴模式）
 */
export function collapseSiblings(
  nodeId: string,
  flatNodes: TreeNode[],
  expandedSet: Set<string>,
  nodeMap: Map<string, TreeNode>
): Set<string> {
  const newSet = new Set(expandedSet);
  const node = nodeMap.get(nodeId);
  if (!node || node.parentId === null) return newSet; // 根节点无同级

  // 找到父节点的所有子节点
  const parent = nodeMap.get(node.parentId);
  if (!parent) return newSet;

  // 遍历父节点的直接子节点，收起除当前节点外的其他节点
  for (let i = parent.index + 1; i <= parent.subtreeEnd; i++) {
    const sibling = flatNodes[i];
    if (sibling.depth === node.depth + 1 && sibling.id !== nodeId) {
      newSet.delete(sibling.id);
    }
  }

  return newSet;
}
