import type { RawNode, FieldMapper } from '../types';
import { DEFAULT_FIELD_MAPPER } from '../types';
import type { TreeNode, TreeIndex } from '../core/types';

/**
 * 将邻接表转换为扁平化数组 + 索引结构
 * 时间复杂度: O(n)，空间复杂度: O(n)
 *
 * @param rawNodes 原始节点数据（邻接表格式）
 * @param fieldMapper 字段映射配置（可选，默认使用 id/parentId/name）
 */
export function buildFlatTree(
  rawNodes: RawNode[],
  fieldMapper?: FieldMapper
): {
  flatNodes: TreeNode[];
  index: TreeIndex;
} {
  const mapper = { ...DEFAULT_FIELD_MAPPER, ...fieldMapper };
  const idKey = mapper.id;
  const parentIdKey = mapper.parentId;
  const nameKey = mapper.name;
  const iconKey = mapper.icon;

  // Step 1: 构建 childrenMap 和 rawMap
  const childrenMap = new Map<string | null, string[]>();
  const rawMap = new Map<string, RawNode>();

  for (const node of rawNodes) {
    const id = String(node[idKey]);
    const parentId = node[parentIdKey] as string | null;
    rawMap.set(id, node);
    const siblings = childrenMap.get(parentId) ?? [];
    siblings.push(id);
    childrenMap.set(parentId, siblings);
  }

  const rootIds = childrenMap.get(null) ?? [];

  // Step 2: 迭代 DFS 生成 flatNodes（同时计算 subtreeEnd）
  const flatNodes: TreeNode[] = [];
  const nodeMap = new Map<string, TreeNode>();
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
      // 进入节点：创建 TreeNode
      const raw = rawMap.get(id)!;
      const children = childrenMap.get(id) ?? [];
      const index = flatNodes.length;

      const flatNode: TreeNode = {
        id: String(raw[idKey]),
        name: String(raw[nameKey]),
        parentId: raw[parentIdKey] as string | null,
        icon: raw[iconKey] as string | undefined,
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
export function getAncestorIDs(nodeId: string, index: TreeIndex): string[] {
  const ancestors: string[] = [];
  let currentId = index.nodeMap.get(nodeId)?.parentId ?? null;

  while (currentId !== null) {
    ancestors.push(currentId);
    currentId = index.nodeMap.get(currentId)?.parentId ?? null;
  }

  return ancestors;
}

/**
 * 获取节点的所有祖先 ID 集合
 */
export function getAncestorSet(nodeId: string, index: TreeIndex): Set<string> {
  return new Set(getAncestorIDs(nodeId, index));
}

/**
 * 获取子树中所有节点 ID（利用 subtreeEnd）
 */
export function getSubtreeIDs(nodeId: string, flatNodes: TreeNode[], index: TreeIndex): string[] {
  const node = index.nodeMap.get(nodeId);
  if (!node) return [];

  const ids: string[] = [];
  for (let i = node.index; i <= node.subtreeEnd; i++) {
    ids.push(flatNodes[i].id);
  }
  return ids;
}
