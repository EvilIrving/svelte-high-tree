import type { FieldMapper } from '../types';
import { DEFAULT_FIELD_MAPPER } from '../types';

/**
 * 树节点
 * 描述树形数据结构中的单个节点
 */
export interface TreeNode {
  /** 节点唯一标识 */
  id: string;
  /** 节点显示名称 */
  name: string;
  /** 父节点 ID，根节点为 null */
  parentId: string | null;
  /** 层级深度（根节点为 0） */
  depth: number;
  /** 在节点列表中的索引位置 */
  index: number;
  /** 子树结束索引（包含自身，用于快速跳过子树） */
  subtreeEnd: number;
  /** 是否有子节点 */
  hasChildren: boolean;
}


// ============ 索引结构（O(1) 查询） ============
export interface TreeIndex {
  // 节点映射：id → TreeNode
  nodeMap: Map<string, TreeNode>;

  // 索引映射：id → 在 flatNodes 中的位置
  indexMap: Map<string, number>;

  // 子节点映射：parentId → 直接子节点 id 列表
  childrenMap: Map<string | null, string[]>;

  // 根节点 ID 列表
  rootIds: string[];
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
  /** 默认展开的节点 key 列表 */
  defaultExpandedKeys?: string[];
  /** 默认勾选的节点 key 列表（checkbox） */
  defaultCheckedKeys?: string[];
  /** checkStrictly 模式：父子勾选不再联动，无半选状态 */
  checkStrictly?: boolean;
  /** 默认选中的节点 key（单选，只取第一个） */
  defaultSelectedKeys?: string[];
  /** 字段映射配置 */
  fieldMapper?: FieldMapper;
}

// 默认配置常量
export const DEFAULT_TREE_OPTIONS: Required<TreeOptions> = {
  checkable: false,
  accordion: false,
  filterable: false,
  searchable: false,
  defaultExpandedKeys: [],
  defaultCheckedKeys: [],
  checkStrictly: false,
  defaultSelectedKeys: [],
  fieldMapper: { ...DEFAULT_FIELD_MAPPER }
};
