// ============ 输入事件（AI 生成的文件信息） ============
export interface FileEvent {
  type: 'file';
  name: string;
  id: string;
  parent: Array<{ type: 'folder'; name: string; id: string }>;
}

// ============ 源节点（真实结构，不压缩） ============
export interface SourceNode {
  id: string;
  name: string;
  parentId: string | null;
  nodeType: 'folder' | 'file';
}

// ============ 展示节点（压缩后） ============
export interface DisplayNode {
  /** 稳定 ID = 压缩链首节点的 sourceId */
  id: string;
  /** 展示名称，如 "A/B/C" 或 "file.md" */
  displayName: string;
  /** 节点类型 */
  nodeType: 'folder' | 'file';
  /** 对应的源节点 ID 列表（压缩链） */
  sourceIds: string[];
  /** 压缩链尾节点 ID（用于查找子节点） */
  tailSourceId: string;
  /** 父展示节点 ID */
  parentDisplayId: string | null;
  /** 层级深度 */
  depth: number;
}

// ============ 扁平化节点（供渲染层使用） ============
export interface FlatDisplayNode {
  id: string;
  name: string;
  parentId: string | null;
  depth: number;
  index: number;
  subtreeEnd: number;
  hasChildren: boolean;
  nodeType: 'folder' | 'file';
  /** 对应的源节点 ID 列表 */
  sourceIds: string[];
}

// ============ 索引结构 ============
export interface DisplayTreeIndex {
  nodeMap: Map<string, FlatDisplayNode>;
  indexMap: Map<string, number>;
  childrenMap: Map<string | null, string[]>;
  rootIds: string[];
}
