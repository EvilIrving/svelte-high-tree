import type { DisplayNode, FlatDisplayNode, DisplayTreeIndex } from './types';

/**
 * 将 DisplayNode 数组转换为扁平化结构（带 subtreeEnd）
 * 复用现有 Tree 组件的 DFS 遍历算法
 */
export function flattenDisplayNodes(displayNodes: DisplayNode[]): {
  flatNodes: FlatDisplayNode[];
  index: DisplayTreeIndex;
} {
  // Step 1: 构建 displayChildrenMap
  const displayChildrenMap = new Map<string | null, string[]>();

  for (const node of displayNodes) {
    const siblings = displayChildrenMap.get(node.parentDisplayId) ?? [];
    siblings.push(node.id);
    displayChildrenMap.set(node.parentDisplayId, siblings);
  }

  // 创建 displayNodeMap 用于快速查找
  const displayNodeMap = new Map<string, DisplayNode>();
  for (const node of displayNodes) {
    displayNodeMap.set(node.id, node);
  }

  const rootIds = displayChildrenMap.get(null) ?? [];

  // Step 2: 迭代 DFS 生成 FlatDisplayNode（计算 subtreeEnd）
  const flatNodes: FlatDisplayNode[] = [];
  const nodeMap = new Map<string, FlatDisplayNode>();
  const indexMap = new Map<string, number>();

  interface StackItem {
    id: string;
    phase: 'enter' | 'exit';
  }

  const stack: StackItem[] = [];

  // 逆序压入根节点
  for (let i = rootIds.length - 1; i >= 0; i--) {
    stack.push({ id: rootIds[i], phase: 'enter' });
  }

  while (stack.length > 0) {
    const { id, phase } = stack.pop()!;

    if (phase === 'enter') {
      const displayNode = displayNodeMap.get(id)!;
      const index = flatNodes.length;

      // 判断是否有子节点
      const childrenIds = displayChildrenMap.get(id) ?? [];
      const hasChildren = childrenIds.length > 0;

      const flatNode: FlatDisplayNode = {
        id: displayNode.id,
        name: displayNode.displayName,
        parentId: displayNode.parentDisplayId,
        depth: displayNode.depth,
        index,
        subtreeEnd: index, // 先设为自己，后面更新
        hasChildren,
        nodeType: displayNode.nodeType,
        sourceIds: displayNode.sourceIds
      };

      flatNodes.push(flatNode);
      nodeMap.set(id, flatNode);
      indexMap.set(id, index);

      // 压入退出标记
      stack.push({ id, phase: 'exit' });

      // 逆序压入子节点
      for (let i = childrenIds.length - 1; i >= 0; i--) {
        stack.push({ id: childrenIds[i], phase: 'enter' });
      }
    } else {
      // 退出节点：更新 subtreeEnd
      const node = nodeMap.get(id)!;
      node.subtreeEnd = flatNodes.length - 1;
    }
  }

  return {
    flatNodes,
    index: {
      nodeMap,
      indexMap,
      childrenMap: displayChildrenMap,
      rootIds
    }
  };
}

/**
 * 计算可见节点列表
 * 复用现有 Tree 组件的可见性计算逻辑
 */
export function computeVisibleDisplayNodes(
  flatNodes: FlatDisplayNode[],
  expandedSet: Set<string>
): FlatDisplayNode[] {
  const visible: FlatDisplayNode[] = [];
  let i = 0;

  while (i < flatNodes.length) {
    const node = flatNodes[i];
    visible.push(node);

    // 如果有子节点且未展开，跳过整个子树
    if (node.hasChildren && !expandedSet.has(node.id)) {
      i = node.subtreeEnd + 1;
    } else {
      i++;
    }
  }

  return visible;
}
