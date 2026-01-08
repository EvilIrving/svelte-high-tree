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
export interface RawNode {
    [key: string]: unknown;
    id: string;
    name: string;
    parentId: string | null;
}
export interface FlatNode {
    id: string;
    name: string;
    parentId: string | null;
    depth: number;
    index: number;
    subtreeEnd: number;
    hasChildren: boolean;
}
export interface TreeIndex {
    nodeMap: Map<string, FlatNode>;
    indexMap: Map<string, number>;
    childrenMap: Map<string | null, string[]>;
    rootIds: string[];
}
export type CheckState = 'checked' | 'unchecked' | 'indeterminate';
export interface SearchResult {
    matchIds: Set<string>;
    expandIds: Set<string>;
}
export interface TreeOptions {
    /** 启用 checkbox 功能 */
    checkable?: boolean;
    /** 手风琴模式（同级只展开一个） */
    accordion?: boolean;
    /** 启用过滤/搜索功能 */
    filterable?: boolean;
    /** 默认展开的节点 ID 列表 */
    defaultExpandedIds?: string[];
    /** 默认选中的节点 ID 列表 */
    defaultCheckedIds?: string[];
    /** 字段映射配置 */
    fieldMapper?: FieldMapper;
}
export declare const defaultFieldMapper: Required<FieldMapper>;
export declare const defaultTreeOptions: Required<TreeOptions>;
export interface NodeStatus {
    isExpanded: boolean;
    isChecked: boolean;
    isIndeterminate: boolean;
    isVisible: boolean;
    visibleIndex: number;
}
