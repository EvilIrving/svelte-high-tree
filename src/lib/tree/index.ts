// Types
export type { RawNode, FlatNode, TreeIndex, CheckState, VirtualListState, SearchResult } from './types';
export type { SearchConfig, NavigateResult } from '@light-cat/treekit-svelte';

// Core functions
export { buildFlatTree, getAncestorIds, getSubtreeIds } from './flatten';
export {
  computeVisibleNodes,
  computeFilteredVisibleNodes,
  toggleExpand,
  expandToNode,
  toggleSubtree,
  expandMultiple
} from './visibility';
export {
  toggleCheck,
  getCheckState,
  checkNodes,
  uncheckNodes,
  checkAll,
  uncheckAll,
  getCheckedLeafIds
} from './checkbox';

// Controllers
export { VirtualListController, calculateVisibleRange, getNodeCheckState } from '@light-cat/treekit-svelte';
export { SearchController, searchSync, SearchNavigator, createSearchNavigator } from '@light-cat/treekit-svelte';

// Config
export { defaultSearchConfig, createSearchConfig } from '@light-cat/treekit-svelte';

// Manager
export { TreeManager, createTreeManager } from './tree-manager.svelte';

// Test utilities
export { generateTestData, generateFileSystemData, generateOrderedTestData } from './test-data';
