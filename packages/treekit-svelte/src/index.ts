// Tree 组件
export { Tree, TreeNodeView, createTree } from './tree';

// 虚拟滚动组件
export { VirtualList, VirtualTree } from './virtual';

// 搜索导航（Svelte 专用，使用 runes）
export { SearchNavigator, createSearchNavigator, type NavigateResult } from './search';

// 从 core 重新导出（便于用户使用）
export { SearchController, searchSync, type SearchResult } from '@light-cat/treekit-core';
export { DEFAULT_SEARCH_CONFIG, createSearchConfig, type SearchConfig } from '@light-cat/treekit-core';
export { VirtualListController, calculateVisibleRange, getCheckState, type VirtualListState } from '@light-cat/treekit-core';
export type { TreeNode, RawNode, TreeOptions, NodeStatus, CheckState } from '@light-cat/treekit-core';
