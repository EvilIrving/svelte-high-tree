import type { RawNode, FlatNode, TreeIndex } from '../types';

/**
 * 将邻接表转换为扁平化数组 + 索引结构
 * 时间复杂度: O(n)，空间复杂度: O(n)
 */
export function buildFlatTree(rawNodes: RawNode[]): {
  flatNodes: FlatNode[];
  index: TreeIndex;
} {
  // Step 1: 构建 childrenMap 和 rawMap
  const childrenMap = new Map<string | null, string[]>();
  const rawMap = new Map<string, RawNode>();

  for (const node of rawNodes) {
    rawMap.set(node.id, node);
    const siblings = childrenMap.get(node.parentId) ?? [];
    siblings.push(node.id);
    childrenMap.set(node.parentId, siblings);
  }

  const rootIds = childrenMap.get(null) ?? [];

  // Step 2: 迭代 DFS 生成 flatNodes（同时计算 subtreeEnd）
  const flatNodes: FlatNode[] = [];
  const nodeMap = new Map<string, FlatNode>();
  const indexMap = new Map<string, number>();

  // 使用栈进行迭代 DFS
  interface StackItem {
    id: string;
    depth: number;
    phase: 'enter' | 'exit';
  }

  const stack: StackItem[] = [];

  // 逆序压入根节点（保证正序处理），栈是 LIFO（后入先出），逆序压入能保证正序处理
  for (let i = rootIds.length - 1; i >= 0; i--) {
    stack.push({ id: rootIds[i], depth: 0, phase: 'enter' });
  }

  while (stack.length > 0) {
    const item = stack.pop()!;
    const { id, depth, phase } = item;

    if (phase === 'enter') {
      // 进入节点：创建 FlatNode
      const raw = rawMap.get(id)!;
      const children = childrenMap.get(id) ?? [];
      const index = flatNodes.length;

      const flatNode: FlatNode = {
        id: raw.id,
        name: raw.name,
        parentId: raw.parentId,
        depth,
        index,
        subtreeEnd: index, // 先设为自己，后面更新
        hasChildren: children.length > 0
      };

      flatNodes.push(flatNode);
      nodeMap.set(id, flatNode);
      indexMap.set(id, index);

      // 压入退出标记
      stack.push({ id, depth, phase: 'exit' });

      // 逆序压入子节点
      for (let i = children.length - 1; i >= 0; i--) {
        stack.push({ id: children[i], depth: depth + 1, phase: 'enter' });
      }
    } else {
      // 退出节点：更新 subtreeEnd
      const node = nodeMap.get(id)!;
      // subtreeEnd = 当前数组最后一个元素的索引
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

/**
 * 获取节点的所有祖先 ID（从父节点到根节点）
 */
export function getAncestorIds(nodeId: string, index: TreeIndex): string[] {
  const ancestors: string[] = [];
  let currentId = index.nodeMap.get(nodeId)?.parentId ?? null;

  while (currentId !== null) {
    ancestors.push(currentId);
    currentId = index.nodeMap.get(currentId)?.parentId ?? null;
  }

  return ancestors;
}

/**
 * 获取子树中所有节点 ID（利用 subtreeEnd）
 */
export function getSubtreeIds(nodeId: string, flatNodes: FlatNode[], index: TreeIndex): string[] {
  const node = index.nodeMap.get(nodeId);
  if (!node) return [];

  const ids: string[] = [];
  for (let i = node.index; i <= node.subtreeEnd; i++) {
    ids.push(flatNodes[i].id);
  }
  return ids;
}
