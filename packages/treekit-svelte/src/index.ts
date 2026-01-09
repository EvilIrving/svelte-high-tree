export { createTree } from './createTree.svelte';
export { default as Tree } from './Tree.svelte';
export { default as TreeNode } from './TreeNode.svelte';
export { default as VirtualTree } from './VirtualTree.svelte';

// 搜索功能（核心逻辑）
export { SearchController, searchSync, type SearchResult } from '@light-cat/treekit-core';
export { DEFAULT_SEARCH_CONFIG, createSearchConfig, type SearchConfig } from '@light-cat/treekit-core';

// 搜索导航（Svelte 专用，使用 runes）
export { SearchNavigator, createSearchNavigator, type NavigateResult } from './search-navigator.svelte';

// 虚拟列表（核心逻辑）
export { VirtualListController, calculateVisibleRange, getNodeCheckState, type VirtualListState } from '@light-cat/treekit-core';

export type { FlatNode, RawNode, TreeOptions, NodeStatus, CheckState } from '@light-cat/treekit-core';
