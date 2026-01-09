// ============ 字段映射配置 ============
export interface FieldMapper {
  /** 节点唯一标识字段名，默认 'id' */
  id?: string;
  /** 父节点标识字段名，默认 'parentId' */
  parentId?: string;
  /** 节点显示名称字段名，默认 'name' */
  name?: string;
  /** 子节点列表字段名，默认 'children'（可选） */
  children?: string;
}

// ============ 原始数据（后端返回） ============
export interface RawNode {
  [key: string]: unknown;
  id: string;
  name: string;
  parentId: string | null;
}

// ============ 扁平化节点（核心结构） ============
export interface FlatNode {
  id: string;
  name: string;
  parentId: string | null;
  depth: number; // 层级深度（根节点为 0）
  index: number; // 在 flatNodes 数组中的索引
  subtreeEnd: number; // 子树结束索引（包含自身）
  hasChildren: boolean; // 是否有子节点
}

// ============ 索引结构（O(1) 查询） ============
export interface TreeIndex {
  // 节点映射：id → FlatNode
  nodeMap: Map<string, FlatNode>;

  // 索引映射：id → 在 flatNodes 中的位置
  indexMap: Map<string, number>;

  // 子节点映射：parentId → 直接子节点 id 列表
  childrenMap: Map<string | null, string[]>;

  // 根节点 ID 列表
  rootIds: string[];
}

// ============ 勾选状态 ============
export type CheckState = 'checked' | 'unchecked' | 'indeterminate';

// ============ 搜索结果 ============
export interface SearchResult {
  matchIds: Set<string>;
  expandIds: Set<string>;
}

// ============ Tree 配置 ============
export interface TreeOptions {
  /** 启用 checkbox 功能 */
  checkable?: boolean;
  /** 手风琴模式（同级只展开一个） */
  accordion?: boolean;
  /** 启用过滤/搜索功能 */
  filterable?: boolean;
  /** 启用搜索功能（Web Worker 异步搜索） */
  searchable?: boolean;
  /** 默认展开的节点 ID 列表 */
  defaultExpandedIds?: string[];
  /** 默认勾选的节点 ID 列表（checkbox） */
  defaultCheckedIds?: string[];
  /** checkStrictly 模式：父子勾选不再联动，无半选状态 */
  checkStrictly?: boolean;
  /** 默认选中的节点 ID（单选，只取第一个） */
  defaultSelectedIds?: string[];
  /** 字段映射配置 */
  fieldMapper?: FieldMapper;
}

// 默认配置常量
export const defaultFieldMapper: Required<FieldMapper> = {
  id: 'id',
  parentId: 'parentId',
  name: 'name',
  children: 'children'
};

export const defaultTreeOptions: Required<TreeOptions> = {
  checkable: false,
  accordion: false,
  filterable: false,
  searchable: false,
  defaultExpandedIds: [],
  defaultCheckedIds: [],
  checkStrictly: false,
  defaultSelectedIds: [],
  fieldMapper: { ...defaultFieldMapper }
};

// ============ 导出节点状态（供 UI 使用） ============
export interface NodeStatus {
  isExpanded: boolean;
  isChecked: boolean;
  isIndeterminate: boolean;
  isVisible: boolean;
  visibleIndex: number;
}
