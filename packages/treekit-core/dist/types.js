// 默认配置常量
export const defaultFieldMapper = {
    id: 'id',
    parentId: 'parentId',
    name: 'name',
    children: 'children'
};
export const defaultTreeOptions = {
    checkable: false,
    accordion: false,
    filterable: false,
    defaultExpandedIds: [],
    defaultCheckedIds: [],
    fieldMapper: { ...defaultFieldMapper }
};
