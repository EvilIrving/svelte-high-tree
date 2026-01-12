// Types
export type {
  RawNode,
  NodeStatus,
  FieldMapper,
  CheckState
} from './types';
export { DEFAULT_FIELD_MAPPER } from './types';

export type {
  TreeNode,
  TreeIndex,
  TreeOptions
} from './core/types';
export { DEFAULT_TREE_OPTIONS } from './core/types';

// Core
export { TreeEngine } from './core/TreeEngine';

// Algorithms
export {
  buildFlatTree,
  getAncestorIDs,
  getAncestorSet,
  getSubtreeIDs
} from './algorithms/flatten';

export {
  computeVisibleNodes,
  computeFilteredVisibleNodes,
  toggleExpand,
  expandToNode,
  expandMultiple,
  collapseSiblings
} from './algorithms/visibility';

export {
  toggleCheck,
  getCheckState,
  checkAll,
  uncheckAll,
  getCheckedLeafIDs
} from './algorithms/checkbox';

// Virtual List
export {
  VirtualListController,
  calculateVisibleRange,
  type VirtualListState
} from './virtual-list';

// Search
export { SearchController, searchSync, type SearchResult } from './search';
export { DEFAULT_SEARCH_CONFIG, createSearchConfig, type SearchConfig } from './search/config';
