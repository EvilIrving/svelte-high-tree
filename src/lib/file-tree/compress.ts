import type { DisplayNode } from './types';
import type { SourceTreeStore } from './source-store';

/**
 * 从某个 source folder 开始，构建压缩链
 * 返回压缩后的 DisplayNode
 */
export function buildCompressedChain(
  startFolderId: string,
  store: SourceTreeStore,
  parentDisplayId: string | null,
  depth: number
): DisplayNode {
  const sourceIds: string[] = [];
  const names: string[] = [];
  let currentId = startFolderId;

  // 沿着单子目录链向下遍历
  while (true) {
    const node = store.getNode(currentId);
    if (!node || node.nodeType !== 'folder') break;

    sourceIds.push(currentId);
    names.push(node.name);

    // 检查是否可以继续压缩
    const { single, childId } = store.hasSingleFolderChild(currentId);
    if (single && childId) {
      currentId = childId;
    } else {
      break;
    }
  }

  return {
    id: startFolderId, // 使用首节点 sourceId 作为稳定 ID
    displayName: names.join('/'),
    nodeType: 'folder',
    sourceIds,
    tailSourceId: sourceIds[sourceIds.length - 1],
    parentDisplayId,
    depth
  };
}

/**
 * 从 source store 构建完整的 DisplayNode 树
 * 全量重建（方案 A）
 */
export function buildDisplayTree(store: SourceTreeStore): DisplayNode[] {
  const displayNodes: DisplayNode[] = [];

  // DFS 遍历，从根节点开始
  interface StackItem {
    sourceId: string;
    parentDisplayId: string | null;
    depth: number;
  }

  const rootIds = store.getRootIds();
  const stack: StackItem[] = [];

  // 逆序压入根节点
  for (let i = rootIds.length - 1; i >= 0; i--) {
    stack.push({
      sourceId: rootIds[i],
      parentDisplayId: null,
      depth: 0
    });
  }

  while (stack.length > 0) {
    const { sourceId, parentDisplayId, depth } = stack.pop()!;
    const node = store.getNode(sourceId);
    if (!node) continue;

    if (node.nodeType === 'file') {
      // 文件节点，直接创建 DisplayNode
      const displayNode: DisplayNode = {
        id: sourceId,
        displayName: node.name,
        nodeType: 'file',
        sourceIds: [sourceId],
        tailSourceId: sourceId,
        parentDisplayId,
        depth
      };
      displayNodes.push(displayNode);
    } else {
      // 文件夹节点，尝试压缩
      const displayNode = buildCompressedChain(sourceId, store, parentDisplayId, depth);
      displayNodes.push(displayNode);

      // 获取压缩链尾节点的子节点，继续遍历
      const childrenIds = store.getChildrenIds(displayNode.tailSourceId);

      // 逆序压入子节点
      for (let i = childrenIds.length - 1; i >= 0; i--) {
        stack.push({
          sourceId: childrenIds[i],
          parentDisplayId: displayNode.id,
          depth: depth + 1
        });
      }
    }
  }

  return displayNodes;
}

/**
 * 获取 sourceId 所属的 DisplayNode ID
 * 需要从 displayNodes 中查找包含该 sourceId 的节点
 */
export function findDisplayIdBySourceId(
  sourceId: string,
  displayNodes: DisplayNode[]
): string | undefined {
  for (const node of displayNodes) {
    if (node.sourceIds.includes(sourceId)) {
      return node.id;
    }
  }
  return undefined;
}
