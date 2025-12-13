import type { FlatNode } from './types';

/**
 * 计算可见节点列表
 * 利用 subtreeEnd 跳过折叠的子树，时间复杂度 O(visibleCount)
 */
export function computeVisibleNodes(flatNodes: FlatNode[], expandedSet: Set<string>): FlatNode[] {
  const visible: FlatNode[] = [];
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
 * @param flatNodes 扁平节点数组
 * @param expandedSet 展开状态集合
 * @param filterSet 过滤匹配集合（匹配节点 + 祖先节点）
 */
export function computeFilteredVisibleNodes(
  flatNodes: FlatNode[],
  expandedSet: Set<string>,
  filterSet: Set<string>
): FlatNode[] {
  // 如果没有过滤条件，走正常逻辑
  if (filterSet.size === 0) {
    return computeVisibleNodes(flatNodes, expandedSet);
  }

  const visible: FlatNode[] = [];
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
  nodeMap: Map<string, FlatNode>
): Set<string> {
  const newSet = new Set(expandedSet);
  const node = nodeMap.get(nodeId);
  if (!node) return newSet;

  // 展开所有祖先
  let currentId = node.parentId;
  while (currentId !== null) {
    newSet.add(currentId);
    const parent = nodeMap.get(currentId);
    if (!parent) break;
    currentId = parent.parentId;
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
  flatNodes: FlatNode[],
  expandedSet: Set<string>,
  nodeMap: Map<string, FlatNode>
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
