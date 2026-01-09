import type { FlatNode, TreeIndex, CheckState } from '../types';

/**
 * 切换节点勾选状态
 * 规则：勾选/取消会同时影响整棵子树
 */
export function toggleCheck(
  nodeId: string,
  flatNodes: FlatNode[],
  checkedSet: Set<string>,
  index: TreeIndex
): Set<string> {
  const newSet = new Set(checkedSet);
  const node = index.nodeMap.get(nodeId);
  if (!node) return newSet;

  const isCurrentlyChecked = newSet.has(nodeId);

  // 批量操作子树：利用 subtreeEnd，不递归
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

  // 更新祖先节点状态
  updateAncestorsCheckState(node.parentId, flatNodes, newSet, index);

  return newSet;
}

/**
 * 更新祖先节点的勾选状态
 * 规则：
 *   - 所有子节点都勾选 → 父节点勾选
 *   - 否则 → 父节点取消（半选由 UI 计算）
 */
export function updateAncestorsCheckState(
  parentId: string | null,
  flatNodes: FlatNode[],
  checkedSet: Set<string>,
  index: TreeIndex
): void {
  let currentParentId = parentId;

  while (currentParentId !== null) {
    const parent = index.nodeMap.get(currentParentId);
    if (!parent) break;

    // 检查所有子节点是否都完全勾选
    const allChildrenFullyChecked = isSubtreeFullyChecked(parent, flatNodes, checkedSet);

    if (allChildrenFullyChecked) {
      checkedSet.add(currentParentId);
    } else {
      checkedSet.delete(currentParentId);
    }

    currentParentId = parent.parentId;
  }
}

/**
 * 检查子树是否完全勾选（利用 subtreeEnd 遍历连续区间）
 */
function isSubtreeFullyChecked(
  node: FlatNode,
  flatNodes: FlatNode[],
  checkedSet: Set<string>
): boolean {
  for (let i = node.index; i <= node.subtreeEnd; i++) {
    if (!checkedSet.has(flatNodes[i].id)) {
      return false;
    }
  }
  return true;
}

/**
 * 检查子树是否有任何节点勾选
 */
function isSubtreeHasAnyChecked(
  node: FlatNode,
  flatNodes: FlatNode[],
  checkedSet: Set<string>
): boolean {
  for (let i = node.index + 1; i <= node.subtreeEnd; i++) {
    if (checkedSet.has(flatNodes[i].id)) {
      return true;
    }
  }
  return false;
}

/**
 * 获取单个节点的显示状态（只在渲染时调用）
 */
export function getCheckState(
  node: FlatNode,
  flatNodes: FlatNode[],
  checkedSet: Set<string>
): CheckState {
  // 自身已勾选
  if (checkedSet.has(node.id)) {
    return 'checked';
  }

  // 无子节点
  if (!node.hasChildren) {
    return 'unchecked';
  }

  // 检查子树是否有任何勾选（半选判断）
  if (isSubtreeHasAnyChecked(node, flatNodes, checkedSet)) {
    return 'indeterminate';
  }

  return 'unchecked';
}

/**
 * 批量选中节点
 */
export function checkNodes(
  nodeIds: string[],
  flatNodes: FlatNode[],
  checkedSet: Set<string>,
  index: TreeIndex
): Set<string> {
  const newSet = new Set(checkedSet);

  for (const nodeId of nodeIds) {
    const node = index.nodeMap.get(nodeId);
    if (!node) continue;

    // 选中整棵子树
    for (let i = node.index; i <= node.subtreeEnd; i++) {
      newSet.add(flatNodes[i].id);
    }
  }

  // 更新所有涉及的祖先
  const processedAncestors = new Set<string | null>();
  for (const nodeId of nodeIds) {
    const node = index.nodeMap.get(nodeId);
    if (!node) continue;

    // 只处理未处理过的祖先根节点
    if (node.parentId && !processedAncestors.has(node.parentId)) {
      updateAncestorsCheckState(node.parentId, flatNodes, newSet, index);
      processedAncestors.add(node.parentId);
    }
  }

  return newSet;
}

/**
 * 批量取消选中节点
 */
export function uncheckNodes(
  nodeIds: string[],
  flatNodes: FlatNode[],
  checkedSet: Set<string>,
  index: TreeIndex
): Set<string> {
  const newSet = new Set(checkedSet);

  for (const nodeId of nodeIds) {
    const node = index.nodeMap.get(nodeId);
    if (!node) continue;

    // 取消整棵子树
    for (let i = node.index; i <= node.subtreeEnd; i++) {
      newSet.delete(flatNodes[i].id);
    }

    // 取消所有祖先
    let currentParentId = node.parentId;
    while (currentParentId !== null) {
      newSet.delete(currentParentId);
      const parent = index.nodeMap.get(currentParentId);
      if (!parent) break;
      currentParentId = parent.parentId;
    }
  }

  return newSet;
}

/**
 * 全选
 */
export function checkAll(flatNodes: FlatNode[]): Set<string> {
  return new Set(flatNodes.map((n) => n.id));
}

/**
 * 全不选
 */
export function uncheckAll(): Set<string> {
  return new Set();
}

/**
 * 获取所有已选中的叶子节点 ID
 */
export function getCheckedLeafIDs(flatNodes: FlatNode[], checkedSet: Set<string>): string[] {
  return flatNodes.filter((n) => !n.hasChildren && checkedSet.has(n.id)).map((n) => n.id);
}
