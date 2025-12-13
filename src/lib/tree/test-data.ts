import type { RawNode } from './types';

/**
 * 生成测试用的树形数据
 * @param totalNodes 总节点数
 * @param maxDepth 最大深度
 * @param maxChildren 每个节点最大子节点数
 */
export function generateTestData(
  totalNodes: number,
  maxDepth: number = 5,
  maxChildren: number = 10
): RawNode[] {
  const nodes: RawNode[] = [];
  let nodeId = 0;

  function createNode(parentId: string | null, depth: number): void {
    if (nodeId >= totalNodes) return;

    const id = `node_${nodeId++}`;
    nodes.push({
      id,
      name: `Node ${id.replace('node_', '')} - Level ${depth}`,
      parentId
    });

    // 如果还没到最大深度，创建子节点
    if (depth < maxDepth && nodeId < totalNodes) {
      const childCount = Math.min(
        Math.floor(Math.random() * maxChildren) + 1,
        totalNodes - nodeId
      );

      for (let i = 0; i < childCount && nodeId < totalNodes; i++) {
        createNode(id, depth + 1);
      }
    }
  }

  // 创建多个根节点
  const rootCount = Math.min(Math.floor(Math.random() * 5) + 3, totalNodes);
  for (let i = 0; i < rootCount && nodeId < totalNodes; i++) {
    createNode(null, 0);
  }

  return nodes;
}

/**
 * 生成模拟文件系统的测试数据
 */
export function generateFileSystemData(totalNodes: number): RawNode[] {
  const nodes: RawNode[] = [];
  let nodeId = 0;

  const folders = ['src', 'lib', 'components', 'utils', 'hooks', 'styles', 'assets', 'types'];
  const files = ['index', 'main', 'App', 'config', 'constants', 'helpers', 'api', 'store'];
  const extensions = ['.ts', '.tsx', '.js', '.jsx', '.svelte', '.css', '.json', '.md'];

  function createFolder(parentId: string | null, depth: number, path: string): void {
    if (nodeId >= totalNodes) return;

    const folderName = folders[Math.floor(Math.random() * folders.length)];
    const id = `folder_${nodeId++}`;
    const fullPath = path ? `${path}/${folderName}` : folderName;

    nodes.push({
      id,
      name: folderName,
      parentId
    });

    // 创建子文件夹
    if (depth < 4 && nodeId < totalNodes) {
      const subFolderCount = Math.floor(Math.random() * 3) + 1;
      for (let i = 0; i < subFolderCount && nodeId < totalNodes; i++) {
        createFolder(id, depth + 1, fullPath);
      }
    }

    // 创建文件
    const fileCount = Math.floor(Math.random() * 5) + 1;
    for (let i = 0; i < fileCount && nodeId < totalNodes; i++) {
      const fileName = files[Math.floor(Math.random() * files.length)];
      const ext = extensions[Math.floor(Math.random() * extensions.length)];
      const fileId = `file_${nodeId++}`;

      nodes.push({
        id: fileId,
        name: `${fileName}${ext}`,
        parentId: id
      });
    }
  }

  // 创建根目录
  const rootFolderCount = Math.min(5, totalNodes);
  for (let i = 0; i < rootFolderCount && nodeId < totalNodes; i++) {
    createFolder(null, 0, '');
  }

  return nodes;
}

/**
 * 生成有序的测试数据（方便验证）
 */
export function generateOrderedTestData(
  nodeCount: number,
  branchingFactor: number = 3,
  maxDepth: number = 10
): RawNode[] {
  const nodes: RawNode[] = [];
  let currentId = 0;

  function generate(parentId: string | null, depth: number): void {
    if (currentId >= nodeCount) return;

    const id = String(currentId++);
    nodes.push({
      id,
      name: `Node-${id.padStart(5, '0')}`,
      parentId
    });

    if (depth < maxDepth) {
      for (let i = 0; i < branchingFactor && currentId < nodeCount; i++) {
        generate(id, depth + 1);
      }
    }
  }

  // 创建多个根
  for (let i = 0; i < branchingFactor && currentId < nodeCount; i++) {
    generate(null, 0);
  }

  return nodes;
}
