import type { FileEvent, SourceNode } from './types';

/**
 * 源数据存储
 * 维护真实的目录结构（不压缩）
 */
export class SourceTreeStore {
  /** 所有节点：id → SourceNode */
  nodeMap = new Map<string, SourceNode>();

  /** 子节点映射：parentId → Set<childId> */
  childrenMap = new Map<string | null, Set<string>>();

  /**
   * 添加文件事件
   * @returns 受影响的 folder IDs（子节点数发生变化的 folder）
   */
  addFile(event: FileEvent): Set<string> {
    const affectedFolderIds = new Set<string>();

    // 1. 处理 parent 路径中的所有 folder
    let parentId: string | null = null;

    for (const folder of event.parent) {
      // 如果 folder 不存在，创建它
      if (!this.nodeMap.has(folder.id)) {
        this.nodeMap.set(folder.id, {
          id: folder.id,
          name: folder.name,
          parentId,
          nodeType: 'folder'
        });

        // 添加到 parent 的 children 中
        const siblings = this.childrenMap.get(parentId) ?? new Set();
        const prevSize = siblings.size;
        siblings.add(folder.id);
        this.childrenMap.set(parentId, siblings);

        // 如果子节点数从 1 变成 2+，标记 parent 受影响
        if (prevSize === 1 && siblings.size === 2) {
          // parentId 是当前 folder 的父节点
          if (parentId !== null) {
            affectedFolderIds.add(parentId);
          }
        }
      }

      parentId = folder.id;
    }

    // 2. 创建文件节点
    if (!this.nodeMap.has(event.id)) {
      this.nodeMap.set(event.id, {
        id: event.id,
        name: event.name,
        parentId,
        nodeType: 'file'
      });

      // 添加到 parent 的 children 中
      const siblings = this.childrenMap.get(parentId) ?? new Set();
      const prevSize = siblings.size;
      siblings.add(event.id);
      this.childrenMap.set(parentId, siblings);

      // 如果子节点数从 1 变成 2+，标记 parent 受影响
      if (prevSize === 1 && siblings.size === 2) {
        if (parentId !== null) {
          affectedFolderIds.add(parentId);
        }
      }
    }

    return affectedFolderIds;
  }

  /**
   * 获取节点的直接子节点 IDs
   */
  getChildrenIds(parentId: string | null): string[] {
    const children = this.childrenMap.get(parentId);
    return children ? Array.from(children) : [];
  }

  /**
   * 获取节点
   */
  getNode(id: string): SourceNode | undefined {
    return this.nodeMap.get(id);
  }

  /**
   * 获取根节点 IDs
   */
  getRootIds(): string[] {
    return this.getChildrenIds(null);
  }

  /**
   * 检查 folder 是否只有一个子节点且是 folder
   */
  hasSingleFolderChild(folderId: string): { single: boolean; childId?: string } {
    const children = this.childrenMap.get(folderId);
    if (!children || children.size !== 1) {
      return { single: false };
    }

    const childId = Array.from(children)[0];
    const child = this.nodeMap.get(childId);
    if (!child || child.nodeType !== 'folder') {
      return { single: false };
    }

    return { single: true, childId };
  }

  /**
   * 清空所有数据
   */
  clear(): void {
    this.nodeMap.clear();
    this.childrenMap.clear();
  }
}
