// Types
export type { RawNode, FlatNode, TreeIndex, CheckState, VirtualListState, SearchResult } from './types';

// Core functions
export { buildFlatTree, getAncestorIds, getSubtreeIds } from './flatten';
export {
  computeVisibleNodes,
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
export { VirtualListController, calculateVisibleRange } from './virtual-list';
export { SearchController, searchSync } from './search-controller';

// Manager
export { TreeManager, createTreeManager } from './tree-manager.svelte';

// Test utilities
export { generateTestData, generateFileSystemData, generateOrderedTestData } from './test-data';
