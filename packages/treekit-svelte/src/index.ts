export { createTree } from './createTree.svelte';
export { default as Tree } from './Tree.svelte';
export { default as TreeNode } from './TreeNode.svelte';
export { default as VirtualTree } from './VirtualTree.svelte';

// 搜索功能
export { SearchController, searchSync, type SearchResult } from './search';
export { SearchNavigator, createSearchNavigator, type NavigateResult } from './search-navigator.svelte';
export { defaultSearchConfig, createSearchConfig, type SearchConfig } from './search-config';

// 虚拟列表
export { VirtualListController, calculateVisibleRange, getNodeCheckState, type VirtualListState } from './virtual-list';

export type { FlatNode, RawNode, TreeOptions, NodeStatus, CheckState } from '@light-cat/treekit-core';
