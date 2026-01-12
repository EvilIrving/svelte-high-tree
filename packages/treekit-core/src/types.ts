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
  /** 图标字段名，默认 'icon'（可选） */
  icon?: string;
}

// ============ 原始数据（后端返回） ============
export interface RawNode {
  [key: string]: unknown;
  id: string;
  name: string;
  parentId: string | null;
}

// ============ 勾选状态 ============
export type CheckState = 'checked' | 'unchecked' | 'indeterminate';

// ============ 搜索结果 ============
export interface SearchResult {
  matchIds: Set<string>;
  expandIds: Set<string>;
}

// 默认配置常量
export const DEFAULT_FIELD_MAPPER: Required<FieldMapper> = {
  id: 'id',
  parentId: 'parentId',
  name: 'name',
  children: 'children',
  icon: 'icon'
};

// ============ 导出节点状态（供 UI 使用） ============
export interface NodeStatus {
  isExpanded: boolean;
  isChecked: boolean;
  isIndeterminate: boolean;
  isVisible: boolean;
  visibleIndex: number;
}
